import { useAddress, useContract, useBalance, Web3Button, useContractWrite, useContractRead, ThirdwebProvider, useConnectionStatus, useNetworkMismatch } from "@thirdweb-dev/react";
import { Avatar, Button, Descriptions, InputNumber, Tag, Tooltip, Modal, Divider } from 'antd';
import { SelectOutlined } from '@ant-design/icons';
import { BigNumber, ethers, utils } from "ethers";
import { chainSelectorIdToExplorerAddress, nativeAddress, showOnlyTwoDecimals, getAssetIcon, SelectorIdToChainId, Chain, PayFeesIn } from "./utils";
import { useContext, useEffect, useState } from "react";
import { MumbaiChain } from "../pages/_app";
import ChainContext from "../context/chain";
const SIDE_ABI = require("../.././artifacts/contracts/SidechainDeposit.sol/SidechainDeposit").abi;
import SIDE_ABI2 from "../../artifacts/contracts/SidechainDeposit.sol/SidechainDeposit.json";
import { ContractInterface } from "ethers/lib/ethers";

console.log("MumbaiChain", SIDE_ABI);
export default function SideChainTokenDescriptions({ address, etfAddress, bundle, requiredTokenStruct, chainSelectorId }:
    { address: string, etfAddress?: string, bundle: any, requiredTokenStruct: any, chainSelectorId: any, }): JSX.Element {
    const { selectedChain, setSelectedChain } = useContext(ChainContext);
    const connectionStatus = useConnectionStatus();
    //  Refactor this to use the new requiredTokenStructs and match addresses to the requiredTokenStructs on primary chain
    const index = 0;
    const userAddress = useAddress();
    const [quantities, setQuantities] = useState<any>({});
    const [requestPending, setRequestPending] = useState(false);
    const { contract: sideChainContract, isLoading: isSideChainContractLoading, error: isSideChainContractError } = useContract(etfAddress, SIDE_ABI as ContractInterface);

    const linkAddressMumbai = "0x326C977E6efc84E512bB9C30f76E30c160eD06FB";

    address = "0xdE617C9DaDDF41EbD739cA57eBbA607C11ba902d";
    etfAddress = "0x4c0a47b0c3a16291AC32040740687dd5F06a42F3";
    // etfAddress = "0xf33EDdcc0F79232DE20fbE59F1D814678161D79c"; //old

    const { mutateAsync: depositFundsAndNotify, isLoading: isLoadingDeposit, error: errorDeposit } = useContractWrite(
        sideChainContract,
        "depositFundsAndNotify"
    );

    const { data: balance, isLoading: balanceLoading, error: balanceError } = useBalance(
        address,
    );
    const { contract, isLoading: isContractLoading, error: isContractError } = useContract(address);
    const { contract: linkContract, isLoading: isLinkContractLoading, error: isLinkContractError } = useContract(linkAddressMumbai);

    const { mutateAsync: approve, isLoading, error } = useContractWrite(contract, "approve");

    const { mutateAsync: approveLink, isLoading: linkLoading, error: linkError } = useContractWrite(linkContract, "approve");

    useContract


    const { data: allowance, isLoading: isAllowanceLoading, error: nameError } = useContractRead(contract, "allowance", [userAddress, etfAddress]);

    useEffect(() => {
        // export declare function useSetConnectionStatus(): (status: "unknown" | "connected" | "disconnected" | "connecting") => void;
        if (connectionStatus !== "connected") return;
        setSelectedChain(Chain.Mumbai);
    }, [connectionStatus, selectedChain, setSelectedChain])


    useEffect(() => {
        if (connectionStatus !== "connected") return;
        setRequestPending(false);
    }
        , [connectionStatus])

    return <div
        className="card"
        style={{
            width: "85%",
            padding: 20,
        }
        }
    >
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
                                <SelectOutlined style={{ fontSize: '14px', color: '#08c' }} onClick={() => { window.open(`${chainSelectorIdToExplorerAddress[chainSelectorId.toString()]}/${address}`, "_blank") }} />
                            </Tooltip>
                        }
                    </span>
                </div>
            }>
            {/* over appea text see on explore */}

            <Descriptions.Item label="Quantity Locked">
                Fecthing
            </Descriptions.Item>

            <Descriptions.Item label="Balance">
                {balanceLoading && <Tag color="processing">Loading...</Tag>}
                {!balanceError && !balanceLoading && balance && <Tag color="success">{showOnlyTwoDecimals(balance.displayValue)} {balance.symbol}</Tag>}
            </Descriptions.Item>


            <Descriptions.Item label="Quantity to Lock">
                <InputNumber />
            </Descriptions.Item>

            <Descriptions.Item label="Allowance">
                {nativeAddress === address && <Tag color="blue">∞</Tag>}
                {nativeAddress !== address && isAllowanceLoading && <Tag color="processing">Loading...</Tag>}
                {!nameError && !isAllowanceLoading && allowance && <Tag color="blue">{showOnlyTwoDecimals(utils.formatUnits(allowance, 18))}</Tag>}
                {nativeAddress !== address && !nameError && !isAllowanceLoading && allowance && <Button type="link" size="small" onClick={() => {
                    approve({
                        args: [etfAddress, BigNumber.from(20).mul(BigNumber.from(10).pow(18))
                            // BigNumber.from(getRequiredAsset(address)?.totalAmount || 0)
                        ]
                    })
                }
                }>Approve More Tokens</Button>
                }
            </Descriptions.Item>
        </Descriptions>

        <Divider />
        <Descriptions
            column={2}
        >
            <Descriptions.Item label="Link Approve">
                <Button type="link" size="small" onClick={() => {
                    approveLink({
                        args: [etfAddress, BigNumber.from(2).mul(BigNumber.from(10).pow(18))]
                    })
                }
                }>Approve Link Tokens</Button>
            </Descriptions.Item>
            {/* <Descriptions.Item label="Quantity Locked">{BigNumber.from(bundle[0][index] || 0).div(BigNumber.from(10).pow(16)).toNumber() / 100} / {BigNumber.from(getRequiredAsset(address)?.totalAmount || 0).div(BigNumber.from(10).pow(16)).toNumber() / 100}</Descriptions.Item> */}


            <Descriptions.Item label="Balance">
                {balanceLoading && <Tag color="processing">Loading...</Tag>}
                {!balanceError && !balanceLoading && balance && <Tag color="success">{showOnlyTwoDecimals(balance.displayValue)} {balance.symbol}</Tag>}
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
                        Number(ethers.utils.formatEther(BigNumber.from(getRequiredAsset(address)?.totalAmount || 0).sub(BigNumber.from(bundle[0][index] || 0))))
                        : Number(BigNumber.from(getRequiredAsset(address)?.totalAmount || 0).sub(BigNumber.from(bundle[0][index] || 0)).div(BigNumber.from(10).pow(18)))

                }
                onChange={(value: any) => {
                    const newQuantities = { ...quantities };
                    newQuantities[address] = value;
                    setQuantities(newQuantities);
                }}
            />
        </Descriptions.Item> */}

            <Descriptions.Item label="Token">
                <Button
                    onClick={() =>
                        depositFundsAndNotify({
                            args: [23,
                                [
                                    {
                                        assetContract: "0xdE617C9DaDDF41EbD739cA57eBbA607C11ba902d",
                                        tokenType: 0,
                                        tokenId: 0,
                                        totalAmount: BigNumber.from(6).mul(BigNumber.from(10).pow(18)),
                                    },
                                ],
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
    </div>
}