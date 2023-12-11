import type { AppProps } from "next/app";
import { ThirdwebProvider } from "@thirdweb-dev/react";
import { ConfigProvider } from "antd";
import ChainContext from "../context/chain";
import "../node_modules/neobrutalismcss/dist/index.css";
import "../styles/custom.css";
import { useEffect, useState } from "react";
import { Chain, ETFv2ABI, MockAggregatorABI, SIDE_ABI, FungibleTokenABI } from "../components/utils";
const sepoliaEndpoint = "https://orbital-capable-season.ethereum-sepolia.quiknode.pro/8a961b76e01b85d94eb0568af4d471c8f46ea07c";
const mumabiEndpoint = "https://rpc-mumbai.maticvigil.com";

export const SepoliaChain = {
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

export const MumbaiChain = {
  // === Required information for connecting to the network === \\
  chainId: 80001, // Chain ID of the Sepolia network
  // Array of RPC URLs to use
  rpc: [mumabiEndpoint], // Replace with actual Sepolia RPC URL

  nativeCurrency: {
    decimals: 18,
    name: "Polygon MATIC",
    symbol: "MATIC",
  },
  shortName: "mumbai", // Display value shown in the wallet UI
  slug: "mumbai", // Display value shown in the wallet UI
  testnet: true, // Boolean indicating whether the chain is a testnet or mainnet
  chain: "Mumbai", // Name of the network
  name: "Mumbai Testnet", // Name of the network
};


export const localhostChain = {
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
  const [etfV2Abi, setEtfV2Abi] = useState<any>();
  const [mockAggregatorAbi, setMockAggregatorAbi] = useState<any>();
  const [fungibleTokenAbi, setFungibleTokenAbi] = useState<any>();
  const [sideAbi, setSideAbi] = useState<any>();
  const [isAbisLoading, setIsAbisLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      ETFv2ABI,
      MockAggregatorABI,
      SIDE_ABI,
      FungibleTokenABI
    ]).then(([fetchedEtfV2Abi, fetchedMockAggregatorAbi, fetchedSideAbi, fetchFungibleTokenAbi]) => {
      console.log("Resolved ABIs", fetchedSideAbi);
      setEtfV2Abi(fetchedEtfV2Abi);
      setMockAggregatorAbi(fetchedMockAggregatorAbi);
      setSideAbi(fetchedSideAbi);
      setFungibleTokenAbi(fetchFungibleTokenAbi);
      setIsAbisLoading(false);
    }).catch(error => {
      console.error("Error loading ABIs:", error);
    });;
  }, []);



  if (isAbisLoading) {
    return <div>Loading ABIs...</div>;
  }

  return (
    <ChainContext.Provider value={{
      selectedChain, setSelectedChain,
      etfV2Abi,
      mockAggregatorAbi,
      // etfContractv2Abi,
      fungibleTokenAbi,
      sideAbi,
      isAbisLoading
    }}>
      <ThirdwebProvider
        clientId={process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID}
        activeChain={
          selectedChain === Chain.Localhost ? localhostChain : selectedChain === Chain.Sepolia ? SepoliaChain : MumbaiChain
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

