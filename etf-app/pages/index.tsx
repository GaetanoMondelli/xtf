import { ConnectWallet, useChainId, useConnect, useContract, useSwitchChain, useWallet } from "@thirdweb-dev/react";
import styles from '../styles/page.module.css'
import { NextPage } from "next";
import CONTRACTS from '../../CONTRACTS.json'
import SEPOLIA_CONTRACTS from '../../CONTRACTS-sepolia.json'
import TokenView from '../components/TokenView'
import ETFView from '../components/ETFView'
import OpenETFView from "../components/OpenETF";
import CloseETF from "../components/CloseETF";
import { Card, InputNumber, Switch } from 'antd';
import BundleView from "../components/BundleView";
import ETFStatsView from "../components/ETFStatsView";
import { useState, useEffect } from 'react';
import { Sepolia } from "@thirdweb-dev/chains";

const minimiseAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const Home: NextPage = () => {

  const [bundleId, setBundleId] = useState<number>(0);
  const [localTest, setLocalTest] = useState<boolean>(false)
  const [contracts, setContracts] = useState<any>(CONTRACTS);

  const chainId = useChainId();
  const walletInstance = useWallet();


  const switchChain = useSwitchChain();
  useEffect(() => {
    if (!walletInstance) return
    if (!localTest && chainId !== Sepolia.chainId) {
      switchChain(Sepolia.chainId)
    }
    else if (localTest && chainId !== 31337) {
      switchChain(31337)
    }

  }, [chainId, localTest])

  useEffect(() => {
    if (localTest) {
      setContracts(CONTRACTS)
    } else {
      setContracts(SEPOLIA_CONTRACTS)
    }
  }, [localTest])




  return (
    <main className={styles.main}>
      <div className={styles.description}>
        <p>
          CAKE PROTOCOL&nbsp; {chainId}
          <code className={styles.code}>{minimiseAddress(JSON.stringify(contracts['ETFv2'][0].address))}</code>
        </p>
        <div>
          <ConnectWallet />
        </div>
      </div>
      <div>
        <br></br>
        <br></br>
        <Card>

          <ETFStatsView tokenAddress={SEPOLIA_CONTRACTS['ETFToken'][0].address} address={contracts['ETFv2'][0].address} />
          <br></br>
          <div className={styles.description}>
 

            <span>Bundle Viewer {bundleId}</span>
            <InputNumber
              style={{
                marginLeft: 20
              }}
              defaultValue={0}
              min={0}
              onChange={(value) => setBundleId(Number(value))}
            />
            &nbsp;&nbsp;&nbsp;<span>Hardhat local test</span> &nbsp;&nbsp;
            <Switch checked={localTest} onChange={(checked) => setLocalTest(checked)} />

          </div>
        </Card>
        <br></br>

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
