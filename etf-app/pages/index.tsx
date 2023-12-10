import Image from 'next/image';
import {
  ConnectWallet, useChainId, useChain,
  useConnectionStatus,
  useSwitchChain, useWallet, useNetworkMismatch
} from "@thirdweb-dev/react";
import styles from '../styles/page.module.css'
import { NextPage } from "next";
import ChainContext from "../context/chain";
import { Select, Card, InputNumber, Switch, Skeleton, Spin, Alert, Tabs, Divider, Watermark, Space, Tag, Layout } from 'antd';
import BundleView from "../components/BundleView";
import ETFStatsView from "../components/ETFStatsView";
import PriceValueStats from "../components/PricesValueStats";
import Prices from "../components/Prices";
import { configs, Chain, chainIdToNetworkLogo, chainIdToNetworkName } from "../components/utils";

import { useState, useEffect, useContext } from 'react';
import { Sepolia } from "@thirdweb-dev/chains";
import PriceChartComponent from "../components/PriceDiagram";
import { inherits } from "util";

const { TabPane } = Tabs;

const minimiseAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const Home: NextPage = () => {

  const [bundleId, setBundleId] = useState<number>(0);
  const [selectedTab, setSelectedTab] = useState<string>('1');
  const [localTest, setLocalTest] = useState<boolean>(false)
  const [config, setConfig] = useState<any>(
    configs.find((c: any) => c.chainId === Sepolia.chainId)
  );
  const { selectedChain, setSelectedChain } = useContext(ChainContext);
  const chainId = useChainId();
  const chain = useChain();
  const walletInstance = useWallet();

  const connectionStatus = useConnectionStatus();
  const switchChain = useSwitchChain();
  const isMismatched = useNetworkMismatch();


  useEffect(() => {
    if (!walletInstance) return
    let config = configs.find((c: any) => c.chainId === chainId) || {}
    setConfig(config)
    if (localTest) {
      // 31337
      setLocalTest(true)
    }
    else if (localTest) {
      setLocalTest(false)
    }

  }, [])

  useEffect(() => {
    if (!walletInstance) return
    if (localTest) {
      setSelectedChain(Chain.Localhost)
      switchChain(31337)
    } else {
      console.log('here')
      if (!isMismatched) return;


      if (selectedChain === Chain.Sepolia) {
        setSelectedChain(Chain.Sepolia)
        switchChain(Chain.Sepolia)
      }
      else if (selectedChain === Chain.Mumbai) {
        setSelectedChain(Chain.Mumbai)
        switchChain(Chain.Mumbai)
      }
    }
  }, [chainId, localTest, selectedChain, connectionStatus])




  return (
    <>
      <Watermark zIndex={-9}
        // image={chainIdToNetworkLogo[Number(chainId)]}
        style={
          // take the whole screen in the behind all the elements
          {
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            minHeight: "100%",
          }
        }
        content={chainIdToNetworkName[Number(chainId)]} gap={[20, 140]}
        height={130}
        width={150}>
        <div
          style={{
            marginLeft: "15%",
            marginRight: "15%",
            marginTop: "2%",
            marginBottom: "1%",
            padding: 20,
            backgroundColor: "white",
            zIndex: 1,
          }}

        >
          {connectionStatus === 'connected' && !isMismatched && config && config?.contracts?.['ETFv2'][0] && <>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20
              }}
            >
              <Image width={120} height={120} src="/images/logo3.png" alt="logo" />
              <Prices address={config?.contracts['ETFv2'][0].address} />
              <div>
                <ConnectWallet
                  theme={'light'}
                  btnTitle="Connect"
                  style={{
                    backgroundColor: "White",
                    color: "black",
                    colorScheme: "light",
                    border: "2px solid black",
                    borderRadius: "0.25rem",
                    boxShadow: "2px 2px 0px 0px #000",
                  }}
                />
              </div>

            </div>
            <div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                  marginTop: 25,
                  padding: 4,
                }}
              >
                <div>

                  <span>&nbsp;&nbsp;{"Select Index"}</span>
                  <Select
                    style={{
                      border: "2px solid black",
                      borderRadius: "0.6rem",
                      marginLeft: 20,
                      width: "40%",
                      // marginLeft: 20
                    }}
                    value={config.name}
                    onChange={(value) => {
                      const config = configs.find((c: any) => c.name === value) || {}
                      console.log("config found", value, config)
                      setConfig(config)
                    }}
                    options={configs.filter((c: any) => c.chainId === chainId)
                      .map((c: any) => ({
                        label: c.name,
                        value: c.name,
                      }))}
                  ></Select>
                  <Divider type="vertical" />
                  <Space size={[0, 8]} wrap>
                    {/* {
                        config
                      } */}

                    <Tag bordered={false} color="default"><b>Sepolia</b></Tag>
                    <Tag bordered={false} color="default"><b>Mumbai</b></Tag>
                  </Space>
                </div>

                <div>
                  &nbsp;&nbsp;&nbsp;<span>Hardhat local test</span> &nbsp;&nbsp;
                  <Switch checkedChildren="Hardhat" unCheckedChildren="Prod"
                    className="nb-input"
                    style={{
                      color: "black",
                      border: "2px solid black",
                      borderRadius: "0.25rem",
                      boxShadow: "2px 2px 0px 0px #000",
                      marginLeft: 20
                    }}
                    checked={localTest} onChange={(checked) => setLocalTest(checked)} />
                </div>

              </div>
              <Divider></Divider>
              <Tabs defaultActiveKey="1"
                onChange={(key) => setSelectedTab(key)}
                renderTabBar={
                  (props, DefaultTabBar) =>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        marginBottom: 20,
                        gap: 20,
                      }}
                    >
                      {
                        ['ETF STATS', 'PRICE CHART', 'VAULT VIEW'].map((tab, index) => (
                          <div
                            className="customcard"
                            key={'tab' + index}
                            onClick={() => setSelectedTab((index + 1).toString())}
                            style={{
                              backgroundColor: selectedTab === (index + 1).toString() ? "gray" : "white",
                              color: selectedTab === (index + 1).toString() ? "white" : "black",
                              border: "2px solid black",
                              borderRadius: "0.25rem",
                              boxShadow: "2px 2px 0px 0px #000",
                              padding: 10,
                              width: "33%"
                            }}
                          >
                            {tab}
                          </div>))
                      }
                    </div>
                }
              >
              </Tabs>

              {selectedTab === '1' && chainId === config.chainId && <Card className="card"
                style={{
                  width: "100%",
                }}
              >
                <ETFStatsView tokenAddress={config.contracts['ETFToken'][0].address} address={config.contracts['ETFv2'][0].address} />
                <PriceValueStats address={config.contracts['ETFv2'][0].address} />
                {/* <Prices address={config.contracts['ETFv2'][0].address} /> */}
                <br></br>

              </Card>
              }

              {selectedTab === '3' &&
                <div className={styles.description}>
                  <span>Vault Viewer</span>
                  <InputNumber
                    style={{
                      color: "black",
                      border: "2px solid black",
                      borderRadius: "0.25rem",
                      boxShadow: "2px 2px 0px 0px #000",
                      marginLeft: 20
                    }}
                    value={bundleId}
                    min={0}
                    onChange={(value) => setBundleId(Number(value))}
                  />


                </div>}
              <br></br>

              {selectedTab === '2' &&
                <div
                // style={{
                //   display: "flex",
                //   flexDirection: "row",
                //   alignItems: "center",
                //   justifyContent: "center",
                //   marginBottom: 20,
                //   width: "100%"
                // }}
                >

                  <PriceChartComponent title='Normalised Price Asset Comparison' normalise={true}></PriceChartComponent>
                  <PriceChartComponent title='Logaritmic Price Asset Comparison' normalise={false}></PriceChartComponent>
                </div>}
              {selectedTab === '3' && <BundleView address={config.contracts['ETFv2'][0].address} bundleId={bundleId}
                setBundleId={setBundleId}
                tokenToBeWrapped1Address={config.contracts['FungibleToken'][0].address}
                tokenToBeWrapped2Address={config.contracts['FungibleToken'][1].address}
                config={config}

              ></BundleView>
              }
            </div>
            <br></br>
            <br></br>


            <div className={styles.grid}>
              
              <a
                href=""
                className={styles.card}
                target="_blank"
                style={{
                  color: "black",
                }}
                rel="noopener noreferrer"
              >
                <h2>
                  Whitepaper <span>-&gt;</span>
                </h2>
                <p>Roadmap and Whitepaper will be soon available</p>
              </a>

              <a
                href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
                className={styles.card}
                target="_blank"
                style={{
                  color: "black",
                }}
                rel="noopener noreferrer"
              >
                <h2>
                  Learn <span>-&gt;</span>
                </h2>
                <p>
                  Landing page and guide for the ETFv2 contract will be soon available
                </p>
              </a>
              <a
                href="https://chain.link/hackathon"
                className={styles.card}
                target="_blank"
                style={{
                  color: "black",
                }}
                rel="noopener noreferrer"
              >
                <h2>
                  Chainlink Constellation <span>-&gt;</span>
                </h2>
                <p>Check other projects here</p>
              </a>

              <a
                href="https://gaetanomondelli.github.io/#/"
                className={styles.card}
                target="_blank"
                // text color black
                style={{
                  color: "black",
                }}
                rel="Landing page and guide for the ETFv2 contract will be soon available"
              >
                <h2>
                  About <span>-&gt;</span>
                </h2>
                <p>Visit my not-updated info page</p>
              </a>
            </div>
            <Divider></Divider>
            <Layout.Content>
              Made with 🖤  in Shoreditch, London 2023
            </Layout.Content>
          </>}

          {
            !(connectionStatus === 'connected' && !isMismatched) && <>
              <div className={styles.description}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 20
                  }}
                >
                  <Image width={120} height={120} src="/images/logo3.png" alt="logo" />
                  {/* <Prices address={config?.contracts['ETFv2'][0].address} /> */}
                  <Skeleton
                    style={{
                      marginLeft: 20,
                      marginRight: 20
                    }}


                    active />
                  <div>
                    <ConnectWallet
                      theme={'light'}
                      btnTitle="Connect"
                      style={{
                        backgroundColor: "White",
                        color: "black",
                        colorScheme: "light",
                        border: "2px solid black",
                        borderRadius: "0.25rem",
                        boxShadow: "2px 2px 0px 0px #000",
                      }}
                    />
                  </div>
                </div>
              </div>

              <Alert

                style={{
                  marginTop: "10%",
                  marginLeft: "15%",
                  marginRight: "15%",
                }}

                message={`Change network`}
                description={<>Please connect to the <b>{chainIdToNetworkName[Number(selectedChain)][1]}</b> network</>}
                type="warning"
              />
              {/* <Spin tip="Loading..."> */}
            </>
          }
        </div >
      </Watermark >


    </>

  );
};

export default Home;
