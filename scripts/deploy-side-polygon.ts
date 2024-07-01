import { ethers } from "hardhat";
import { writeFileSync } from 'fs';
import { BigNumber } from "ethers";
import { PayFeesIn } from "../test/etfContract.spec";
// import { preDeployedSNXContractOnMumbai, amountSNX } from "./deploy-sepolia";

const preDeployedSNXContractOnMumbai = "0xdE617C9DaDDF41EbD739cA57eBbA607C11ba902d";
const amountSNX = BigNumber.from(6).mul(BigNumber.from(10).pow(18));

const DEMO_USER_ADDRESS = "0x2a1F5eB3e84e58e6F1e565306298B9dE1273f203";
const DEM0_USER_ADDRESS_2 = "0x001385E75cfc5563a925981F8501916D7Efb4344";

// const primaryETFContractAddress = "0xAdFf5f6C2B221E49b8F31514d295b6658d85d5A5";
const primaryETFContractAddress = "0x2dB25eBf7917F7127f63fFbA388ce8c3504e89f5";


async function main() {
    const accounts = await ethers.getSigners();
    console.log("Deploying side contracts with the account:", accounts[0].address);
    const contracts: any = {};
    const sideChainContractName = "SidechainDeposit";
    const fungibleTokenName = "FungibleToken";
    const WMATIC = "0x9c3c9283d3e44854697cd22d3faa240cfb032889";
    const nativeWrapperAddressMumbai = WMATIC;
    const primaryChainSelectorIdSepolia = BigNumber.from("16015286601757825753");
    // https://amoy.polygonscan.com/
    // const chainIdSelectorIdMumbai = BigNumber.from("12532609583862916517");
    const chainIdAmoy = BigNumber.from("80002");
    const chainIdSelectorAmoy  = BigNumber.from("16281711391670634445");
    const routerAddressAmoy = "0xC22a79eBA640940ABB6dF0f7982cc119578E11De";
    // https://docs.chain.link/resources/link-token-contracts
    const linkAddressAmoy = "0x0Fd9e8d3aF1aaee056EB9e802c3A762a667b1904";

    contracts[fungibleTokenName] = [{
        address: preDeployedSNXContractOnMumbai
    }];

    const contractNamesDeployParams: any = [
        (owner: any, nativeTokenWrapper = nativeWrapperAddressMumbai,
            tokenAmounts = [
                {
                    chainIdSelector: chainIdSelectorAmoy,
                    assetContract: preDeployedSNXContractOnMumbai,
                    amount: amountSNX,
                    oracleAddress: linkAddressAmoy, // not used
                },
            ]
        ) => [sideChainContractName,
                primaryChainSelectorIdSepolia,
                chainIdSelectorAmoy,
                primaryETFContractAddress,
                routerAddressAmoy,
                linkAddressAmoy,
                nativeTokenWrapper,
                tokenAmounts,
            ]
    ]

    for (const deployable of contractNamesDeployParams) {
        if (typeof deployable !== "function") {
            const [contractName, ...args] = deployable;
            const contractFactory = await ethers.getContractFactory(contractName as string);
            contracts[contractName] === undefined ? contracts[contractName] = [await contractFactory.deploy(...args)]
                : contracts[contractName].push(await contractFactory.deploy(...args));
            console.log(`${contractName} deployed to: ${contracts[contractName][
                contracts[contractName].length - 1
            ].address}`);
        }
        else {
            const [contractName, ...args] = deployable(accounts[0]);
            const contractFactory = await ethers.getContractFactory(contractName as string);
            contracts[contractName] === undefined ? contracts[contractName] = [await contractFactory.deploy(...args)]
                : contracts[contractName].push(await contractFactory.deploy(...args));

            console.log(`${contractName} deployed to: ${contracts[contractName]
            [contracts[contractName].length - 1].address}
          `);
        }
    }

    writeFileSync("CONTRACTS-mumbai.json", JSON.stringify(contracts, null, 2));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });