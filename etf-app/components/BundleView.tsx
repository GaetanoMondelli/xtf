import { useAddress, useContract, useContractRead, useContractWrite } from "@thirdweb-dev/react";
import styles from '../styles/page.module.css'
const ABI = require("../.././artifacts/contracts/ETFContractv2.sol/ETFv2.json").abi;
import TokenDescriptions from "./TokenDescriptionsView";
import { Badge, Button, Card, Descriptions, Form, InputNumber, Progress, Divider } from 'antd';
import { BigNumber, ethers } from "ethers";
import { useState, useEffect } from "react";
import { Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import { getRequiredAsset, requiredTokenStructs, getValueChartData, getPriceAggregatorAddress, nativeAddress, calculateTLV } from "./utils";
import { ChartDataset } from "chart.js/auto";
import MatrixView from "../components/MatrixView";


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

    const { data: bundleState, isLoading: bundleStateLoading, error: bundleStateError } = useContractRead(
        contract,
        "returnStateOfBundles", [0, 96]
    );

    const { data: name, isLoading: isNameLoading, error: nameError } = useContractRead(contract, "symbol");
    const { data: bundle, isLoading: countLoading, error: countError } = useContractRead(
        contract,
        "getTokensBundle", [bundleId]
    );

    const { mutateAsync: depositFunds, isLoading: isLoadingDeposit, error: errorDeposit } = useContractWrite(
        contract,
        "depositFunds"
    );

    const { mutateAsync: reedem, isLoading: isReedemLoadinf, error: errorReedem } = useContractWrite(
        contract,
        "reedemETF"
    );

    const { data: userDeposit, isLoading: userDepositLoading, error: userDepositError } = useContractRead(
        contract,
        "getAddressQuantityPerBundle", [bundleId, userAddress]
    );

    const { data: etfId, isLoading: etfIdLoading, error: etfIdError } = useContractRead(
        contract,
        "bundleIdToETFId", [bundleId]
    );

    const { data: isETFBurned, isLoading: isETFBurnedLoading, error: isETFBurnedError } = useContractRead(
        contract,
        "isETFBurned", [etfId]
    );


    const getRibbonProps = (etfIdLoading: any, etfId: any, isETFBurnedLoading: any, isETFBurned: any) => {

        if (etfIdLoading || isETFBurnedLoading) {
            return {
                color: 'grey',
                text: 'Loading...',
            }
        } else if (etfId == 0 && !isETFBurned) {
            return {
                color: 'blue',
                text: 'ETF Vault Available',
            }
        } else if (isETFBurned) {
            return {
                color: 'red',
                text: 'ETF Burned',
            }
        } else {
            return {
                color: 'green',
                text: 'ETF Vault Locked - Minted',
            }
        }

    }

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

    return <Badge.Ribbon
        {...getRibbonProps(etfIdLoading, etfId, isETFBurnedLoading, isETFBurned)}
    >

        <Card>

            <div className={styles.description}>
                <h3>Vault {bundleId}</h3>
                {/* {!etfIdLoading && BigNumber.from(etfId).toNumber() > 0 && <p>ETF {BigNumber.from(etfId).toString()}</p>} */}
                {/* {!etfIdLoading && isETFBurned && <p>ETF {isETFBurned.toString()}</p>} */}

                <br></br>

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-evenly', // Center horizontally
                    alignItems: 'space-between', // Center vertically
                }}>
                    <MatrixView address={address}
                        bundleState={bundleState}
                        bundleStateLoading={bundleStateLoading}
                        bundleStateError={bundleStateError}
                    />
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
                                        labels: values[0] || [],
                                        datasets: datasets(),
                                    }
                            }
                        />}
                    </div>
                </div>

                <Card>

                    {bundle && requiredTokenStructs.map((asset: any) => {
                        const tokenAddress = asset.assetContract;
                        const index = bundle[1].indexOf(tokenAddress);
                        return <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center', // Center horizontally
                                alignItems: 'center', // Center vertically
                            }}
                        >
                            <div
                                style={
                                    {
                                        width: '90%',
                                        marginBottom: '20px'
                                    }
                                }
                            >
                                <TokenDescriptions
                                    address={tokenAddress}
                                    etfAddress={address}
                                    bundle={bundle}
                                    index={index}
                                    setQuantities={setQuantities}
                                ></TokenDescriptions>

                                <Progress
                                    percent={
                                        Number(BigNumber.from(bundle[0][index] || 0).mul(BigNumber.from(100)).div(BigNumber.from(getRequiredAsset(tokenAddress)?.totalAmount || 0)))
                                    } success={
                                        {
                                            percent:
                                                userDeposit != undefined && userDeposit[0].length > 0 ?
                                                    Number(BigNumber.from(userDeposit[0][index]).mul(BigNumber.from(100)).div(BigNumber.from(getRequiredAsset(tokenAddress)?.totalAmount || 0)))
                                                    : 0
                                        }
                                    }
                                ></Progress>
                            </div >
                            <br></br>
                            <br></br>
                        </div>
                    })}
                    <Divider />
                    <div

                        style={{
                            // align at the right side
                            display: 'flex',
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                            marginRight: '30px'
                        }}
                    >

                        {!etfIdLoading && etfId && BigNumber.from(etfId)?.toNumber() == 0 && <Button
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
                        }
                        &nbsp;
                        {!etfIdLoading && BigNumber.from(etfId).toNumber() > 0 &&
                            <Button type="primary" onClick={() => {

                                reedem({
                                    args: [etfId],
                                })

                            }}>Reedem</Button>
                        }
                    </div >
                </Card>

            </div>

        </Card>
    </Badge.Ribbon>

}