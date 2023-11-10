import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-solhint";
import '@nomiclabs/hardhat-ethers';
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.9",
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337.,
      initialBaseFeePerGas: 0,
    },
    goerli: {
      url: "https://wider-cosmological-pallet.ethereum-goerli.quiknode.pro/a3f8acdd1dc7bf72e2e53782fa654a673593118d/",
      accounts: ['0x1294695293f333466d699cca83fce35cf2c3dd960fd35a93d44ae548835c9b32']
    },
    matic: {
      url: "https://rpc-mumbai.maticvigil.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  },
};

export default config;

