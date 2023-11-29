import type { AppProps } from "next/app";
import { ThirdwebProvider, useSwitchChain } from "@thirdweb-dev/react";
import { ConfigProvider, Typography } from "antd";
import ChainContext from "../context/chain";
import "../node_modules/neobrutalismcss/dist/index.css";
import { useEffect, useState } from "react";
import { Chain } from "../components/utils";
import { Sepolia } from "@thirdweb-dev/chains";
const activeChain = "localhost";
const sepoliaEndpoint = "https://orbital-capable-season.ethereum-sepolia.quiknode.pro/8a961b76e01b85d94eb0568af4d471c8f46ea07c";


const SepoliaChain = {
  // === Required information for connecting to the network === \\
  chainId: 11155111, // Chain ID of the Sepolia network
  // Array of RPC URLs to use
  rpc: [sepoliaEndpoint], // Replace with actual Sepolia RPC URL

  nativeCurrency: {
    decimals: 18,
    name: "Sepolia ETH",
    symbol: "sepETH",
  },
  shortName: "sepolia", // Display value shown in the wallet UI
  slug: "sepolia", // Display value shown in the wallet UI
  testnet: true, // Boolean indicating whether the chain is a testnet or mainnet
  chain: "Sepolia", // Name of the network
  name: "Sepolia Testnet", // Name of the network
};


const localhostChain = {
  // === Required information for connecting to the network === \\
  chainId: 31337, // Chain ID of the network
  // Array of RPC URLs to use
  rpc: ["http://127.0.0.1:8545"],

  // === Information for adding the network to your wallet (how it will appear for first time users) === \\
  // Information about the chain's native currency (i.e. the currency that is used to pay for gas)
  nativeCurrency: {
    decimals: 18,
    name: "Hardhat ETH",
    symbol: "ETH",
  },
  shortName: "ethereum", // Display value shown in the wallet UI
  slug: "hardhat", // Display value shown in the wallet UI
  testnet: true, // Boolean indicating whether the chain is a testnet or mainnet
  chain: "Hardhat", // Name of the network
  name: "Hardhat Testnet", // Name of the network
};


function MyApp({ Component, pageProps }: AppProps) {
  const [selectedChain, setSelectedChain] = useState(Chain.Sepolia);

  return (
    <ChainContext.Provider value={{ selectedChain, setSelectedChain }}>
      <ThirdwebProvider
        clientId={process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID}
        activeChain={
          selectedChain === Chain.Localhost ? localhostChain : SepoliaChain
        }
      >
        <ConfigProvider
          theme={{
            token: {
              fontFamily: "Stint Ultra Expanded",
            }
          }}
        >
          <Component {...pageProps} />
        </ConfigProvider>
      </ ThirdwebProvider>
    </ChainContext.Provider>
  );
}

export default MyApp;

