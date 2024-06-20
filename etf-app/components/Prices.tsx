import { useContract, useContractRead } from "@thirdweb-dev/react";
import { Card } from 'antd';
import { BigNumber } from "ethers";
import { showOnlyTwoDecimals, getPriceAggregatorAddress, getAssetName } from "./utils";
import { useContext, useEffect, useState } from "react";
import ChainContext from "../context/chain";


export default function Prices(
    { address }: { address: string }
) {
    const [prices, setPrices] = useState<any>();
    const [labels, setLabels] = useState<any>();
    const { mockAggregatorAbi, etfV2Abi } = useContext(ChainContext);
    const { contract, isLoading, error } = useContract(address, etfV2Abi);

    const { data: requiredAsset, isLoading: requiredAssetLoading, error: requiredAssetError } = useContractRead(
        contract,
        "getRequiredAssets", []
    );
    useEffect(() => {
        async function fetchData() {
            if (requiredAssetLoading || requiredAsset == undefined || !mockAggregatorAbi) return;
            const prcs = [];
            const labs = [];
            const prices = await getPriceAggregatorAddress(mockAggregatorAbi);
            for (let i = 0; i < prices.length; i++) {
                prcs.push(BigNumber.from(prices[i]).div(BigNumber.from(10).pow(6)).toNumber() / 100);
                labs.push(getAssetName(requiredAsset[1][i]));
            }
            setPrices(prcs);
        }
        fetchData();
    }, [requiredAssetLoading, requiredAsset, mockAggregatorAbi]);


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
                return <span key={'price' + index}>
                    <span
                        style={{
                            // no bold
                            fontWeight: "normal",
                            fontSize: 20,
                            color: "black",
                        }}
                    >{requiredAsset && getAssetName(requiredAsset[1][index])}: {showOnlyTwoDecimals(price)} $ </span>
                    <span> | </span>
                </span>
            })}
        </div>
    </ div>
}