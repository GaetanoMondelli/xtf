import {
  ConnectWallet, useChainId, useChain,
  useConnectionStatus,
  useSwitchChain, useWallet
} from "@thirdweb-dev/react";
import styles from '../styles/page.module.css'
import { NextPage } from "next";
import ChainContext from "../context/chain";
import { Select, Card, InputNumber, Switch } from 'antd';
import BundleView from "../components/BundleView";
import ETFStatsView from "../components/ETFStatsView";
import PriceValueStats from "../components/PricesValueStats";
import Prices from "../components/Prices";
import { configs, Chain } from "../components/utils";

import { useState, useEffect, useContext } from 'react';
import { Sepolia } from "@thirdweb-dev/chains";
import PriceChartComponent from "../components/PriceDiagram";

const minimiseAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const Home: NextPage = () => {

  const [bundleId, setBundleId] = useState<number>(0);
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
      setSelectedChain(Chain.Sepolia)
      switchChain(Sepolia.chainId)
    }
  }, [localTest, connectionStatus])




  return (
    <main className={styles.main}>

      {config && config?.contracts?.['ETFv2'][0] && <>
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
            <img width={120} src="/images/lg.png" alt="logo" />
          </div>
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

          <div className="card"
            style={{
              width: "70%",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
              padding: 4,
            }}
          >
            <span>&nbsp;&nbsp;{"Select Index"}</span>
            <Select
              style={{
                border: "3px solid black",
                borderRadius: "0.6rem",

                width: "40%",
                marginLeft: 20
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

          </div>
          {config && <Card className="card"
            style={{
              width: "100%",
            }}
          >
            <div>
              {/* <p>ETF Address</p>
            <p>{config.contracts['ETFv2'][0].address}</p> */}
            </div>
            <ETFStatsView tokenAddress={config.contracts['ETFToken'][0].address} address={config.contracts['ETFv2'][0].address} />
            <PriceValueStats address={config.contracts['ETFv2'][0].address} />
            {/* <Prices address={config.contracts['ETFv2'][0].address} /> */}
            <br></br>
            <div className={styles.description}>


              <span>Vault Viewer {selectedChain}</span>
              <InputNumber

                style={{
                  color: "black",
                  border: "2px solid black",
                  borderRadius: "0.25rem",
                  boxShadow: "2px 2px 0px 0px #000",
                  marginLeft: 20
                }}
                defaultValue={0}
                min={0}
                onChange={(value) => setBundleId(Number(value))}
              />
              &nbsp;&nbsp;&nbsp;<span>Hardhat local test</span> &nbsp;&nbsp;
              <Switch checkedChildren="Hardhat" unCheckedChildren="Sepolia"
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
          </Card>
          }
          <br></br>
          <PriceChartComponent></PriceChartComponent>

          <BundleView address={config.contracts['ETFv2'][0].address} bundleId={bundleId}
            setBundleId={setBundleId}
            tokenToBeWrapped1Address={config.contracts['FungibleToken'][0].address}
            tokenToBeWrapped2Address={config.contracts['FungibleToken'][1].address}
            config={config}

          ></BundleView>
        </div>
        <br></br>
        <br></br>


        <div className={styles.grid}>
          <a
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            className={styles.card}
            target="_blank"
            rel="noopener noreferrer"
          >
            <h2>
              Whitepaper <span>-&gt;</span>
            </h2>
            <p>Find in-depth information about Next.js features and API.</p>
          </a>

          <a
            href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            className={styles.card}
            target="_blank"
            rel="noopener noreferrer"
          >
            <h2>
              Learn <span>-&gt;</span>
            </h2>
            <p>Learn about Next.js in an interactive course with&nbsp;quizzes!</p>
          </a>

          <a
            href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            className={styles.card}
            target="_blank"
            rel="noopener noreferrer"
          >
            <h2>
              About <span>-&gt;</span>
            </h2>
            <p>Explore the Next.js 13 playground.</p>
          </a>

          <a
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            className={styles.card}
            target="_blank"
            rel="noopener noreferrer"
          >
            <h2>
              Deploy <span>-&gt;</span>
            </h2>
            <p>
              Instantly deploy your Next.js site to a shareable URL with Vercel.
            </p>
          </a>
        </div>
      </>}

    </main>
  );
};

export default Home;
