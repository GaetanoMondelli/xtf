import { useAddress, useBalance, useContract, useContractRead, useContractWrite } from "@thirdweb-dev/react";
import Image from 'next/image';
import styles from '../styles/page.module.css'
import TokenDescriptions from "./TokenDescriptionsView";
import { Badge, Button, Card, Statistic, Form, InputNumber, Progress, Divider, Result, Select, Tag, List } from 'antd';
import { FireFilled, LockOutlined, UnlockOutlined, BankOutlined } from '@ant-design/icons';
import { BigNumber, ethers } from "ethers";
import { useState, useEffect, useContext } from "react";
import { Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import { ETFv2ABI, getPriceAggregatorAddress, nativeAddress, ETFState, getETFStatus, getAssetName, PayFeesIn, ChainIdToSelectorId, networkToSelectorId, minimiseAddress } from "./utils";
import { Chart, ChartDataset } from "chart.js/auto";
import MatrixView from "../components/MatrixView";
import SideChainTokenDescriptions from "./SideChainTokenDescriptionsView";
import ChainContext from "../context/chain";



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
    const [notifyChainSelectorId, setNotifyChainSelectorId] = useState<any>(
        Object.keys(config.sideChainContracts)[0]
    );
    const { selectedChain, setSelectedChain, mockAggregatorAbi, etfV2Abi } = useContext(ChainContext);


    const userAddress = useAddress();

    const { contract, isLoading, error } = useContract(address, etfV2Abi);


    const { data: bundleState, isLoading: bundleStateLoading, error: bundleStateError } = useContractRead(
        contract,
        "returnStateOfBundles", [0, 96]
    );

    // const { data: burner, isLoading: burnerLoading, error: burnerError } = useContractRead(
    //     contract,
    //     "burners", [bundleId]
    // );

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

    const { mutateAsync: reedemNFTVote, isLoading: isReedemNFTVoteLoadinf, error: errorReedemNFTVote } = useContractWrite(
        contract,
        "reeedemNFTVote"
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

    const { data: winner, isLoading: winnerLoading, error: winnerError } = useContractRead(
        contract,
        "bundleIdToRandomWinner", [bundleId],
    );

    const { data: ownerOf, isLoading: ownerOfLoading, error: ownerOfError } = useContractRead(
        contract,
        "ownerOf", [etfId],
    );
    const sepLinkToken = "0x779877A7B0D9E8603169DdbD7836e478b4624789";

    const { data: linkBalance, isLoading: linkBalanceLoading, error: linkBalanceError } = useBalance(
        sepLinkToken,
    );
    const { contract: linkContract, isLoading: isLinkContractLoading, error: isLinkContractError } = useContract(sepLinkToken);

    const { data: linkContractBalance, isLoading: linkContractBalanceLoading, error: linkContractBalanceError } = useContractRead(
        linkContract,
        "balanceOf", [address],
    );

    const { mutateAsync: transferLink, isLoading: transferLinkLoading, error: transferLinkError } = useContractWrite(
        linkContract,
        "transfer"
    );

    const { data: reedemMessages, isLoading: reedemMessagesLoading, error: reedemMessagesError } = useContractRead(
        contract,
        "reedeemMessages", [bundleId, 0]
    );


    // 
    // const { data: fee, isLoading: feeLoading, error: feeError } = useContractRead(
    //     contract,
    //     "getReedemFee",
    //     [
    //         BigNumber.from("12532609583862916517"),
    //         PayFeesIn.LINK,
    //         {
    //             "bundleId": bundleId,
    //             "receiver": userAddress,
    //         },
    //     ],
    // );
    // getReedemFee

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
            labels.push(asset.assetContract);
        });
        return [labels, values];
    }

    useEffect(() => {
        async function fetchData() {
            if (requiredAsset == undefined || !mockAggregatorAbi) return;
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
                setRequiredTokenStructs(tmpRequiredAssets);
                const valuesChart = getValueChartData(tmpRequiredAssets, prices);
                setValues(valuesChart);
                setPrices(prices);
            }
        }
        fetchData();
    }, [requiredAsset, mockAggregatorAbi]);

    const transformUserDepositForChart2 = (userDeposit: any, requiredAsset: any, bundle: any, prices: any): [Array<string>, Array<number>] => {
        if (userDeposit == undefined || requiredAsset == undefined || bundle == undefined || prices == undefined) return [['User Contribution', "Other Users' Contribution", 'Remaining Allocation'], [0, 0, 0]];

        const userDepositQuantities = userDeposit[0];
        const userDepositAddresses = userDeposit[1];
        const zippedUserArray = userDepositQuantities.map((value: any, index: number) => { return { quantity: value, address: userDepositAddresses[index] } });

        const bundleDepositQuantities = bundle[0];
        const bundleDepositAddresses = bundle[1];
        const zippedBundleArray = bundleDepositQuantities.map((value: any, index: number) => { return { quantity: value, address: bundleDepositAddresses[index] } });

        const requiredQuantities = requiredAsset[0];
        const requiredAddresses = requiredAsset[1];
        const zippedRequiredArray = requiredQuantities.map((value: any, index: number) => { return { quantity: value, address: requiredAddresses[index] } });

        let totalRequiredValue = BigNumber.from(0);
        let userContribution = BigNumber.from(0);
        // other users will be bundle value - user contribution
        let bundleValue = BigNumber.from(0);

        const userDepositArrayBN = []

        for (let i = 0; i < zippedRequiredArray.length; i++) {
            if (zippedRequiredArray[i] == undefined || prices[i] == undefined) continue;
            let requiredValue = BigNumber.from(zippedRequiredArray[i].quantity).mul(BigNumber.from(prices[i]).div(BigNumber.from(10).pow(8))).div(BigNumber.from(10).pow(18));
            totalRequiredValue = totalRequiredValue.add(requiredValue);
            // find the bundle contribution with the same address
            const bundleContributionIndex = zippedBundleArray.findIndex((value: any) => value.address == requiredAddresses[i]);
            console.log("userDepositArrayBN index", requiredAddresses[i], bundleContributionIndex);
            if (bundleContributionIndex != -1) {
                bundleValue = bundleValue.add(BigNumber.from(zippedBundleArray[bundleContributionIndex].quantity).mul(BigNumber.from(prices[i]).div(BigNumber.from(10).pow(8))).div(BigNumber.from(10).pow(18)));
            }

            // find the user contribution with the same address
            const userContributionIndex = zippedUserArray.findIndex((value: any) => value.address == requiredAddresses[i]);
            console.log("userDepositArrayBN index", requiredAddresses[i], bundleContributionIndex);

            if (userContributionIndex != -1) {
                userContribution = userContribution.add(BigNumber.from(zippedUserArray[userContributionIndex].quantity).mul(BigNumber.from(prices[i]).div(BigNumber.from(10).pow(8))).div(BigNumber.from(10).pow(18)))
            }
        }

        // const transformFromBN = (value: BigNumber): Number => { return value.div(BigNumber.from(10).pow(16)).toNumber() / 100 }

        userDepositArrayBN.push(userContribution.toNumber());
        userDepositArrayBN.push(bundleValue.toNumber() - userContribution.toNumber());
        userDepositArrayBN.push(totalRequiredValue.toNumber() - bundleValue.toNumber());
        console.log("userDepositArrayBN", userDepositArrayBN);
        return [['User Contribution', "Other Users' Contribution", 'Remaining Allocation'], userDepositArrayBN]
    }
    // calculate the toal



    const transformUserDepositForChart = (userDeposit: any, requiredAsset: any, bundle: any, prices: any) => {
        console.log("userDeposit", userDeposit, requiredAsset);
        console.log("bundle", bundle);
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
            data: transformUserDepositForChart2(userDeposit, requiredAsset, bundle, prices)[1],
            borderColor: 'black',
            borderWidth: 2,
            label: 'Deposit Allocation',
            backgroundColor: ["rgba(75, 192, 192, 0.5)", "rgba(255, 99, 132, 0.5)", "rgba(125, 217, 255, 0.5)"]
        }
    ];





    return <>

        {selectedChain === config.chainId && < Badge.Ribbon
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
                    <br></br>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-evenly', // Center horizontally
                        alignItems: 'space-between', // Center vertically
                    }}>
                        {/* {!requiredAssetLoading && <pre>{JSON.stringify(bundle, null, 2)}</pre>}
                    {!requiredAssetLoading && <pre>{JSON.stringify(quantities, null, 2)}</pre>} */}
                        <MatrixView address={address}
                            bundleId={bundleId}
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
                                                        const remainingAllocation = { ...labelsOriginal[labelsOriginal.length - 1] };

                                                        if (userDeposit && userDeposit[0].length !== 0) {
                                                            userDeposits.text = "User's Deposits";
                                                            userDeposits.fillStyle = 'rgba(75, 192, 192, 0.5)';
                                                            labelsOriginal.push(userDeposits);

                                                            otherDeposits.text = "Other's Deposits";
                                                            otherDeposits.fillStyle = 'rgba(255, 99, 132, 0.5)';
                                                            labelsOriginal.push(otherDeposits);

                                                            remainingAllocation.text = "Remaining Allocation";
                                                            // facebook blue
                                                            remainingAllocation.fillStyle = 'rgba(125, 217, 255, 0.5)';
                                                            labelsOriginal.push(remainingAllocation);
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

                        {bundle && bundle[0] && !chainSelectorIdLoading && requiredTokenStructs.map((asset: any, key: number) => {

                            // if(asset.chainSelector.toString() !== chainSelectorId.toString()) return;

                            const tokenAddress = asset.assetContract;
                            const index = bundle[1].indexOf(tokenAddress);
                            return <div key={tokenAddress + key}
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
                                        bundleId={bundleId}
                                        address={tokenAddress}
                                        etfAddress={address}
                                        bundle={bundle}
                                        index={index}
                                        quantities={quantities}
                                        setQuantities={setQuantities}
                                        requiredTokenStructs={requiredTokenStructs}
                                        chainSelectorId={chainSelectorId}
                                        currentConfig={config}
                                        userDeposit={userDeposit}
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
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'row',
                                justifyContent: 'flex-end',
                                // on the right
                                marginRight: '30px'
                            }}>
                            <div>

                                <span
                                // float on the right
                                >Vote n. <b>{etfId?.toString()}</b> &nbsp;Owner: &nbsp; <Tag>{minimiseAddress(ownerOf?.toString())}</Tag>
                                </span>
                                <br></br>
                                <br></br>

                                <a href={`https://testnets.opensea.io/assets/sepolia/0xE8f7fa3a1CB1AA2D9053EeF4dE65Cf1A23337f3D/${etfId?.toString()}`} title="Buy on OpenSea" target="_blank">
                                    <Image
                                        width={180}
                                        height={60}
                                        src="/images/opensea.png"
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'flex-end',
                                            alignItems: 'center',
                                            borderRadius: '5px',
                                            boxShadow: '0px 1px 6px rgba(0, 0, 0, 0.25)'
                                        }}
                                        alt="Available on OpenSea" />
                                </a>
                            </div>

                        </div>


                        <Result
                            key={'reedemresult' + bundleId}
                            status="success"
                            title="The Vault has been closed and ETF tokens have been minted"
                            subTitle={"You can now trade your ETF tokens or use them to burn the vault and redeem the underlying assets "}
                            extra={[

                                <Button
                                    key={'reedembutton' + bundleId}
                                    icon={
                                        expirationTimeLoading ? <LockOutlined /> : expirationTimeError ? <LockOutlined /> : expirationTime ? expirationTime.toNumber() * 1000 > Date.now() ? <LockOutlined /> : <UnlockOutlined /> : <LockOutlined />
                                    }
                                    disabled={expirationTimeLoading ? true : expirationTimeError ? true : expirationTime ? expirationTime.toNumber() * 1000 > Date.now() : true}
                                    type="primary" onClick={() => {

                                        reedem({
                                            args: [bundleId],
                                        })

                                    }}>Reedem</Button>,
                                <span
                                    key={'reedemNFTVote' + bundleId}
                                >{!winnerLoading && winner === userAddress
                                    && ownerOf?.toString() == address && <p>
                                        <Divider />
                                        <Tag color="green"> You are eligble to reedem a vote</Tag>
                                        <br></br>
                                        <br></br>

                                        <Button type="primary"
                                            size="small"
                                            icon={
                                                <BankOutlined />
                                            }
                                            onClick={() => {

                                                reedemNFTVote({
                                                    args: [bundleId],
                                                })

                                            }}>Reedem NFT Vote</Button>
                                    </p>}</span>
                            ]
                            }
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
                            subTitle="You can now trade your tokens again"
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
                                <br></br>
                                {linkBalance && <p>Your Balance: <Tag color="green">{linkBalance?.value.div(
                                    BigNumber.from(10).pow(16)
                                ).toNumber() / 100} {linkBalance?.symbol}</Tag></p>}
                                {linkContractBalance && <p>Contract Balance: <Tag color="green">{linkContractBalance?.div(
                                    BigNumber.from(10).pow(16)
                                ).toNumber() / 100} {linkBalance?.symbol}</Tag></p>}
                                {transferLink && <p>
                                    CCIP requires LINK to send notifications to other chains.
                                    <Button type="link" size="small" onClick={() => {
                                        // transfer link tokens to etf contract
                                        transferLink({
                                            args: [address, BigNumber.from(5).mul(BigNumber.from(10).pow(18))]
                                        })

                                    }
                                    }>Transfer LINK</Button>
                                </p>}
                                {/* {fee && <p>Esitamted fee for sending Reedem message {BigNumber.from(fee).div(BigNumber.from(10).pow(16)).toNumber() / 100} </p>}
                                {feeError && <p>{JSON.stringify(feeError)} </p>} */}
                                <Select
                                    onChange={(value) => {
                                        setNotifyChainSelectorId(value);
                                    }}
                                    defaultValue={
                                        notifyChainSelectorId
                                    }
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
                                <br></br>
                                <List
                                    // grey background
                                    style={{
                                        width: '94%',
                                        padding: '3%',
                                        overflowY: 'auto',
                                        backgroundColor: '#f7f7f7'
                                    }}
                                    grid={{ gutter: 20, column: 3 }}
                                    dataSource={[reedemMessages] || []}
                                    renderItem={(item: any) => (
                                        <List.Item>
                                            <Card
                                                className="customcard"
                                                title={
                                                    <>
                                                        {`CCIP MessageId:`}<a
                                                            style={{
                                                                color: 'blue'
                                                            }}
                                                            href={`https://ccip.chain.link/msg/${item?.messageId}`}
                                                            target="_blank" rel="noreferrer">{minimiseAddress(item?.messageId)}</a>
                                                    </>
                                                }>
                                                {/* <p>{`Sender: ${minimiseAddress(item.sender)}`}</p> */}
                                                <p>{`Bundle ID: ${item.bundleId}`}</p>
                                                <p>{
                                                    // `Chain Selector ID: ${item.chainSelectorId}`
                                                    `Chain Selector ID: ${notifyChainSelectorId}`
                                                }</p>

                                            </Card>
                                        </List.Item>
                                    )}
                                />


                                <Button
                                    className="button"
                                    type="primary"
                                    disabled={reedemMessages && reedemMessages.length > 0}
                                    onClick={() => {
                                        sendReedeemMessage({
                                            args: [bundleId, "12532609583862916517", PayFeesIn.LINK],
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



        {selectedChain !== config.chainId && <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'center',
                margin: '0 20px 0 20px'
            }}
        >

            <SideChainTokenDescriptions
                address={config.sideChainContracts[
                    networkToSelectorId[selectedChain]
                ]['FungibleToken'][0].address}
                etfAddress={config.sideChainContracts[
                    networkToSelectorId[selectedChain]
                ]['SidechainDeposit'][0].address}
                bundleId={bundleId}
                requiredTokenStruct={getRequiredAsset(address)}
                chainSelectorId={getRequiredAsset(address)?.chainSelector}
            />

            <br></br>
            <Button
                className="button"
                type="primary"
                onClick={() => {
                    setSelectedChain(config.chainId);
                }}
            >Go back to the main chain
            </Button>
        </div>
        }

    </>

}
