import { ConnectWallet, useContract } from "@thirdweb-dev/react";
// import styles from "../styles/Home.module.css";
import styles from '../styles/page.module.css'
import Image from "next/image";
import { NextPage } from "next";
import CONTRACTS from '../../CONTRACTS.json'
const FungibleTokenABI = require("../.././artifacts/contracts/TokenWrapped.sol/FungibleToken.json").abi;
import TokenView from '../components/TokenView'
import ETFView from '../components/ETFView'
import OpenETFView from "../components/OpenETF";


const minimiseAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const Home: NextPage = () => {
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
        <TokenView className={styles.tokenView} address={CONTRACTS['ETFToken'][0].address} />

        <ETFView address={CONTRACTS['ETFv2'][0].address} />

        <div className={styles.center}>
          <OpenETFView
            address={CONTRACTS['ETFv2'][0].address}
            tokenToBeWrapped1Address={CONTRACTS['FungibleToken'][0].address}
            tokenToBeWrapped2Address={CONTRACTS['FungibleToken'][1].address}
          ></OpenETFView>
          <span
            className={styles.card}
            rel="noopener noreferrer"
          >
            <h2>
              Close <span>-&gt;</span>
            </h2>
            <p>Find in-depth information about Next.js features and API.</p>
          </span>
        </div>
      </div>


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
