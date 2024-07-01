import { createContext } from "react";
import { Chain  } from "../components/utils";

export const ChainContext = createContext({
  selectedChain: Chain.Sepolia, // Assuming Chain.Sepolia is a valid value
  setSelectedChain: (chain: Chain) => {},
  etfV2Abi: [],
  mockAggregatorAbi: [],
  sideAbi: [],
  fungibleTokenAbi: [],
  isAbisLoading: true,
});

export default ChainContext;