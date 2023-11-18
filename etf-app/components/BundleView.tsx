import { useContract, useContractRead, useContractWrite } from "@thirdweb-dev/react";
import styles from '../styles/page.module.css'
const ABI = require("../.././artifacts/contracts/ETFContractv2.sol/ETFv2.json").abi;
const nativeAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
import { Button, Card, InputNumber, Progress } from 'antd';
import { BigNumber, ethers } from "ethers";
import { useState, useEffect } from "react";
import { Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import { minimiseAddress, getRequiredAsset, requiredTokenStructs, getValueChartData } from "./utils";

export default function BundleView({ address, bundleId, tokenToBeWrapped1Address, tokenToBeWrapped2Address }: {
    address: string, bundleId: number,
    tokenToBeWrapped1Address: string, tokenToBeWrapped2Address: string
}) {

    const [quantities, setQuantities] = useState<Map<string, number>>(new Map());
    const [prices, setPrices] = useState<any>();
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


    // use effect with async await

    useEffect(() => {
        async function fetchData() {
            const valuesChart = await getValueChartData();
            console.log("Fetched data: ", valuesChart); // Check what data is being fetched
            setPrices(valuesChart);
        }

        fetchData();
    }, []);


    return <Card>


        <div className={styles.description}>
            <h3>Bundle {bundleId}</h3>
            <br></br>

            {/* <p>Required Asset</p> */}
            {/* {JSON.stringify(prices)} */}
            <div style={{
                display: 'flex',
                justifyContent: 'center', // Center horizontally
                alignItems: 'center', // Center vertically
            }}>
                <div style={{ width: '300px', height: '300px', marginBottom: '20px' }}>
                    {prices && <Pie
                        data={{
                            labels: prices[0] || [],
                            datasets: [
                                {
                                    data: prices[1],
                                }
                            ]
                        }} />}
                </div>
            </div>


            {bundle && requiredTokenStructs.map((asset: any) => {
                const tokenAddress = asset.assetContract;
                const index = bundle[1].indexOf(tokenAddress);
                return <div>
                    <span>
                        | {minimiseAddress(asset.assetContract)} | {BigNumber.from(bundle[0][index] || 0).toString()} <Progress percent={
                            Number(BigNumber.from(bundle[0][index] || 0).mul(BigNumber.from(100)).div(BigNumber.from(getRequiredAsset(tokenAddress)?.totalAmount || 0)))
                        }></Progress> |   &nbsp;
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
                            BigNumber.from(quantities.get(tokenAddress)).mul(BigNumber.from(10).pow(18));
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