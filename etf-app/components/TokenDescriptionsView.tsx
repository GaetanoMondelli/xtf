import { useAddress, useContract, useBalance, Web3Button, useContractWrite, useContractRead } from "@thirdweb-dev/react";
import styles from '../styles/page.module.css'
import { Avatar, Button, Descriptions, InputNumber, Tag, Tooltip } from 'antd';
import { SelectOutlined } from '@ant-design/icons';
import { BigNumber, ethers, utils } from "ethers";
import { minimiseAddress, nativeAddress, showOnlyTwoDecimals, getAssetIcon } from "./utils";



export default function TokenDescriptions({ address, etfAddress, bundle, index, setQuantities, requiredTokenStructs, chainSelectorId }:
    { address: string, etfAddress?: string, bundle: any, index: number, setQuantities: any, requiredTokenStructs: any, chainSelectorId: any }) {

    const userAddress = useAddress();
    const { data: balance, isLoading: balanceLoading, error: balanceError } = useBalance(
        address,
    );
    const { contract, isLoading: isContractLoading, error: isContractError } = useContract(address);
    const { mutateAsync: approve, isLoading, error } = useContractWrite(contract, "approve");

    const { data: allowance, isLoading: isAllowanceLoading, error: nameError } = useContractRead(contract, "allowance", [userAddress, etfAddress]);

    // https://sepolia.etherscan.io/address/0x39C07e48dfCAfd49A6e4be9ca0164c5Be9A505fc#readContract

    const getRequiredAsset = (address: string) => {
        return requiredTokenStructs ? requiredTokenStructs.find((asset: any) => asset.assetContract === address) : [];
    }

    const isOnExternalChain = getRequiredAsset(address)?.chainSelector.toString() !== chainSelectorId.toString();

    return <Descriptions
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
                    {isOnExternalChain &&
                        <Tag color="orange">This asset is collected on a different chain with Selector Id = {getRequiredAsset(address)?.chainSelector.toString()}</Tag>}
                </span>
                {/* over appea text see on explore */}
                {address !== nativeAddress &&
                    <Tooltip title={`See ${balance?.symbol} on Etherscan`}>
                        <SelectOutlined style={{ fontSize: '14px', color: '#08c' }} onClick={() => { window.open(`https://sepolia.etherscan.io/address/${address}`, "_blank") }} />
                    </Tooltip>}
            </div>
        }>
        <Descriptions.Item label="Quantity Locked">{BigNumber.from(bundle[0][index] || 0).div(BigNumber.from(10).pow(16)).toNumber() / 100} / {BigNumber.from(getRequiredAsset(address)?.totalAmount || 0).div(BigNumber.from(10).pow(16)).toNumber() / 100}</Descriptions.Item>
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
                onChange={(value) => {
                    setQuantities((prev: any) => {
                        prev.set(address, Number(value));
                        return new Map(prev);
                    });
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
    </Descriptions>



}