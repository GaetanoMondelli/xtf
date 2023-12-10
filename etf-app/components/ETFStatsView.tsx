import { useAddress, useContract, useBalance, Web3Button, useConnectionStatus, useContractRead } from "@thirdweb-dev/react";
import styles from '../styles/page.module.css'
import { Badge, Button, Card, Col, Layout, Row, Statistic, Tag } from 'antd';
import style from '../styles/page.module.css';
import { BigNumber, ContractInterface } from "ethers";
import { ETFv2ABI, showOnlyTwoDecimals, calculateTLV, nativeAddress } from "./utils";
import { useContext, useEffect, useState, useRef } from "react";

import ChainContext from "../context/chain";


const { Meta } = Card;

export default function ETFStatsView(
    { address, tokenAddress,
        openRef,
        mintedRef,
        burnedRef,
        tlvRef,
        votingPowerRef,
        etfBalanceRef,

    }: {
        address: string, tokenAddress: string, openRef: any, mintedRef: any, burnedRef: any, tlvRef: any, votingPowerRef: any, etfBalanceRef: any
    }
) {
    const [TLV, setTLV] = useState<any>("Loading...s");
    const offsetMintedBeforeChangingOwenrs = 150;
    const connectionStatus = useConnectionStatus();
    const userAddress = useAddress();

    const { mockAggregatorAbi, etfV2Abi } = useContext(ChainContext);

    const { contract, isLoading, error } = useContract(address, etfV2Abi);
    const { contract: tokenContract, isLoading: tokenIsLoading, error: tokenError } = useContract(address);

    // const { contract: tokenContract, isLoading: tokenIsLoading, error: tokenError } = useContract(address, ABI);
    const { data: balance, isLoading: balanceLoading, error: balanceError } = useBalance(
        tokenAddress,
    );

    const { data: tokenTotalSupply, isLoading: tokenTotalSupplyLoading, error: tokenTotalSupplyError } = useContractRead(
        tokenContract,
        "totalSupply",
    );


    const { data: totalSupply, isLoading: totalSupplyLoading, error: totalSupplyError } = useContractRead(
        contract,
        "totalSupply",
    );

    const { data: voteBalance, isLoading: voteBalanceLoading, error: voteBalanceError } = useContractRead(
        contract,
        "balanceOf", [userAddress]
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

    const { data: chainSelectorId, isLoading: chainSelectorIdLoading, error: chainSelectorIdError } = useContractRead(
        contract,
        "currentChainSelectorId",
    );

    const { data: isWhiteListed, isLoading: isWhiteListedLoading, error: isWhiteListedError } = useContractRead(
        contract,
        "isWhiteListedToken", [0, nativeAddress]
    );

    const { data: bundleState, isLoading: bundleStateLoading, error: bundleStateError } = useContractRead(
        contract,
        "returnStateOfBundles", [0, 96]
    );

    useEffect(() => {
        async function fetchData() {
            if (bundleStateLoading || bundleState == undefined || !mockAggregatorAbi) return;
            const tlv = await calculateTLV(bundleState, mockAggregatorAbi);
            setTLV(tlv);
        }
        fetchData();
    }, [bundleState, mockAggregatorAbi]);


    const getVotePower = (): [number, string] => {
        if (connectionStatus !== "connected") return [0, "Loading..."];
        if (connectionStatus === "connected") {
            if (!voteBalanceLoading && !voteBalanceError && voteBalance && !totalSupplyLoading && !totalSupplyError && totalSupply) {
                return [
                    BigNumber.from(voteBalance).toNumber(),
                    '/' + BigNumber.from(totalSupply).toString()
                ];
            }
        }
        else if (connectionStatus === "disconnected") {
            if (!totalSupplyLoading && !totalSupplyError && totalSupply) {
                return [BigNumber.from(totalSupply).toNumber(), ""];
            }
        }
        return [0, "Loading..."]
    }



    return <>

        <Card className="card"
            style={{
                width: "95%",
            }}>
            <Meta
                title="Vault Stats"
            />
            <br></br>

            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    margin: '0 20px 0 20px'
                }}
            >
                {/* {!chainSelectorIdLoading && <p>Chain Selector ID {BigNumber.from(chainSelectorId).toString()}</p>}
            {!isWhiteListedLoading && <p>Whitelisted: {isWhiteListed ? "Yes" : "No"}</p>} */}


                <span ref={openRef}>

                    <Statistic title="Vault Opened" value={
                        bundleCountLoading ? "Loading..." : bundleCountError ?
                            "Error" : bundleCount ? bundleCount.toString() : "0"
                    }
                    />
                </span>
                <span ref={mintedRef}>
                    <Statistic title="Vault Minted" value={
                        isLoading ? "Loading..." : totalSupplyError ?
                            "Error" : totalSupplyLoading ? "Loading..." :
                                BigNumber.from(totalSupply).toString()} />
                </span>
                <span ref={burnedRef}>
                    <Statistic title="Vault Burnt" value={
                        burnedCountLoading ? "Loading..." : burnedCountError ?
                            "Error" : burnedCount ? burnedCount.toString() : "0"
                    } />
                </span>
                <span ref={tlvRef}>
                    <Statistic title="Estimated TLV" suffix="$" value={
                        bundleStateLoading ? "Loading..." : bundleStateError ?
                            "Error" : bundleState ? showOnlyTwoDecimals(TLV) : "0"

                    } />
                </span>
                <span ref={etfBalanceRef}>
                    <Statistic title={
                        connectionStatus === "connected" ? "ETF Tokens Balance" : "ETF Token Supply"
                    }
                        suffix={connectionStatus === "connected" ?
                            totalSupplyLoading ? "Loading..." : totalSupplyError ?
                                "Error" :
                                "/ " + showOnlyTwoDecimals(BigNumber.from(totalSupply).mul(100).toString() as string) : ""}
                        value={
                            connectionStatus === "connected" ?
                                balanceLoading ? "Loading..." : balanceError ?
                                    "Error" :
                                    showOnlyTwoDecimals(balance?.displayValue as string) :
                                tokenTotalSupplyLoading ? "Loading..." : tokenTotalSupplyError ?
                                    "Error"
                                    : showOnlyTwoDecimals(BigNumber.from(tokenTotalSupply).mul(100).add(0).toString())
                        } />

                </span>
            </div>
        </Card>

        <Card className="card"
            style={{
                width: "95%",
            }}>
            <Meta
                title="Index Dao"
            />
            <br></br>

            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    margin: '0 20px 0 20px'
                }}
            >
                {/* {!chainSelectorIdLoading && <p>Chain Selector ID {BigNumber.from(chainSelectorId).toString()}</p>}
            {!isWhiteListedLoading && <p>Whitelisted: {isWhiteListed ? "Yes" : "No"}</p>} */}


                <Statistic title="Voting Quota" value={
                    isLoading ? "Loading..." : totalSupplyError ?
                        "Error" : totalSupplyLoading ? "Loading..." :
                            BigNumber.from(totalSupply).toString()} />

                <span ref={votingPowerRef}>
                    <Statistic title={
                        connectionStatus === "connected" ? "Voting Power" : "Voting Quota"
                    }
                        value={getVotePower()[0]}
                        suffix={getVotePower()[1]}
                    />
                </span>



                <Statistic title="Last Vote Cast"
                    prefix={
                        <div
                            style={{
                                backgroundColor: "grey",
                                height: "40px",
                                padding: "5px",
                                fontSize: "18px",
                            }}
                            className="badge">Soon</div>
                    }
                    valueStyle={
                        {
                            color: "white"
                        }
                    }
                />
                <Statistic title="Consensus Thrsld"
                    prefix={
                        <div
                            style={{
                                backgroundColor: "grey",
                                height: "40px",
                                padding: "5px",
                                fontSize: "18px",
                            }}
                            className="badge">Soon</div>
                    }
                    valueStyle={
                        {
                            color: "white"
                        }
                    }
                />
                <Statistic title="Rebalancing Schedule"
                    prefix={
                        <div
                            style={{
                                backgroundColor: "grey",
                                height: "40px",
                                padding: "5px",
                                fontSize: "18px",
                            }}
                            className="badge">Soon</div>
                    }
                    valueStyle={
                        {
                            color: "white"
                        }
                    }
                />
                {/* Rebalancing Schedule */}


            </div>
        </Card>
    </>
}