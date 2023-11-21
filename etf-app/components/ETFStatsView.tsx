import { useAddress, useContract, useBalance, Web3Button, useContractWrite, useContractRead } from "@thirdweb-dev/react";
import styles from '../styles/page.module.css'
import { Button, Card, Col, Layout, Row, Statistic, Tag } from 'antd';
import style from '../styles/page.module.css';
import { BigNumber } from "ethers";
import { showOnlyTwoDecimals, calculateTLV } from "./utils";
import { useEffect, useState } from "react";

const ABI = require("../.././artifacts/contracts/ETFContractv2.sol/ETFv2.json").abi;



export default function ETFStatsView(
    { address, tokenAddress }: { address: string, tokenAddress: string }
) {
    const [TLV, setTLV] = useState<any>("Loading...s");
    // use effect to calculate TLV
    // await calculateTLV()

    const { contract, isLoading, error } = useContract(address, ABI);
    // const { contract: tokenContract, isLoading: tokenIsLoading, error: tokenError } = useContract(address, ABI);
    const { data: balance, isLoading: balanceLoading, error: balanceError } = useBalance(
        tokenAddress,
    );
    const { data: totalSupply, isLoading: totalSupplyLoading, error: totalSupplyError } = useContractRead(
        contract,
        "totalSupply",
    );

    const { data: burnedCount, isLoading: burnedCountLoading, error: burnedCountError } = useContractRead(
        contract,
        "getBurnedCount",
    );

    // same for public variable bundleCount
    const { data: bundleCount, isLoading: bundleCountLoading, error: bundleCountError } = useContractRead(
        contract,
        "bundleCount",
    );

    const { data: bundleState, isLoading: bundleStateLoading, error: bundleStateError } = useContractRead(
        contract,
        "returnStateOfBundles", [0, 96]
    );

    useEffect(() => {
        async function fetchData() {
            const tlv = await calculateTLV(bundleState);
            setTLV(tlv);
        }
        fetchData();
    }, [bundleState]);




    return <Card>
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                margin: '0 20px 0 20px'
            }}
        >
            <Statistic title="Vault Opened" value={
                bundleCountLoading ? "Loading..." : bundleCountError ?
                    "Error" : bundleCount ? bundleCount.toString() : "0"
            } />
            <Statistic title="Vault Minted" value={
                isLoading ? "Loading..." : totalSupplyError ?
                    "Error" : totalSupplyLoading ? "Loading..." :
                        BigNumber.from(totalSupply).toString()} />
            <Statistic title="Vault Burnt" value={
                burnedCountLoading ? "Loading..." : burnedCountError ?
                    "Error" : burnedCount ? burnedCount.toString() : "0"
            } />
            {/* <Statistic title="Total Value Locked" value={112893} /> */}
            <Statistic title="ETF Tokens" value={
                balanceLoading ? "Loading..." : balanceError ?
                    "Error" : showOnlyTwoDecimals(balance?.displayValue as string)
            } />
            <Statistic title="Estimated TLV" suffix="$" value={
                bundleStateLoading ? "Loading..." : bundleStateError ?
                    "Error" : bundleState ? showOnlyTwoDecimals(TLV) : "0"
                    
            } />
        </div>
    </Card>
}