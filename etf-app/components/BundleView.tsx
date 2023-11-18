import { useAddress, useContract, useContractRead, useContractWrite } from "@thirdweb-dev/react";
import styles from '../styles/page.module.css'
const ABI = require("../.././artifacts/contracts/ETFContractv2.sol/ETFv2.json").abi;
const nativeAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
import { Button, Card, InputNumber, Progress } from 'antd';
import { BigNumber, ethers } from "ethers";
import { useState, useEffect } from "react";
import { Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import { minimiseAddress, getRequiredAsset, requiredTokenStructs, getValueChartData, getPriceAggregatorAddress, getTokensByAddres } from "./utils";
import { ChartDataset } from "chart.js/auto";


interface CustomChartDataset extends ChartDataset<'pie', number[]> {
    customLabels?: string[];
}
export default function BundleView({ address, bundleId, tokenToBeWrapped1Address, tokenToBeWrapped2Address }: {
    address: string, bundleId: number,
    tokenToBeWrapped1Address: string, tokenToBeWrapped2Address: string
}) {

    const [quantities, setQuantities] = useState<Map<string, number>>(new Map());
    const [prices, setPrices] = useState<any>();
    const [values, setValues] = useState<any>();
    const userAddress = useAddress();

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

    const { data: userDeposit, isLoading: userDepositLoading, error: userDepositError } = useContractRead(
        contract,
        "getAddressQuantityPerBundle", [bundleId, userAddress]
    );


    // use effect with async await

    useEffect(() => {
        async function fetchData() {
            const valuesChart = await getValueChartData();
            const prices = await getPriceAggregatorAddress();
            console.log("Fetched data: ", valuesChart); // Check what data is being fetched
            setValues(valuesChart);
            setPrices(prices);
        }
        fetchData();
    }, []);


    const transformUserDepositForChart = (userDeposit: any, prices: any) => {
        const userDepositArray = userDeposit[0];
        const addresses = userDeposit[1];
        const userDepositArrayBN = []
        let totalValue = 0;
        let contribution = 0;
        for (let i = 0; i < userDepositArray.length; i++) {
            let value = BigNumber.from(userDepositArray[i]).mul(BigNumber.from(prices[i]).div(BigNumber.from(10).pow(8))).div(BigNumber.from(10).pow(18)).toNumber();
            contribution += value;
            totalValue += (BigNumber.from(getRequiredAsset(addresses[i])?.totalAmount || 0).mul(BigNumber.from(prices[i]).div(BigNumber.from(10).pow(8))).div(BigNumber.from(10).pow(18))).toNumber();
            userDepositArrayBN.push(value);
        }
        console.log("userDepositArrayBN: ", userDepositArrayBN, "totalValue: ", totalValue, "contribution: ", contribution);
        userDepositArrayBN.push(totalValue - contribution);
        return [[...addresses, 'Others'], userDepositArrayBN]
    }

    const datasets = (): CustomChartDataset[] => [
        {
            data: values[1],
            backgroundColor: [
                'rgba(54, 162, 235)',
                'rgba(255, 99, 132)',
                'rgba(255, 206, 86)',
                'rgba(153, 102, 255)',
                'rgba(255, 159, 64)',
            ],
        },
        {
            data: transformUserDepositForChart(userDeposit, prices)[1],
            backgroundColor: [...values[0].map((address: string) => "rgba(75, 192, 192, 0.5)"), "rgba(54, 162, 235, 0.5)"],
        }
    ];

    return <Card>


        <div className={styles.description}>
            <h3>Bundle {bundleId}</h3>
            <br></br>

            {/* <p>Required Asset</p> */}
            {/* {JSON.stringify(userDeposit)} */}
            <div style={{
                display: 'flex',
                justifyContent: 'center', // Center horizontally
                alignItems: 'center', // Center vertically
            }}>
                <div style={{ width: '300px', height: '300px', marginBottom: '20px' }}>
                    {values && <Pie
                        data={
                            userDeposit == undefined || userDeposit[0].length == 0 ?
                                {
                                    labels: values[0] || [],
                                    datasets: [
                                        {
                                            data: values[1],

                                        },
                                    ]
                                } :
                                {
                                    labels:  values[0] || [],
                                    datasets: datasets(),
                                }
                        }
                    />}
                </div>
            </div>


            {bundle && requiredTokenStructs.map((asset: any) => {
                const tokenAddress = asset.assetContract;
                const index = bundle[1].indexOf(tokenAddress);
                return <div>
                    <span>
                        | {minimiseAddress(asset.assetContract)} | {BigNumber.from(bundle[0][index] || 0).toString()} <Progress percent={
                            Number(BigNumber.from(bundle[0][index] || 0).mul(BigNumber.from(100)).div(BigNumber.from(getRequiredAsset(tokenAddress)?.totalAmount || 0)))
                        } success={
                            {
                                percent:
                                    userDeposit != undefined && userDeposit[0].length > 0 ?
                                        Number(BigNumber.from(userDeposit[0][index]).mul(BigNumber.from(100)).div(BigNumber.from(getRequiredAsset(tokenAddress)?.totalAmount || 0)))
                                        : 0
                            }
                        }
                        ></Progress> |   &nbsp;
                    </span>
                    <InputNumber
                        style={{
                            marginLeft: 20
                        }}
                        defaultValue={0}
                        min={0}
                        max={
                            tokenAddress === nativeAddress ?
                                Number(ethers.utils.formatEther(BigNumber.from(getRequiredAsset(tokenAddress)?.totalAmount || 0).sub(BigNumber.from(bundle[0][index] || 0))))
                                // : Number(getRequiredAsset(tokenAddress)?.totalAmount) - (bundle[0][index]?.toNumber() || 0)
                                : Number(BigNumber.from(getRequiredAsset(tokenAddress)?.totalAmount || 0).sub(BigNumber.from(bundle[0][index] || 0)).div(BigNumber.from(10).pow(18)))

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
                        let quantity = tokenAddress === nativeAddress ?
                            ethers.utils.parseEther(quantities.get(tokenAddress)?.toString() || "0") :
                            BigNumber.from(quantities.get(tokenAddress) || 0).mul(BigNumber.from(10).pow(18));
                        return {
                            assetContract: tokenAddress,
                            tokenType: 0,
                            tokenId: 0,
                            totalAmount: quantity,
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
    </Card>

}