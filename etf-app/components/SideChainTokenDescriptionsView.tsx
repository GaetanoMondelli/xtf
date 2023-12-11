import { useAddress, useContract, useBalance, Web3Button, useContractWrite, useContractRead, ThirdwebProvider, useConnectionStatus, useNetworkMismatch } from "@thirdweb-dev/react";
import { Avatar, Button, Descriptions, InputNumber, Tag, Tooltip, Modal, Divider, Layout, Progress, List, Card } from 'antd';
import { SelectOutlined } from '@ant-design/icons';
import { BigNumber, ethers, utils } from "ethers";
import { SIDE_ABI, chainSelectorIdToExplorerAddress, nativeAddress, showOnlyTwoDecimals, getAssetIcon, SelectorIdToChainId, Chain, PayFeesIn, matchDepositFundMessage, minimiseAddress } from "./utils";
import { useContext, useEffect, useState } from "react";
import { MumbaiChain } from "../pages/_app";
import ChainContext from "../context/chain";

export default function SideChainTokenDescriptions({ address, etfAddress, bundleId, requiredTokenStruct, chainSelectorId }:
    { address: string, etfAddress?: string, bundleId: any, requiredTokenStruct: any, chainSelectorId: any, }): JSX.Element {
    const { selectedChain, fungibleTokenAbi, setSelectedChain, sideAbi } = useContext(ChainContext);
    const connectionStatus = useConnectionStatus();
    //  Refactor this to use the new requiredTokenStructs and match addresses to the requiredTokenStructs on primary chain
    const index = 0;
    const userAddress = useAddress();
    const [quantities, setQuantities] = useState<any>({});
    const [messages, setMessages] = useState<any>();


    const { contract: sideChainContract, isLoading: isSideChainContractLoading, error: isSideChainContractError } = useContract(etfAddress, sideAbi);


    const linkAddressMumbai = "0x326C977E6efc84E512bB9C30f76E30c160eD06FB";

    // address = "0xdE617C9DaDDF41EbD739cA57eBbA607C11ba902d";
    // etfAddress = "0x4c0a47b0c3a16291AC32040740687dd5F06a42F3";


    const { data: bundle, isLoading: countLoading, error: countError } = useContractRead(
        sideChainContract,
        "getTokensBundle", [bundleId]
    );


    const { data: burner, isLoading: burnerLoading, error: burnerError } = useContractRead(
        sideChainContract,
        "burner", [bundleId]
    );

    const { data: fee, isLoading: feeLoading, error: feeError } = useContractRead(
        sideChainContract,
        "getFee",
        [
            BigNumber.from("16015286601757825753"),
            userAddress,
            {
                "userSender": userAddress,
                "bundleId": bundleId,
                "tokensToWrap": Object.keys(quantities).map((key: string) => {
                    return {
                        assetContract: key,
                        tokenType: 0,
                        tokenId: 0,
                        totalAmount: BigNumber.from(quantities[key] || 0).mul(BigNumber.from(10).pow(18)),
                    }
                }) || [],
            },
            PayFeesIn.LINK,
        ],
    );

    // getDepositFee

    const { data: requiredAssets, isLoading: requiredAssetLoading, error: requiredAssetError } = useContractRead(
        sideChainContract,
        "getRequiredAssets", []
    );

    const { mutateAsync: depositFundsAndNotify, isLoading: isLoadingDeposit, error: errorDeposit } = useContractWrite(
        sideChainContract,
        "depositFundsAndNotify"
    );

    const { data: balance, isLoading: balanceLoading, error: balanceError } = useBalance(
        address,
    );
    const { contract, isLoading: isContractLoading, error: isContractError } = useContract(address, fungibleTokenAbi);
    
    const { mutateAsync: mint, isLoading: mintLoading, error: mintError } = useContractWrite(contract, "mint");

    const { contract: linkContract, isLoading: isLinkContractLoading, error: isLinkContractError } = useContract(linkAddressMumbai);

    const { mutateAsync: approve, isLoading, error } = useContractWrite(contract, "approve");

    const { mutateAsync: approveLink, isLoading: linkLoading, error: linkError } = useContractWrite(linkContract, "approve");

    const { mutateAsync: transferLink, isLoading: transferLinkLoading, error: transferLinkError } = useContractWrite(linkContract, "transfer");

    const { data: linkBalance, isLoading: linkBalanceLoading, error: linkBalanceError } = useBalance(
        linkAddressMumbai,
    );

    // link balance of etf contract
    const { data: linkContractBalance, isLoading: linkContractBalanceLoading, error: linkContractBalanceError } = useContractRead(
        linkContract,
        "balanceOf", [etfAddress]
    );



    useEffect(() => {
        const getMessages = () => {
            if (!bundle) return;
            const messages: any = matchDepositFundMessage(bundle[2], BigNumber.from(bundleId), address);
            setMessages(messages);
        }
        getMessages();
    }, [address, bundleId]);


    const { data: allowance, isLoading: isAllowanceLoading, error: nameError } = useContractRead(contract, "allowance", [userAddress, etfAddress]);

    useEffect(() => {
        // export declare function useSetConnectionStatus(): (status: "unknown" | "connected" | "disconnected" | "connecting") => void;
        if (connectionStatus !== "connected") return;
        setSelectedChain(Chain.Mumbai);
    }, [connectionStatus, selectedChain, setSelectedChain])


    useEffect(() => {
        if (connectionStatus !== "connected") return;
    }, [connectionStatus])

    return <div
        className="card"
        style={{
            width: "100%",
            paddingTop: 50,
            paddingBottom: 50,
            paddingLeft: 30,
            paddingRight: 20,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
        }}
    >
        <Layout.Content>

            <h3>Vault {bundleId}</h3>
            {burner && <p>Burner: {burner}</p>}
            <br></br>
            {<p>
                {/* sxa{JSON.stringify(requiredAssets)} */}
                {/* {JSON.stringify(bundle[2])} */}
                {/* {Number(BigNumber.from(bundle[0][index] || 0))} */}
            </p>}
            {/* etf: {etfAddress} */}
        </Layout.Content>

        {requiredAssets && bundle && requiredAssets[1].map((requiredAsset: any, index: number) => {
            return <div
                key={'sideasset' + index}
                className="card"
                style={{
                    width: "95%",
                    paddingLeft: 30,
                    paddingRight: 20,
                }
                }
            >
                {/*  get keys of quantities */}
                <Descriptions
                    column={2}
                    title={
                        <div
                            style={{
                                marginTop: "4%",
                                display: "flex",
                                gap: 5,
                                alignItems: "center",
                            }}
                        >
                            <div>
                                <Avatar
                                    size={40}
                                    src={getAssetIcon(requiredAsset)}
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
                                        <SelectOutlined style={{ fontSize: '14px', color: '#08c' }} onClick={() => { window.open(`${chainSelectorIdToExplorerAddress[chainSelectorId.toString()]}/${address}`, "_blank") }} />
                                    </Tooltip>
                                }
                            </span>
                        </div>
                    }>
                    {/* over appea text see on explore */}

                    <Descriptions.Item label="Quantity Locked">{BigNumber.from(bundle[0][index] || 0).div(BigNumber.from(10).pow(16)).toNumber() / 100} / {BigNumber.from(requiredAssets[0][index] || 0).div(BigNumber.from(10).pow(16)).toNumber() / 100}</Descriptions.Item>

                    <Descriptions.Item label="Balance">
                        {balanceLoading && <Tag color="processing">Loading...</Tag>}
                        {!balanceError && !balanceLoading && balance &&

                            <>
                                <Tag color="success">{showOnlyTwoDecimals(balance.displayValue)} {balance.symbol}</Tag>
                                {nativeAddress !== address && <Button type="link"

                                    style={
                                        {
                                            color: 'green'
                                        }
                                    }
                                    size="small" onClick={() => {
                                        mint({
                                            args: [userAddress, BigNumber.from(100).mul(BigNumber.from(10).pow(18))],
                                        })
                                    }}>Mint (Faucet)</Button>}
                            </>
                        }
                    </Descriptions.Item>


                    {<Descriptions.Item label="Quantity to Deposit">
                        <InputNumber

                            style={{
                                marginLeft: 20
                            }}
                            defaultValue={0}
                            min={0}
                            max={
                                address === nativeAddress ?
                                    Number(ethers.utils.formatEther(BigNumber.from(requiredAssets[0][index] || 0).sub(BigNumber.from(bundle[0][index] || 0))))
                                    : Number(BigNumber.from(requiredAssets[0][index] || 0).sub(BigNumber.from(bundle[0][index] || 0)).div(BigNumber.from(10).pow(18)))

                            }
                            onChange={(value: any) => {
                                const newQuantities = { ...quantities };
                                newQuantities[address] = value;
                                setQuantities(newQuantities);
                                // quantities[address] = value;
                            }}

                        />
                        {/* {JSON.stringify(bundle)} */}
                    </Descriptions.Item>
                    }
                    <Descriptions.Item label="Allowance">
                        {nativeAddress === address && <Tag color="blue">∞</Tag>}
                        {nativeAddress !== address && isAllowanceLoading && <Tag color="processing">Loading...</Tag>}
                        {!nameError && !isAllowanceLoading && allowance && <Tag color="blue">{showOnlyTwoDecimals(utils.formatUnits(allowance, 18))}</Tag>}
                        {nativeAddress !== address && !nameError && !isAllowanceLoading && allowance && <Button type="link" size="small" onClick={() => {
                            approve({
                                args: [etfAddress, BigNumber.from(20).mul(BigNumber.from(10).pow(18))
                                    // BigNumber.from(requiredAssets[0][index] || 0)
                                ]
                            })
                        }
                        }>Approve More {balance?.symbol} Tokens</Button>
                        }
                    </Descriptions.Item>
                </Descriptions>
                <Layout.Content>
                    ⓘ Deposit Link and Notify action will deposit the link tokens to the sidechain contract and
                    notify ETF contract on the primary chain.
                    Communication between the two contracts is done via Chainlink CCIP and requires LINK tokens.
                    <Divider />


                    {fee && <p>Esitmated Fee for the transaction now: {BigNumber.from(fee || 0).div(
                        BigNumber.from(10).pow(16)
                    ).toNumber() / 100} LINK</p>}
                    {feeError && <p>Fee Error {JSON.stringify(feeError)}</p>}
                    {feeLoading && <p>Fee Loading...</p>}
                </Layout.Content>
                <Divider />
                <Descriptions
                    column={2}
                >
                    {/* <Descriptions.Item label="Link Approve">
                        <Button type="link" size="small" onClick={() => {
                            approveLink({
                                args: [etfAddress, BigNumber.from(2).mul(BigNumber.from(10).pow(18))]
                            })
                        }
                        }>Approve Link Tokens</Button>
                    </Descriptions.Item> */}

                    <Descriptions.Item label="Link Transfer">
                        <Button type="link" size="small" onClick={() => {
                            // transfer link tokens to etf contract
                            transferLink({
                                args: [etfAddress, BigNumber.from(5).mul(BigNumber.from(10).pow(18))]
                            })

                        }
                        }>Transfer LINK  Tokens</Button>
                    </Descriptions.Item>

                    <Descriptions.Item label="Your Link Balance">
                        {linkBalanceLoading && <Tag color="processing">Loading...</Tag>}
                        {!linkBalanceError && !linkBalanceLoading && linkBalance && <Tag color="success">{showOnlyTwoDecimals(linkBalance.displayValue)} {linkBalance.symbol}</Tag>}
                    </Descriptions.Item>
                    {/* <Descriptions.Item label="Quantity Locked">{BigNumber.from(bundle[0][index] || 0).div(BigNumber.from(10).pow(16)).toNumber() / 100} / {BigNumber.from(requiredAssets[0][index] || 0).div(BigNumber.from(10).pow(16)).toNumber() / 100}</Descriptions.Item> */}


                    <Descriptions.Item label="ETF Side Contract Balance">
                        {linkContractBalanceLoading && <Tag color="processing">Loading...</Tag>}
                        {!linkContractBalanceError && !linkContractBalanceLoading && linkContractBalance && <Tag color="success">
                            {linkContractBalance.div(BigNumber.from(10).pow(16)).toNumber() / 100} {linkBalance?.symbol}
                        </Tag>}
                    </Descriptions.Item>




                    {/* 
                    <Descriptions.Item label="Quantity to Deposit">
                        <InputNumber
                            style={{
                                marginLeft: 20
                            }}
                            defaultValue={0}
                            min={0}
                            max={
                                address === nativeAddress ?
                                    Number(ethers.utils.formatEther(BigNumber.from(requiredAssets[0][index] || 0).sub(BigNumber.from(bundle[0][index] || 0))))
                                    : Number(BigNumber.from(requiredAssets[0][index] || 0).sub(BigNumber.from(bundle[0][index] || 0)).div(BigNumber.from(10).pow(18)))

                            }
                            onChange={(value: any) => {
                                const newQuantities = { ...quantities };
                                newQuantities[address] = value;
                                setQuantities(newQuantities);
                            }}
                        />
                    </Descriptions.Item> */}

                    <Descriptions.Item label="Action">
                        <Button
                            style={{
                                marginLeft: 20
                            }}
                            type="primary"
                            size="small"

                            disabled={
                                isLoadingDeposit ||
                                !quantities[address] ||
                                quantities[address] === 0 ||
                                BigNumber.from(bundle[0][index] || 0).eq(BigNumber.from(requiredAssets[0][index] || 0))
                            }

                            onClick={() =>
                                depositFundsAndNotify({
                                    args: [bundleId,
                                        Object.keys(quantities).map((key: string) => {
                                            return {
                                                assetContract: key,
                                                tokenType: 0,
                                                tokenId: 0,
                                                totalAmount: BigNumber.from(quantities[key] || 0).mul(BigNumber.from(10).pow(18)),
                                            }
                                        }),
                                        PayFeesIn.LINK,
                                        false,
                                    ],
                                    overrides: {
                                        value: ethers.utils.parseEther(quantities[nativeAddress]?.toString() || "0"),
                                    }
                                })
                            }
                        >
                            Deposit & Notify
                        </Button>
                    </Descriptions.Item>
                </Descriptions >
                <List
                    // grey background
                    style={{
                        width: '94%',
                        padding: '3%',
                        overflowY: 'auto',
                        backgroundColor: '#f7f7f7'
                    }}
                    grid={{ gutter: 20, column: 3 }}
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
                                        return <p
                                            key={'depositFundMessage-token' + index}
                                        >{`Token Address: ${minimiseAddress(token.assetContract)} Qt: ${BigNumber.from(token.totalAmount).div(
                                            BigNumber.from(10).pow(18)
                                        ).toString()}`}</p>
                                    })
                                }
                                {/* <p>{`Amount: ${item.depositFundMessage.totalAmount?.toString()}`}</p> */}

                            </Card>
                        </List.Item>
                    )}
                />
                <Progress
                    // orange
                    strokeColor={"#ff7f00"}
                    percent={
                        BigNumber.from(bundle[0][index] || 0).mul(BigNumber.from(100)).div(BigNumber.from(requiredAssets[0][index] || 0)).toNumber()}
                ></Progress>
            </div>
        })}
    </div>
}