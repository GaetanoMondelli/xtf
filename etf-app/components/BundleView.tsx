import { ConnectWallet, Web3Button, useContract, useContractRead, useContractWrite, useNFTs, useTotalCount } from "@thirdweb-dev/react";
import styles from '../styles/page.module.css'
import CONTRACTS from '../../CONTRACTS.json'
const ABI = require("../.././artifacts/contracts/ETFContractv2.sol/ETFv2.json").abi;
const nativeAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
import { Button, Tag, Select, Form, InputNumber } from 'antd';
import { BigNumber, ContractInterface, ethers } from "ethers";
import { minimiseAddress, getRequiredAsset, requiredTokenStructs } from "./utils";
import { useState } from "react";

export default function BundleView({ address, bundleId, tokenToBeWrapped1Address, tokenToBeWrapped2Address }: {
    address: string, bundleId: number,
    tokenToBeWrapped1Address: string, tokenToBeWrapped2Address: string
}) {

    const [quantities, setQuantities] = useState<Map<string, number>>(new Map());
    const { contract, isLoading, error } = useContract(address, ABI);
    const { data: name, isLoading: isNameLoading, error: nameError } = useContractRead(contract, "symbol");
    const { data: bundle, isLoading: countLoading, error: countError } = useContractRead(
        contract,
        "getTokensBundle", [bundleId]
    );

    const { mutateAsync: depositFunds, isLoading: isLoadingDeposit, error: errorDeposit } = useContractWrite(
        contract,
        "depositFunds"
    );



    return <div className={styles.description}>

        {bundle && requiredTokenStructs.map((asset: any) => {
            const tokenAddress = asset.assetContract;
            const index = bundle[1].indexOf(tokenAddress);
            return <div>
                <span>
                    | {minimiseAddress(asset.assetContract)} | {BigNumber.from(bundle[0][index] || 0).toString()} |   &nbsp;
                </span>
                {JSON.stringify(quantities)}
                <InputNumber
                    style={{
                        marginLeft: 20
                    }}
                    defaultValue={0}
                    min={0}
                    max={
                        tokenAddress === nativeAddress ?
                            Number(ethers.utils.formatEther(BigNumber.from(getRequiredAsset(tokenAddress)?.totalAmount || 0).sub(BigNumber.from(bundle[0][index] || 0))))
                            : Number(getRequiredAsset(tokenAddress)?.totalAmount) - (bundle[0][index]?.toNumber() || 0)
                    }
                    onChange={(value) => {
                        setQuantities((prev) => {
                            prev.set(tokenAddress, Number(value));
                            return new Map(prev);
                        });
                    }}
                />
                <br></br>
                <br></br>
            </div>
        })}
        <Button
            type="primary"
            disabled={
                requiredTokenStructs.every((asset: any) => {
                    const tokenAddress = asset.assetContract;
                    return quantities.get(tokenAddress) === undefined || quantities.get(tokenAddress) === 0;
                })
            }
            onClick={() => {
                const structArray = requiredTokenStructs.map((asset: any) => {
                    const tokenAddress = asset.assetContract;
                    let quantity = tokenAddress === nativeAddress ? ethers.utils.parseEther(quantities.get(tokenAddress)?.toString() || "0") : quantities.get(tokenAddress);
                    return {
                        assetContract: tokenAddress,
                        tokenType: 0,
                        tokenId: 0,
                        totalAmount: quantity
                    };
                });
                depositFunds({
                    args: [bundleId, structArray],
                    overrides: {
                        value: ethers.utils.parseEther(quantities.get(nativeAddress)?.toString() || "0"),
                    }
                })
            }}
        >Deposit</Button>
    </div >
}