import { ethers } from "hardhat";
import { writeFileSync } from 'fs';
import { BigNumber } from "ethers";

const DEMO_USER_ADDRESS = "0x2a1F5eB3e84e58e6F1e565306298B9dE1273f203";
const DEM0_USER_ADDRESS_2 = "0x001385E75cfc5563a925981F8501916D7Efb4344";

async function main() {
    const accounts = await ethers.getSigners();
    console.log("Deploying contracts with the account:", accounts[0].address);
    const etfContractName = "ETFv2";
    const fungibleTokenName = "FungibleToken";
    const etfTokenContractName = "ETFToken";
    const ETFURI = "https://etfx.com";
    const contracts: any = {};
    const nativeAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
    const fee = 0;
    const royaltyBps = 1000;
    const etfTokenPerWrap = BigNumber.from(100).mul(BigNumber.from(10).pow(18));

    // Sepolia data feed addresses
    const sepDAIUSDDataFeedAddress = "0x14866185B1962B63C3Ea9E03Bc1da838bab34C19";
    const sepETHUSDDataFeedAddress = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
    const sepLINKUSDDataFeedAddress = "0xc59E3633BAAC79493d908e63626716e204A45EdF";
    const sepSNXUSDDataFeedAddress = "0xc0F82A46033b8BdBA4Bb0B0e28Bc2006F64355bC";

    //   Sepolia router address
    const sepRouterAddress = "0xd0daae2231e9cb96b94c8512223533293c3693bf";
    // const maticRouterAddress = "0x70499c328e1e2a3c41108bd3730f6670a44595d1";


    // const Sepolia native token wrapper address
    const sepNativeTokenWrapperAddress = "0x7b79995e5f793a07bc00c21412e50ecae098e7f9";

    // Sepolia selector id
    const sepSelectorId = BigNumber.from("16015286601757825753");
    // const mumbaiSelectorId = 12532609583862916517;


    const amounts = [ethers.utils.parseEther("0.05"), BigNumber.from(15).mul(BigNumber.from(10).pow(18)), BigNumber.from(3).mul(BigNumber.from(10).pow(18)), BigNumber.from(6).mul(BigNumber.from(10).pow(18))];


    const contractNamesDeployParams: any = [
        [fungibleTokenName, "Dai Stablecoin", "DAI"],
        [fungibleTokenName, "Chainlink", "LINK"],
        [fungibleTokenName, "Synthetix", "SNX"],
        [etfTokenContractName],
        (owner: any, nativeTokenWrapper = sepNativeTokenWrapperAddress,
            etfTokenContract = contracts[etfTokenContractName][0],
            router = sepRouterAddress,
            tokenAmounts = [
                {
                    chainIdSelector: sepSelectorId,
                    assetContract: nativeAddress,
                    amount: amounts[0],
                    oracleAddress: sepETHUSDDataFeedAddress,
                },
                {
                    chainIdSelector: sepSelectorId,
                    assetContract: contracts[fungibleTokenName][0].address,
                    amount: amounts[1],
                    oracleAddress: sepDAIUSDDataFeedAddress,
                },
                {
                    chainIdSelector: sepSelectorId,
                    assetContract: contracts[fungibleTokenName][1].address,
                    amount: amounts[2],
                    oracleAddress: sepLINKUSDDataFeedAddress,
                },
                {
                    chainIdSelector: sepSelectorId,
                    assetContract: contracts[fungibleTokenName][2].address,
                    amount: amounts[3],
                    oracleAddress: sepSNXUSDDataFeedAddress,
                },
            ]
        ) => [etfContractName,
                "ETF-v0.0.1",
                "ETF",
                {
                    recipient: owner.address,
                    bps: royaltyBps
                },
                sepNativeTokenWrapperAddress,
                etfTokenContract.address,
                etfTokenPerWrap,
                fee,
                tokenAmounts,
                ETFURI,
                sepSelectorId,
                sepRouterAddress
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

    await contracts[etfTokenContractName][0].mint(DEMO_USER_ADDRESS, amounts[1].mul(10));
    await contracts[etfTokenContractName][0].setOwner(contracts[etfContractName][0].address);


    await contracts[fungibleTokenName][0].mint(DEMO_USER_ADDRESS, amounts[1].mul(1000));
    await contracts[fungibleTokenName][1].mint(DEMO_USER_ADDRESS, amounts[2].mul(1000));
    await contracts[fungibleTokenName][2].mint(DEMO_USER_ADDRESS, amounts[2].mul(1000));
    writeFileSync("CONTRACTS-sepolia.json", JSON.stringify(contracts, null, 2));

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });