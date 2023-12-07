import { createContext } from "react";
import { Chain, ETFv2ABI, MockAggregatorABI, SIDE_ABI  } from "../components/utils";

export const ChainContext = createContext({
  selectedChain: Chain.Sepolia, // Assuming Chain.Sepolia is a valid value
  setSelectedChain: (chain: Chain) => {},
  etfV2Abi: [],
  mockAggregatorAbi: [],
  // etfContractv2Abi: [],
  sideAbi: [],
  isAbisLoading: true,
});

export default ChainContext;