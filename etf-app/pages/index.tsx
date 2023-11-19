import { ConnectWallet, useContract } from "@thirdweb-dev/react";
import styles from '../styles/page.module.css'
import { NextPage } from "next";
import CONTRACTS from '../../CONTRACTS.json'
import TokenView from '../components/TokenView'
import ETFView from '../components/ETFView'
import OpenETFView from "../components/OpenETF";
import CloseETF from "../components/CloseETF";
import { useState } from 'react'
import { InputNumber } from 'antd';
import BundleView from "../components/BundleView";
import MatrixView from "../components/MatrixView";


const minimiseAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const Home: NextPage = () => {

  const [bundleId, setBundleId] = useState<number>(0);

  return (
    <main className={styles.main}>
      <div className={styles.description}>
        <p>
          CAKE PROTOCOL&nbsp;
          <code className={styles.code}>{minimiseAddress(JSON.stringify(CONTRACTS['ETFv2'][0].address))}</code>
        </p>
        <div>
          <ConnectWallet />
        </div>
      </div>
      <div>
        <TokenView className={styles.tokenView} etfAddress={CONTRACTS['ETFv2'][0].address} address={CONTRACTS['FungibleToken'][0].address} />
        <TokenView className={styles.tokenView} etfAddress={CONTRACTS['ETFv2'][0].address} address={CONTRACTS['FungibleToken'][1].address} />
        <TokenView className={styles.tokenView} etfAddress={CONTRACTS['ETFv2'][0].address} address={CONTRACTS['ETFToken'][0].address} />

        <ETFView address={CONTRACTS['ETFv2'][0].address} />

        <MatrixView></MatrixView>


        <div className={styles.center}>
          <OpenETFView
            address={CONTRACTS['ETFv2'][0].address}
            tokenToBeWrapped1Address={CONTRACTS['FungibleToken'][0].address}
            tokenToBeWrapped2Address={CONTRACTS['FungibleToken'][1].address}
          ></OpenETFView>
          <CloseETF address={CONTRACTS['ETFv2'][0].address}></CloseETF>
        </div>
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
        </div>
        <br></br>
        <br></br>

        <BundleView address={CONTRACTS['ETFv2'][0].address} bundleId={bundleId}
          tokenToBeWrapped1Address={CONTRACTS['FungibleToken'][0].address}
          tokenToBeWrapped2Address={CONTRACTS['FungibleToken'][1].address}

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
