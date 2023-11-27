import { useAddress, useContract, useBalance, Web3Button, useContractWrite, useContractRead } from "@thirdweb-dev/react";
import styles from '../styles/page.module.css'
import { Button, Card, Col, Layout, Row, Statistic, Tag } from 'antd';
import style from '../styles/page.module.css';
import { BigNumber } from "ethers";
import { showOnlyTwoDecimals, getPriceAggregatorAddress, getAssetName, getSepoliaDataFeedAddress } from "./utils";
import { useEffect, useState } from "react";

const ABI = require("../.././artifacts/contracts/ETFContractv2.sol/ETFv2.json").abi;

const { Meta } = Card;

export default function Prices(
    { address }: { address: string }
) {
    const [prices, setPrices] = useState<any>();
    const [labels, setLabels] = useState<any>();
    const { contract, isLoading, error } = useContract(address, ABI);

    const { data: requiredAsset, isLoading: requiredAssetLoading, error: requiredAssetError } = useContractRead(
        contract,
        "getRequiredAssets", []
    );
    useEffect(() => {
        async function fetchData() {
            if (requiredAssetLoading || requiredAsset == undefined) return;
            const prcs = [];
            const labs = [];
            const prices = await getPriceAggregatorAddress();
            for (let i = 0; i < prices.length; i++) {
                prcs.push(BigNumber.from(prices[i]).div(BigNumber.from(10).pow(6)).toNumber() / 100);
                labs.push(getAssetName(requiredAsset[1][i]));
            }
            setPrices(prcs);
        }
        fetchData();
    }, [requiredAsset]);


    return <div className="marquee card"
        style={{
            width: "95%",
        }}
    >
        <div className="marquee-content" style={{
            width: "95%",
            animation: "marquee 25s linear infinite",
        }}>
            <span
                style={{
                    // no bold
                    fontWeight: "normal",
                    fontSize: 20,
                    color: "black",
                }}
            >Datafeed Prices: </span>
            {prices && prices.map((price: any, index: number) => {
                return <>
                    <span
                        style={{
                            // no bold
                            fontWeight: "normal",
                            fontSize: 20,
                            color: "black",
                        }}
                    >{getAssetName(requiredAsset[1][index])}: {showOnlyTwoDecimals(price)} $ </span>
                    <span> | </span>
                </>
            })}
        </div>
    </ div>
}