import { ethers } from "hardhat";
import { writeFileSync } from 'fs';
import { BigNumber } from "ethers";

const DEMO_USER_ADDRESS = "0x2a1F5eB3e84e58e6F1e565306298B9dE1273f203";
const DEM0_USER_ADDRESS_2 = "0x001385E75cfc5563a925981F8501916D7Efb4344";
const G_ADDRESS = "0x3783c988e6436f966B0B19AA948a566d7361bd3d";

async function main() {
    const accounts = await ethers.getSigners();
    console.log("Deploying primer contracts with the account:", accounts[0].address);
    const fungibleTokenName = "FungibleToken";
    const contracts: any = {};

    const amounts = [ethers.utils.parseEther("0.05"), BigNumber.from(15).mul(BigNumber.from(10).pow(18)), BigNumber.from(3).mul(BigNumber.from(10).pow(18)), BigNumber.from(6).mul(BigNumber.from(10).pow(18))];


    const contractNamesDeployParams: any = [
        [fungibleTokenName, "Synthetix", "SNX"],
    ];

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

    await contracts[fungibleTokenName][0].mint(DEMO_USER_ADDRESS, amounts[1].mul(10000));
    await contracts[fungibleTokenName][0].mint(DEM0_USER_ADDRESS_2, amounts[2].mul(10000));
    await contracts[fungibleTokenName][0].mint(G_ADDRESS, amounts[3].mul(10000));
    writeFileSync("primer-sepolia.json", JSON.stringify(contracts, null, 2));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
