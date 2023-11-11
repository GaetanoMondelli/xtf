import { useContract, useContractRead, useContractWrite, useBalance, useTotalCount } from "@thirdweb-dev/react";
import styles from '../styles/page.module.css'
const ABI = require("../.././artifacts/contracts/ETFContractv2.sol/ETFv2.json").abi;
const TokenABI = require("../.././artifacts/contracts/TokenWrapped.sol/FungibleToken.json").abi;

import { Avatar } from 'antd';
const nativeAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { use } from "chai";

const minimiseAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
}


export default function CloseETF({ address }: {
    address: string,
}) {

    const { contract, isLoading: isContractLoading, error: isContractError } = useContract(address, ABI);
    const { data: count, isLoading: countLoading, error: countError } = useTotalCount(
        contract
    );

    const { mutateAsync: reedemETF, isLoading, error } = useContractWrite(
        contract,
        "reedemETF"
    );

    return <span
        className={styles.card}
        rel="noopener noreferrer"
        onClick={
            () =>
                reedemETF({
                    args: []
                })
        }
    >
        <h2>
            Close<span>-&gt;</span>
        </h2>
        <p>
            {/* Open an ETF position with 0.5 ETH, 10 Token1, 20 Token2
             */}
            Liquidate an ETF position to receive 0.5 ETH, 10 Token1, 20 Token2
        </p>
        <div>
        </div>
    </span >

}