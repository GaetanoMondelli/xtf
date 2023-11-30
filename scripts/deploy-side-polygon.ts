import { ethers } from "hardhat";
import { writeFileSync } from 'fs';
import { BigNumber } from "ethers";
// import { preDeployedSNXContractOnMumbai, amountSNX } from "./deploy-sepolia";

const preDeployedSNXContractOnMumbai = "0xdE617C9DaDDF41EbD739cA57eBbA607C11ba902d";
const amountSNX = BigNumber.from(6).mul(BigNumber.from(10).pow(18));

const DEMO_USER_ADDRESS = "0x2a1F5eB3e84e58e6F1e565306298B9dE1273f203";
const DEM0_USER_ADDRESS_2 = "0x001385E75cfc5563a925981F8501916D7Efb4344";

const primaryETFContractAddress = "0xfd454Ea2186E1f355c08ef98b9B66dfDC1ed7f8B";


async function main() {
    const accounts = await ethers.getSigners();
    console.log("Deploying side contracts with the account:", accounts[0].address);
    const contracts: any = {};
    const sideChainContractName = "SidechainDeposit";
    const fungibleTokenName = "FungibleToken";
    const WMATIC = "0x9c3c9283d3e44854697cd22d3faa240cfb032889";
    const nativeWrapperAddressMumbai = WMATIC;
    const primaryChainSelectorIdSepolia = BigNumber.from("16015286601757825753");
    const chainIdSelectorIdMumbai = BigNumber.from("12532609583862916517");
    const routerAddressMumbai = "0x70499c328e1e2a3c41108bd3730f6670a44595d1";
    const linkAddressMumbai = "0x326C977E6efc84E512bB9C30f76E30c160eD06FB";

    contracts[fungibleTokenName] = [{
        address: preDeployedSNXContractOnMumbai
    }];

    const contractNamesDeployParams: any = [
        (owner: any, nativeTokenWrapper = nativeWrapperAddressMumbai,
            tokenAmounts = [
                {
                    chainIdSelector: chainIdSelectorIdMumbai,
                    assetContract: preDeployedSNXContractOnMumbai,
                    amount: amountSNX,
                    oracleAddress: linkAddressMumbai,
                },
            ]
        ) => [sideChainContractName,
                primaryChainSelectorIdSepolia,
                chainIdSelectorIdMumbai,
                primaryETFContractAddress,
                routerAddressMumbai,
                linkAddressMumbai,
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