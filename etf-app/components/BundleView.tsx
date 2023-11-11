import { ConnectWallet, Web3Button, useContract, useContractRead, useContractWrite, useNFTs, useTotalCount } from "@thirdweb-dev/react";
import styles from '../styles/page.module.css'
import CONTRACTS from '../../CONTRACTS.json'
const ABI = require("../.././artifacts/contracts/ETFContractv2.sol/ETFv2.json").abi;
const nativeAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
import { Tag } from 'antd';
import { BigNumber, ContractInterface, ethers } from "ethers";


const minimiseAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
}


export default function BundleView({ address, bundleId }: { address: string, bundleId: number }) {

    const { contract, isLoading, error } = useContract(address, ABI);
    const { data: name, isLoading: isNameLoading, error: nameError } = useContractRead(contract, "symbol");
    const { data: bundle, isLoading: countLoading, error: countError } = useContractRead(
        contract,
        "getTokensBundle", [bundleId]
    );

    return <div className={styles.description}>

        {bundle && bundle[1].map((tokenAddress: any, index: number) => {

            return <p>
                | {minimiseAddress(tokenAddress)} | {BigNumber.from(bundle[0][index]).toString()} |
            </p>
        })}
    </div>
}