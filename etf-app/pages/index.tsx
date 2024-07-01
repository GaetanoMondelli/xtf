import Image from 'next/image';
import {
  ConnectWallet, useChainId, useChain,
  useConnectionStatus,
  useSwitchChain, useWallet, useNetworkMismatch
} from "@thirdweb-dev/react";
import styles from '../styles/page.module.css'
import { NextPage } from "next";
import ChainContext from "../context/chain";
import { Select, Card, InputNumber, Switch, Skeleton, Spin, Alert, Tabs, Divider, Watermark, Space, Tag, Layout, Tour, TourProps, Button, Image as AntdImage } from 'antd';
import BundleView from "../components/BundleView";
import ETFStatsView from "../components/ETFStatsView";
import PriceValueStats from "../components/PricesValueStats";
import Prices from "../components/Prices";
import { configs, Chain, chainIdToNetworkLogo, chainIdToNetworkName } from "../components/utils";

import { useState, useEffect, useRef, useContext } from 'react';
import { Sepolia } from "@thirdweb-dev/chains";
import PriceChartComponent from "../components/PriceDiagram";
import { inherits } from "util";




const Home: NextPage = () => {
  const selectRef = useRef(null);
  const chips = useRef(null);
  const etfStatsRef = useRef(null);
  const openRef = useRef(null);
  const mintedRef = useRef(null);
  const burnedRef = useRef(null);
  const tlvRef = useRef(null);
  const etfBalanceRef = useRef(null);
  const votingPowerRef = useRef(null);
  const vaultCompositionRef = useRef(null);
  const priceChartRef = useRef(null);
  const priceChartRef2 = useRef(null);
  const vaultViewRef = useRef(null);
  const matrixViewRef = useRef(null);
  const pieViewRef = useRef(null);
  const formViewRef = useRef(null);

  const [open, setOpen] = useState<boolean>(false);
  const [visible, setVisible] = useState<boolean>(false);
  const [scaleStep, setScaleStep] = useState(0.5);
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

  const steps: TourProps['steps'] = [
    {
      title: 'Select your ETF Index',
      description: 'Here you can select the index you want to invest or deposit in. Different indexes have different vault composition and different ETF tokens. In the future you will be ale to create your own index.',
      target: () => selectRef?.current,
    },
    {
      title: 'ETF Networks',
      description: 'The tags here show the networks where the ETF assets are deployed. You can switch between networks by clicking on the tags.',
      target: () => chips?.current,
    },
    {
      title: 'ETF Stats',
      description: 'This section shows the ETF stats for the selected index.',
      target: () => etfStatsRef?.current,
    },
    {
      title: 'Vault Open',
      description: 'This metric displays the number of vaults in which users have started depositing assets, but the deposits are not yet sufficient to reach completion.',
      target: () => openRef?.current,
    },
    {
      title: 'Vault Minted',
      description: 'This metric displays the number of vaults in which users have completed the deposit phase, the NFT Vote and ETF Tokens have been distributed and the vault is ready to be burned.',
      target: () => mintedRef?.current,
    },
    {
      title: 'Vault Burned',
      description: 'This metric displays the number of vaults in which users have completed the burn phase and the burner user have withdrawn the underlying assets.',
      target: () => burnedRef?.current,
    },
    {
      title: 'Total Locked Value',
      description: 'This metric displays an estimation based on current prices of the total value of assets locked in this ETF index.',
      target: () => tlvRef?.current,
    },
    {
      title: 'ETF Tokens Balance',
      description: 'This metric displays the total amount of ETF tokens you own and the total suppply.',
      target: () => etfBalanceRef?.current,
    },
    {
      title: 'Voting Power',
      description: 'This metric displays the total amount of NFT votes a user owns. Most of these metris are not yet available as the DAO is still in phase of definition',
      target: () => votingPowerRef?.current,
    },
    {
      title: 'Vault Composition',
      description: 'This section shows the composition of the vaults for the selected index. Prices here and in the scrolling marquee on top are fectehd real-time from Chainlink Data Feeds',
      target: () => vaultCompositionRef?.current,
    },
    {
      title: 'Price Chart',
      description: 'This section allows you to view the price chart for the selected index. There are two charts, one with normalised prices and one with a logaritmic representation.',
      target: () => priceChartRef?.current,
    },
    {
      title: 'Price Chart Normalised vs Logaritmic',
      description: 'The normalised chart shows the price of the index and the price of the assets composing the index. The logaritmic chart shows the price of the index and the price of the assets composing the index in a logaritmic scale.',
      target: () => priceChartRef2?.current,
    },
    {
      title: 'Specific Vault View State',
      // cover: (
      //   <Image
      //     width={400}
      //     height={400}
      //     alt="tour.png"
      //     src="/images/states.png"
      //   />
      // ),
      // target: () => vaultViewRef?.current,
    },
    {
      title: 'Vaults View Matrix',
      description: 'This section allows you to view the status of the vaults for the selected index. Gray vaults are vaults with no contributions. Blue vaults are vaults with contributions but not yet minted. Green vaults that have got all the required contributions and have been minted. Orange vaults have not yet committed messages from other chains. Red vaults are vaults that have been burned and the underlying assets have been withdrawn.',
      target: () => matrixViewRef?.current,
    },
    {
      title: 'Pie vault Composition and Deposits',
      description: 'This chart shows for a selected vault the assets composition and in the inner circle the amount of deposits. Green is the amount of deposits that the connetced user have deposited, red is the amount of deposits that other users have deposted and blue is the contributions missing to close (MINT) the vault.',
      target: () => pieViewRef?.current,
    },
    {
      title: 'Vault Form Actions',
      description: 'This section allows you to interact with the selected vault. You can deposit in OPEN vaults, withdraw in MINTED/CLOSED vaults, process messages from other chains.',
      target: () => formViewRef?.current,
    }
  ];


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
      else if (selectedChain === Chain.Amoy) {
        setSelectedChain(Chain.Amoy)
        switchChain(Chain.Amoy)
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
                <div
                  ref={selectRef}

                >

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
                  <Space
                    ref={chips}
                    size={[0, 8]} wrap>
                    {/* {
                        config
                      } */}

                    <Tag bordered={false} color="default"><b>Sepolia</b></Tag>
                    <Tag bordered={false} color="default"><b>Amoy</b></Tag>
                  </Space>
                </div>

                <div>
                  &nbsp;&nbsp;&nbsp;<span>Hardhat local test</span> &nbsp;&nbsp;
                  <Switch checkedChildren="Hardhat" unCheckedChildren="Prod"
                    className="nb-input"
                    disabled={true}
                    style={{
                      color: "black",
                      border: "2px solid black",
                      borderRadius: "0.25rem",
                      boxShadow: "2px 2px 0px 0px #000",
                      marginLeft: 20
                    }}
                    checked={localTest} onChange={(checked) => setLocalTest(checked)} />
                  <Divider type="vertical" />
                  <Button className="nb-input" type='dashed' onClick={() => setOpen(true)}>Tour</Button>
                  <Button className="nb-input" type='dashed' onClick={() => setVisible(true)}>
                    ?
                  </Button>




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
                            ref={tab === 'ETF STATS' ? etfStatsRef : null}
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
                <ETFStatsView
                  openRef={openRef}
                  mintedRef={mintedRef}
                  burnedRef={burnedRef}
                  tlvRef={tlvRef}
                  votingPowerRef={votingPowerRef}
                  etfBalanceRef={etfBalanceRef}
                  tokenAddress={config.contracts['ETFToken'][0].address} address={config.contracts['ETFv2'][0].address} />
                <PriceValueStats
                  vaultCompositionRef={vaultCompositionRef}
                  address={config.contracts['ETFv2'][0].address} />
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
                <div>

                  <PriceChartComponent chartRef={priceChartRef} title='Normalised Price Asset Comparison' normalise={true}></PriceChartComponent>
                  <PriceChartComponent chartRef={priceChartRef2} title='Logaritmic Price Asset Comparison' normalise={false}></PriceChartComponent>
                </div>}
              {selectedTab === '3' && <BundleView
                vaultViewRef={vaultViewRef}
                matrixViewRef={matrixViewRef}
                pieViewRef={pieViewRef}
                formViewRef={formViewRef}
                address={config.contracts['ETFv2'][0].address} bundleId={bundleId}
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

      <Tour open={open} onClose={() => setOpen(false)}
        steps={steps}
        onChange={(index) => {
          if (index < 10) {
            setSelectedTab('1')
          }
          if (index >= 10 && index < 11) {
            setTimeout(() => setSelectedTab('2'), 500)
          }
          if (index > 11) {
            // wait for the element to be rendered
            setTimeout(() => setSelectedTab('3'), 500)
          }
        }}

      />
      <AntdImage
        width={200}
        style={{ display: 'none' }}
        preview={{
          visible,
          scaleStep,
          src: "/images/states2.png",
          onVisibleChange: (value) => {
            setVisible(value);
          },
        }}
      />
    </>

  );
};

export default Home;
