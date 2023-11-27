import { createContext } from "react";
import { Chain } from "../components/utils";

const ChainContext = createContext({
  selectedChain: Chain.Sepolia,
  setSelectedChain: (chain: Chain) => {}  ,
});

export default ChainContext;