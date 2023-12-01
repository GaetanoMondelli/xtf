import { useAddress, useContract, useContractRead, useContractWrite } from "@thirdweb-dev/react";

import styles from '../styles/page.module.css'
import TokenDescriptions from "./TokenDescriptionsView";
import { Badge, Button, Card, Statistic, Form, InputNumber, Progress, Divider, Result, Select } from 'antd';
import { FireFilled } from '@ant-design/icons';
import { BigNumber, ethers } from "ethers";
import { useState, useEffect } from "react";
import { Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import { getPriceAggregatorAddress, nativeAddress, ETFState, getETFStatus, getAssetName, PayFeesIn } from "./utils";
import { Chart, ChartDataset } from "chart.js/auto";
import MatrixView from "../components/MatrixView";

const ABI = require("../.././artifacts/contracts/ETFContractv2.sol/ETFv2.json").abi;


const { Countdown } = Statistic;

interface CustomChartDataset extends ChartDataset<'pie', number[]> {
    customLabels?: string[];
}
export default function BundleView({ address, bundleId, tokenToBeWrapped1Address, tokenToBeWrapped2Address, setBundleId, config }: {
    address: string, bundleId: number, setBundleId: any,
    tokenToBeWrapped1Address: string, tokenToBeWrapped2Address: string,
    config: any
}) {

    const [quantities, setQuantities] = useState<any>({});
    const [prices, setPrices] = useState<any>();
    const [values, setValues] = useState<any>();
    const [requiredTokenStructs, setRequiredTokenStructs] = useState<any>([]);
    const [notifyChainSelectorId, setNotifyChainSelectorId] = useState<any>(0);
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

    const { mutateAsync: sendReedeemMessage, isLoading: isLoadingsendReedeemMessage, error: errorSendReedeemMessage } = useContractWrite(
        contract,
        "sendReedeemMessage"
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

    const { data: expirationTime, isLoading: expirationTimeLoading, error: expirationTimeError } = useContractRead(
        contract,
        "tokenIdToExpirationTime", [etfId]
    );

    const { data: requiredAsset, isLoading: requiredAssetLoading, error: requiredAssetError } = useContractRead(
        contract,
        "getRequiredAssets", []
    );

    const { data: chainSelectorId, isLoading: chainSelectorIdLoading, error: chainSelectorIdError } = useContractRead(
        contract,
        "currentChainSelectorId",
    );

    const getRequiredAsset = (address: string) => {

        return !requiredAssetLoading && requiredAsset ? requiredTokenStructs.find((asset: any) => asset.assetContract === address) : [];
    }


    const getRibbonProps = (etfIdLoading: any, etfId: any, isETFBurnedLoading: any, isETFBurned: any) => {

        const state = getETFStatus(etfIdLoading, etfId, isETFBurnedLoading, isETFBurned);
        if (state == ETFState.LOADING) {
            return {
                color: 'grey',
                text: 'Loading...',
            }
        } else if (state == ETFState.OPEN) {
            return {
                color: 'blue',
                text: 'ETF Vault Available',
            }
        } else if (state == ETFState.BURNED) {
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

    const getValueChartData = (tokens: any, prices: any) => {
        const labels: any = [];
        const values: any = [];
        tokens.map((asset: any, index: number) => {
            const value = prices[index]
            if (!value) return;
            values.push(BigNumber.from(value).mul(BigNumber.from(asset.totalAmount).div((BigNumber.from(10).pow(16)))).div(BigNumber.from(10).pow(8)).toNumber() / 100);
            console.log('valueS', value, asset.totalAmount, values[values.length - 1])
            labels.push(asset.assetContract);
        });
        return [labels, values];
    }

    useEffect(() => {
        async function fetchData() {
            if (requiredAssetLoading || requiredAsset == undefined) return;
            const prices = await getPriceAggregatorAddress();
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
                setRequiredTokenStructs(tmpRequiredAssets);
                const valuesChart = getValueChartData(tmpRequiredAssets, prices);
                setValues(valuesChart);
                setPrices(prices);
            }
        }
        fetchData();
    }, [requiredAsset]);



    const transformUserDepositForChart = (userDeposit: any, prices: any) => {
        const userDepositArray = userDeposit[0];
        const addresses = userDeposit[1];
        const userDepositArrayBN = []
        let totalValue = 0;
        let contribution = 0;
        for (let i = 0; i < userDepositArray.length; i++) {
            if (userDepositArray[i] == undefined || prices[i] == undefined) continue;
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
                'rgba(153, 102, 255)',
                'rgba(255, 206, 86)',
                'rgba(54, 162, 235)',
                'rgba(28, 24, 64)',
                'rgba(255, 99, 132)',
            ],
            borderColor: 'black',
            borderWidth: 2,

        },
        {
            data: transformUserDepositForChart(userDeposit, prices)[1],
            borderColor: 'black',
            borderWidth: 2,
            label: 'User Deposit',
            backgroundColor: [...values[0].map((address: string) => "rgba(75, 192, 192, 0.5)"), "rgba(255, 99, 132, 0.5)"],
        }
    ];


    return <Badge.Ribbon
        className="badge"
        {...getRibbonProps(etfIdLoading, etfId, isETFBurnedLoading, isETFBurned)}
    >
        <Card
            className="card"
            style={{
                width: "100%",
            }}>

            <div className={styles.description}>
                <h3>Vault {bundleId}</h3>
                {bundle && <p>{JSON.stringify(bundle)}</p>}
                <br></br>

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-evenly', // Center horizontally
                    alignItems: 'space-between', // Center vertically
                }}>
                    {/* {!requiredAssetLoading && <pre>{JSON.stringify(bundle, null, 2)}</pre>}
                    {!requiredAssetLoading && <pre>{JSON.stringify(quantities, null, 2)}</pre>} */}

                    <MatrixView address={address}
                        bundleState={bundleState}
                        setBundleId={setBundleId}
                        bundleStateLoading={bundleStateLoading}
                        bundleStateError={bundleStateError}
                        requiredTokenStructs={requiredTokenStructs}
                    />
                    <div style={{ width: '400px', height: '300px', marginBottom: '20px' }}>
                        {values && <Pie
                            options={

                                {
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            position: 'right',
                                            labels: {
                                                generateLabels(chart) {
                                                    const original = Chart.overrides.pie.plugins.legend.labels.generateLabels;
                                                    const labelsOriginal: any = original.call(this, chart);
                                                    for (let i = 0; i < labelsOriginal.length; i++) {
                                                        labelsOriginal[i].text = getAssetName(labelsOriginal[i].text);
                                                    }

                                                    const userDeposits = { ...labelsOriginal[labelsOriginal.length - 1] };
                                                    const otherDeposits = { ...labelsOriginal[labelsOriginal.length - 1] };

                                                    if (userDeposit && userDeposit[0].length !== 0) {
                                                        userDeposits.text = "User's Deposits";
                                                        userDeposits.fillStyle = 'rgba(75, 192, 192, 0.5)';
                                                        labelsOriginal.push(userDeposits);

                                                        otherDeposits.text = "Other's Deposits";
                                                        otherDeposits.fillStyle = 'rgba(255, 99, 132, 0.5)';
                                                        labelsOriginal.push(otherDeposits);
                                                    }

                                                    return labelsOriginal;
                                                },
                                            },
                                        }
                                    },
                                }
                            }
                            data={
                                userDeposit == undefined || userDeposit[0].length == 0 ?
                                    {
                                        labels: values[0] || [],
                                        datasets: [
                                            {
                                                data: values[1],
                                                borderColor: 'black',
                                                backgroundColor: [
                                                    'rgba(153, 102, 255)',
                                                    'rgba(255, 206, 86)',
                                                    'rgba(54, 162, 235)',
                                                    'rgba(28, 24, 64)',
                                                    'rgba(255, 99, 132)',
                                                ],
                                                borderWidth: 2

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

                {getETFStatus(etfIdLoading, etfId, isETFBurnedLoading, isETFBurned) == ETFState.OPEN && <Card
                    className="card"
                    style={{
                        width: "95%",
                    }}>


                    {bundle && bundle[0] && !chainSelectorIdLoading && requiredTokenStructs.map((asset: any) => {
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
                                    quantities={quantities}
                                    setQuantities={setQuantities}
                                    requiredTokenStructs={requiredTokenStructs}
                                    chainSelectorId={chainSelectorId}
                                    currentConfig={config}
                                ></TokenDescriptions>

                                <Progress
                                    percent={
                                        Number(BigNumber.from(bundle[0][index] || 100).mul(BigNumber.from(100)).div(BigNumber.from(getRequiredAsset(tokenAddress)?.totalAmount || 1)))
                                    } success={
                                        {
                                            percent:
                                                userDeposit && userDeposit[0][index] != undefined && userDeposit[0].length > 0 ?
                                                    Number(BigNumber.from(userDeposit[0][index]).mul(BigNumber.from(100)).div(BigNumber.from(getRequiredAsset(tokenAddress)?.totalAmount || 1)))
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

                        {!etfIdLoading && !chainSelectorIdLoading && etfId && BigNumber.from(etfId)?.toNumber() == 0 && <Button
                            type="primary"
                            disabled={
                                requiredTokenStructs.every((asset: any) => {
                                    const tokenAddress = asset.assetContract;
                                    return quantities[tokenAddress] === undefined || quantities[tokenAddress] === 0;
                                })
                            }
                            onClick={() => {
                                const structArray = requiredTokenStructs
                                    .filter((asset: any) => {
                                        return quantities[asset.assetContract] !== undefined && quantities[asset.assetContract]
                                            && asset.chainSelector.toString() === chainSelectorId.toString();
                                    })
                                    .map((asset: any) => {
                                        const tokenAddress = asset.assetContract;
                                        let quantity = tokenAddress === nativeAddress ?
                                            ethers.utils.parseEther(quantities[tokenAddress]?.toString() || "0") :
                                            BigNumber.from(quantities[tokenAddress] || 0).mul(BigNumber.from(10).pow(18));
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
                                        value: ethers.utils.parseEther(quantities[nativeAddress]?.toString() || "0"),
                                    }
                                })
                            }}

                        >Deposit</Button>
                        }
                        &nbsp;
                        {!etfIdLoading && BigNumber.from(etfId).toNumber() > 0 &&
                            <Button type="primary" onClick={() => {

                                reedem({
                                    args: [bundleId],
                                })

                            }}>Reedem</Button>
                        }
                    </div >
                </Card>
                }
                {getETFStatus(etfIdLoading, etfId, isETFBurnedLoading, isETFBurned) === ETFState.MINTED && <Card
                    className="card"
                    style={{
                        width: "95%",
                    }}>
                    <Countdown value={
                        expirationTimeLoading ? 0 : expirationTimeError ? 0 : expirationTime ? expirationTime.toNumber() * 1000 : 0

                    }></Countdown>
                    <Result
                        status="success"
                        title="The Bundle has been locked and ETF tokens have been minted"
                        subTitle={"You can now trade your ETF tokens or use them to burn the bundle and redeem the underlying assets " + bundleId + " " + etfId}
                        extra={[<Button type="primary" onClick={() => {

                            reedem({
                                args: [bundleId],
                            })

                        }}>Reedem</Button>
                        ]}
                    />

                </Card>
                }
                {getETFStatus(etfIdLoading, etfId, isETFBurnedLoading, isETFBurned) === ETFState.BURNED && <Card

                    className="card"
                    style={{
                        width: "95%",
                    }}>
                    <Result
                        icon={<FireFilled />}
                        status={"error"}
                        title="The ETF has been burned and the tokens have been redeemed"
                        subTitle="You can trade your tokens again"
                    />
                    {/* Check if there are external chain assets and list all the chains
                        and propose to send a notification to the user to withdraw the asset
                        there will be a select box with the chain selector id and a button to send the notification
                    */}

                    {!isLoadingsendReedeemMessage && requiredTokenStructs.some((asset: any) => {
                        return asset.chainSelector !== chainSelectorId;
                    }) && <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            margin: '0 20px 0 20px'
                        }}
                    >
                            <h3>There are assets on other chains (not this chain selector Id: {chainSelectorId?.toString()})</h3>

                            <Select
                                onChange={(value) => {
                                    setNotifyChainSelectorId(value);
                                }}
                                options={requiredTokenStructs.filter((asset: any) => {
                                    return asset.chainSelector.toString() !== chainSelectorId.toString();
                                }).map((asset: any) => {
                                    return {
                                        value: asset.chainSelector.toString(),
                                        label: asset.chainSelector.toString()
                                    }
                                }
                                )}
                                style={{ width: 160 }}
                                placeholder="Select a chain"
                            />
                            <br></br>
                            <Button
                                className="button"
                                type="primary"
                                onClick={() => {
                                    sendReedeemMessage({
                                        args: [bundleId, notifyChainSelectorId, PayFeesIn.Native],
                                    })
                                }}
                            >Notify</Button>
                        </div>
                    }

                </Card>
                }
            </div>

        </Card >

    </Badge.Ribbon >

}