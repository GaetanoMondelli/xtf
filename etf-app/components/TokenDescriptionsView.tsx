import { useAddress, useContract, useBalance, Web3Button, useContractWrite, useContractRead } from "@thirdweb-dev/react";
import { Avatar, Button, Descriptions, InputNumber, Tag, Tooltip, Modal, Progress, Carousel, Card, List } from 'antd';
import { SelectOutlined } from '@ant-design/icons';
import { BigNumber, ethers, utils } from "ethers";
import { chainSelectorIdToExplorerAddress, nativeAddress, showOnlyTwoDecimals, getAssetIcon, SelectorIdToChainId, matchDepositFundMessage, minimiseAddress } from "./utils";
import SideChainTokenDescriptions from "./SideChainTokenDescriptionsView";
import { useContext, useEffect, useState } from "react";
import ChainContext from "../context/chain";


export default function TokenDescriptions({ bundleId, address, etfAddress, bundle, index, quantities, setQuantities, requiredTokenStructs, chainSelectorId, currentConfig, userDeposit }:
    { bundleId: number, address: string, etfAddress?: string, bundle: any, index: number, quantities: any, setQuantities: any, requiredTokenStructs: any, chainSelectorId: any, currentConfig: any, userDeposit: any }) {

    const userAddress = useAddress();
    const { selectedChain, setSelectedChain } = useContext(ChainContext);

    const [modalVisible, setModalVisible] = useState(false);
    const [messages, setMessages] = useState<any>();


    useEffect(() => {
        const getMessages = () => {
            if (!userDeposit) return;
            const messages: any = matchDepositFundMessage(userDeposit[2], BigNumber.from(bundleId), address);
            setMessages(messages);
        }
        getMessages();
    }, [userDeposit]);

    const { data: balance, isLoading: balanceLoading, error: balanceError } = useBalance(
        address,
    );
    const { contract, isLoading: isContractLoading, error: isContractError } = useContract(address);
    const { contract: etfContract, isLoading: isEtfContractLoading, error: isEtfContractError } = useContract(etfAddress);
    const { mutateAsync: updateBundleAfterReceive, isLoading: updateBundleAfterReceiveLoading, error: updateBundleAfterReceiveError } = useContractWrite(etfContract, "updateBundleAfterReceive");

    const { mutateAsync: approve, isLoading, error } = useContractWrite(contract, "approve");

    const { data: allowance, isLoading: isAllowanceLoading, error: nameError } = useContractRead(contract, "allowance", [userAddress, etfAddress]);

    // https://sepolia.etherscan.io/address/0x39C07e48dfCAfd49A6e4be9ca0164c5Be9A505fc#readContract

    const getRequiredAsset = (address: string) => {
        return requiredTokenStructs ? requiredTokenStructs.find((asset: any) => asset.assetContract === address) : [];
    }

    const isOnExternalChain = getRequiredAsset(address)?.chainSelector.toString() !== chainSelectorId?.toString();

    return <>
        <Descriptions
            style={{
                width: 850,
            }}

            column={2}
            title={
                <div
                    style={{
                        display: "flex",
                        gap: 5,
                        alignItems: "center",
                    }}
                >
                    <div>
                        <Avatar
                            size={40}
                            src={getAssetIcon(address)}
                            className="avatar"
                            style={
                                {
                                    marginRight: 12,
                                    marginLeft: 10,
                                    marginBottom: 10,
                                }
                            }
                        >{balance?.symbol}</Avatar>
                    </div>
                    <span>{balance?.symbol}&nbsp;
                        {address !== nativeAddress &&
                            <Tooltip title={`See ${balance?.symbol} on Etherscan`}>
                                <SelectOutlined style={{ fontSize: '14px', color: '#08c' }} onClick={() => { window.open(`${chainSelectorIdToExplorerAddress[getRequiredAsset(address)?.chainSelector.toString()]}/${address}`, "_blank") }} />
                            </Tooltip>
                        }
                        &nbsp;
                        {isOnExternalChain &&
                            <Tag color="orange">This asset is collected on a different chain with Selector Id = {getRequiredAsset(address)?.chainSelector.toString()} instead of {
                                chainSelectorId?.toString()
                            }
                            </Tag>}
                    </span>
                    {/* over appea text see on explore */}

                </div>
            }>
            <Descriptions.Item label="Quantity Locked">{BigNumber.from(bundle[0][index] || 0).div(BigNumber.from(10).pow(16)).toNumber() / 100} / {BigNumber.from(getRequiredAsset(address)?.totalAmount || 0).div(BigNumber.from(10).pow(16)).toNumber() / 100}</Descriptions.Item>
            {isOnExternalChain && <Descriptions.Item label="Open Side Chain">
                <Button type="primary" size="small" onClick={() => {
                    // setModalVisible(true);
                    setSelectedChain(SelectorIdToChainId[getRequiredAsset(address)?.chainSelector.toString()]);
                }}
                >Open Side Chain
                </Button>
            </Descriptions.Item>
            }
            {isOnExternalChain && <><Descriptions.Item span={2} label="Quantity Locked on Side Chain"><></>
            </Descriptions.Item>
                <Descriptions.Item span={2} >
                    <br></br>
                    <Progress
                        style={{ width: '94%' }}
                        strokeColor={"orange"}
                        percent={
                            Number(BigNumber.from(messages?.sum || 0))
                        }></Progress>
                    {/* {JSON.stringify(messages)} */}
                </Descriptions.Item>
                <Descriptions.Item span={2} label="Side Chain Messages">
                    <Button type="primary" size="small"
                        disabled={messages?.messages?.length === 0}
                        onClick={() => {
                            updateBundleAfterReceive({
                                args: [bundleId]
                            })
                        }
                        }
                    >Commit Messages on Primary Chain</Button>
                </Descriptions.Item>

                <Descriptions.Item span={2}>
                    <List
                        // grey background
                        style={{
                            width: '94%',
                            padding: '3%',
                            overflowY: 'auto',
                            backgroundColor: '#f7f7f7'
                        }}
                        grid={{ gutter: 12, column: 2 }}
                        dataSource={messages?.messages || []}
                        renderItem={(item: any) => (
                            <List.Item>
                                <Card
                                    className="customcard"
                                    size="small"
                                    title={
                                        <>
                                            {`CCIP MessageId:`}<a
                                                style={{
                                                    color: 'blue'
                                                }}
                                                href={`https://ccip.chain.link/msg/${item?.messageId}`}
                                                target="_blank" rel="noreferrer">{minimiseAddress(item?.messageId)}</a>
                                        </>
                                    }>
                                    <p>{`Sender: ${minimiseAddress(item.sender)}`}</p>
                                    <p>{`Bundle ID: ${item.depositFundMessage.bundleId}`}</p>
                                    {
                                        item.depositFundMessage.tokensToWrap.map((token: any, index: number) => {
                                            return <p>{`Token Address: ${minimiseAddress(token.assetContract)} Qt: ${BigNumber.from(token.totalAmount).div(
                                                BigNumber.from(10).pow(18)
                                            ).toString()}`}</p>
                                        })
                                    }
                                    {/* <p>{`Amount: ${item.depositFundMessage.totalAmount?.toString()}`}</p> */}

                                </Card>
                            </List.Item>
                        )}
                    />
                </Descriptions.Item>
            </>

            }

            {!isOnExternalChain && <Descriptions.Item label="Balance">
                {balanceLoading && <Tag color="processing">Loading...</Tag>}
                {!balanceError && !balanceLoading && balance && <Tag color="success">{showOnlyTwoDecimals(balance.displayValue)} {balance.symbol}</Tag>}
            </Descriptions.Item>
            }


            {!isOnExternalChain && <Descriptions.Item label="Quantity to Deposit">
                <InputNumber
                    style={{
                        marginLeft: 20
                    }}
                    defaultValue={0}
                    min={0}
                    max={
                        address === nativeAddress ?
                            Number(ethers.utils.formatEther(BigNumber.from(getRequiredAsset(address)?.totalAmount || 0).sub(BigNumber.from(bundle[0][index] || 0))))
                            : Number(BigNumber.from(getRequiredAsset(address)?.totalAmount || 0).sub(BigNumber.from(bundle[0][index] || 0)).div(BigNumber.from(10).pow(18)))

                    }
                    onChange={(value: any) => {
                        const newQuantities = { ...quantities };
                        newQuantities[address] = value;
                        setQuantities(newQuantities);
                    }}
                />
            </Descriptions.Item>
            }
            {!isOnExternalChain && <Descriptions.Item label="Allowance">
                {nativeAddress === address && <Tag color="blue">∞</Tag>}
                {nativeAddress !== address && isAllowanceLoading && <Tag color="processing">Loading...</Tag>}
                {!nameError && !isAllowanceLoading && allowance && <Tag color="blue">{showOnlyTwoDecimals(utils.formatUnits(allowance, 18))}</Tag>}
                {nativeAddress !== address && !nameError && !isAllowanceLoading && allowance && <Button type="link" size="small" onClick={() => {
                    approve({
                        args: [etfAddress,
                            BigNumber.from(getRequiredAsset(address)?.totalAmount || 0)
                        ]
                    })
                }
                }>Approve More Tokens</Button>
                }
            </Descriptions.Item>
            }
        </Descriptions >


        {/* 
        {modalVisible && <Modal
            title="Open Side Chain"
            visible={modalVisible}
            onCancel={() => {
                setModalVisible(false);
            }}
            onOk={() => {
                window.open(
                    `${chainSelectorIdToExplorerAddress[getRequiredAsset(address)?.chainSelector.toString()]}`,
                    "_blank"
                );
            }}
        >
            <p>Chain Selector: {getRequiredAsset(address)?.chainSelector.toString()}</p>
            <p>Chain Id: {SelectorIdToChainId[getRequiredAsset(address)?.chainSelector.toString()]}</p>
            <p>
                Chain Explorer: {chainSelectorIdToExplorerAddress[getRequiredAsset(address)?.chainSelector.toString()]}
            </p>
            <p>
                Address contract {currentConfig.sideChainContracts[getRequiredAsset(address)?.chainSelector.toString()]['FungibleToken'][0].address}
            </p>
            <SideChainTokenDescriptions
                address={address}
                etfAddress={currentConfig.sideChainContracts[getRequiredAsset(address)?.chainSelector.toString()]['SidechainDeposit'][0].address}
                bundle={bundle}
                requiredTokenStruct={getRequiredAsset(address)}
                chainSelectorId={getRequiredAsset(address)?.chainSelector}
            />
        </Modal>
        } */}
    </>
}