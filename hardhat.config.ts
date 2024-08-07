require('dotenv').config();
import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-solhint";
import '@nomiclabs/hardhat-ethers';
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.9",
    
    settings: {
      optimizer: {
        enabled: true,
        runs: 10,
      },
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
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
    mumbai: {
      url: "https://rpc-mumbai.maticvigil.com",
      chainId: 80001,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY || ''],
    },
    amoy: {
      url: "https://rpc-amoy.polygon.technology/",
      chainId: 80002,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY || ''],
    },
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/RFiBHY2-HWqMY3wHC_lMpOKdJfji5EgY",
      chainId: 11155111,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY || ''],
    },
  },
};

export default config;
