import { ConnectWallet, useChainId, useConnect, useContract, useSwitchChain, useWallet } from "@thirdweb-dev/react";
import styles from '../styles/page.module.css'
import { NextPage } from "next";
import CONTRACTS from '../../CONTRACTS.json'
import SEPOLIA_CONTRACTS from '../../CONTRACTS-sepolia.json'
import ChainContext from "../context/chain";
import { Button, Card, InputNumber, Switch } from 'antd';
import BundleView from "../components/BundleView";
import ETFStatsView from "../components/ETFStatsView";
import PriceValueStats from "../components/PricesValueStats";
import Prices from "../components/Prices";
import { Chain } from "../components/utils";

import { useState, useEffect, useContext } from 'react';
import { Sepolia } from "@thirdweb-dev/chains";
import PriceChartComponent from "../components/PriceDiagram";

const minimiseAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const Home: NextPage = () => {

  const [bundleId, setBundleId] = useState<number>(0);
  const [localTest, setLocalTest] = useState<boolean>(false)
  const [contracts, setContracts] = useState<any>(CONTRACTS);
  const { selectedChain, setSelectedChain } = useContext(ChainContext);
  const chainId = useChainId();
  const walletInstance = useWallet();


  const switchChain = useSwitchChain();
  useEffect(() => {
    if (!walletInstance) return
    if (!localTest && chainId !== Sepolia.chainId) {
      // switchChain(Sepolia.chainId)
      setLocalTest(true)
    }
    else if (localTest && chainId !== 31337) {
      setLocalTest(false)
      // switchChain(31337)
    }

  }, [chainId])

  useEffect(() => {
    if (!walletInstance) return
    if (localTest) {
      setContracts(CONTRACTS)
      setSelectedChain(Chain.Localhost)
      switchChain(31337)
    } else {
      setContracts(SEPOLIA_CONTRACTS)
      setSelectedChain(Chain.Sepolia)
      switchChain(Sepolia.chainId)
    }
  }, [localTest])




  return (
    <main className={styles.main}>
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
        <Prices

          address={contracts['ETFv2'][0].address} />

        <div>
          <ConnectWallet
            theme={'light'}
            // className="nb-input blue"
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
        <Card className="card"
          style={{
            width: "100%",
          }}
        >
          <div>

            <p>Contracts</p>
            <p>ETF Address</p>
            <p>{contracts['ETFv2'][0].address}</p>
          </div>
          <ETFStatsView tokenAddress={contracts['ETFToken'][0].address} address={contracts['ETFv2'][0].address} />
          <PriceValueStats address={contracts['ETFv2'][0].address} />
          {/* <Prices address={contracts['ETFv2'][0].address} /> */}
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
        <br></br>
        <PriceChartComponent></PriceChartComponent>

        <BundleView address={contracts['ETFv2'][0].address} bundleId={bundleId}
          setBundleId={setBundleId}
          tokenToBeWrapped1Address={contracts['FungibleToken'][0].address}
          tokenToBeWrapped2Address={contracts['FungibleToken'][1].address}

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
    </main>
  );
};

export default Home;
