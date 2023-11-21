import { useAddress, useContract, useBalance, Web3Button, useContractWrite, useContractRead } from "@thirdweb-dev/react";
import styles from '../styles/page.module.css'
import { Button, Descriptions, InputNumber, Tag } from 'antd';
import style from '../styles/page.module.css';
import { BigNumber, ethers, utils } from "ethers";
import { minimiseAddress, getRequiredAsset, nativeAddress, showOnlyTwoDecimals } from "./utils";

const ABI = require("../.././artifacts/contracts/TokenWrapped.sol/FungibleToken.json").abi;


export default function TokenDescriptions({ address, etfAddress, bundle, index, setQuantities }:
    { address: string, etfAddress?: string, bundle: any, index: number, setQuantities: any }) {

    const userAddress = useAddress();
    const { data: balance, isLoading: balanceLoading, error: balanceError } = useBalance(
        address,
    );
    const { contract, isLoading: isContractLoading, error: isContractError } = useContract(address);
    const { mutateAsync: approve, isLoading, error } = useContractWrite(contract, "approve");

    const { data: allowance, isLoading: isAllowanceLoading, error: nameError } = useContractRead(contract, "allowance", [userAddress, etfAddress]);


    return <Descriptions column={3} title={minimiseAddress(address)}>
        <Descriptions.Item label="Quantity Locked">{BigNumber.from(bundle[0][index] || 0).div(BigNumber.from(10).pow(16)).toNumber() / 100} / {BigNumber.from(getRequiredAsset(address)?.totalAmount || 0).div(BigNumber.from(10).pow(16)).toNumber() / 100}</Descriptions.Item>
        <Descriptions.Item label="Balance">
            {balanceLoading && <Tag color="processing">Loading...</Tag>}
            {!balanceError && !balanceLoading && balance && <Tag color="success">{showOnlyTwoDecimals(balance.displayValue)} {balance.symbol}</Tag>}
        </Descriptions.Item>,


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
                onChange={(value) => {
                    setQuantities((prev: any) => {
                        prev.set(address, Number(value));
                        return new Map(prev);
                    });
                }}
            />
        </Descriptions.Item>
        <Descriptions.Item label="Allowance">
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

    </Descriptions>



}