import { useContract, useContractRead } from "@thirdweb-dev/react";
import { Card, Statistic } from 'antd';
import { BigNumber } from "ethers";
import { showOnlyTwoDecimals, getPriceAggregatorAddress, getAssetName, getSepoliaDataFeedAddress } from "./utils";
import { useContext, useEffect, useState } from "react";
import ChainContext from "../context/chain";


const { Meta } = Card;

export default function PriceValueStats(
    { address, vaultCompositionRef }: { address: string, vaultCompositionRef: any }
) {
    const [prices, setPrices] = useState<any>();
    const [values, setValues] = useState<any>();
    const [labels, setLabels] = useState<any>();
    const [quantities, setQuantities] = useState<any>();

    const { mockAggregatorAbi, etfV2Abi } = useContext(ChainContext);
    const { contract, isLoading, error } = useContract(address, etfV2Abi);

    const { data: requiredAsset, isLoading: requiredAssetLoading, error: requiredAssetError } = useContractRead(
        contract,
        "getRequiredAssets", []
    );


    const getValueChartData = (tokens: any, prices: any) => {
        const labels: any = [];
        const values: any = [];
        tokens.map((asset: any, index: number) => {
            const value = prices[index]
            if (value == undefined) return;
            values.push(BigNumber.from(value).mul(BigNumber.from(asset.totalAmount).div((BigNumber.from(10).pow(16)))).div(BigNumber.from(10).pow(8)).toNumber() / 100);
            labels.push(asset.assetContract);
        });
        return [labels, values];
    }

    useEffect(() => {
        async function fetchData() {
            if (requiredAssetLoading || !mockAggregatorAbi) return;
            let prcs = [];
            let qts = [];
            if (requiredAssetLoading || requiredAsset == undefined) return;
            const prices = await getPriceAggregatorAddress(mockAggregatorAbi);
            const tmpRequiredAssets: any = [];
            for (let i = 0; i < requiredAsset[0].length; i++) {
                const quantity = requiredAsset[0][i];
                const assetContract = requiredAsset[1][i];
                const assetChainSelector = requiredAsset[2][i];
                tmpRequiredAssets.push({
                    assetContract: assetContract,
                    tokenType: 0,
                    totalAmount: quantity,
                    tokenId: 0,
                    chainSelector: assetChainSelector
                });
                qts.push(BigNumber.from(quantity).div(BigNumber.from(10).pow(16)).toNumber() / 100);
            }
            const [labs, vals] = getValueChartData(tmpRequiredAssets, prices);
            setLabels(labs);
            setValues(vals);
            setQuantities(qts);
            for (let i = 0; i < prices.length; i++) {
                prcs.push(BigNumber.from(prices[i]).div(BigNumber.from(10).pow(6)).toNumber() / 100);
            }
            setPrices(prcs);
        }
        fetchData();
    }, [requiredAssetLoading, requiredAsset, mockAggregatorAbi]);




    return <Card
        className="card"
        style={{
            width: "95%",
        }}>
        <Meta
            title="Vault Composition"
            description="Prices are fetched from Chainlink Data Feeds"
        />
        <br></br>
        <div
            ref={vaultCompositionRef}
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                margin: '0 20px 0 20px'
            }}
        >
            {labels && values && labels.map((label: any, index: number) => {

                return <Statistic key={label + index} title={
                    <div>
                        <span>{getAssetName(label)}</span>
                        <br></br>
                        <span>{quantities[index]} {getAssetName(label)} * </span>
                        <span>
                            <a
                                style={
                                    {
                                        color: 'blue'
                                    }
                                }
                                href={`https://sepolia.etherscan.io/address/${getSepoliaDataFeedAddress()[index]}`}
                            >{prices[index]}$</a></span>
                    </div>} value={showOnlyTwoDecimals(values[index])} suffix={"$"} />
            })}
        </div>

    </Card>
}