import { ethers } from "hardhat";
import { writeFileSync } from 'fs';
import { BigNumber } from "ethers";


export const preDeployedSNXContractOnMumbai = "0xdE617C9DaDDF41EbD739cA57eBbA607C11ba902d";
export const amountSNX = BigNumber.from(6).mul(BigNumber.from(10).pow(18));

const DEMO_USER_ADDRESS = "0x2a1F5eB3e84e58e6F1e565306298B9dE1273f203";
const DEM0_USER_ADDRESS_2 = "0x001385E75cfc5563a925981F8501916D7Efb4344";

async function main() {
    const accounts = await ethers.getSigners();
    console.log("Deploying side contracts with the account:", accounts[0].address);
    const etfContractName = "ETFv2";
    const fungibleTokenName = "FungibleToken";
    const etfTokenContractName = "ETFToken";
    const ETFURI = "https://cryptotrade.fund";
    const contracts: any = {};
    const nativeAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
    const fee = 0;
    // 0x326c977e6efc84e512bb9c30f76e30c160ed06fb
    const sepLinkToken = "0x779877A7B0D9E8603169DdbD7836e478b4624789"
    const etfTokenPerWrap = BigNumber.from(100).mul(BigNumber.from(10).pow(18));

    // Sepolia data feed addresses
    const sepETHUSDDataFeedAddress = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
    const sepDAIUSDDataFeedAddress = "0x14866185B1962B63C3Ea9E03Bc1da838bab34C19";
    const sepLINKUSDDataFeedAddress = "0xc59E3633BAAC79493d908e63626716e204A45EdF";
    const sepSNXUSDDataFeedAddress = "0xc0F82A46033b8BdBA4Bb0B0e28Bc2006F64355bC";

    //   Sepolia router address
    const sepRouterAddress = "0xd0daae2231e9cb96b94c8512223533293c3693bf";

    // const maticRouterAddress = "0x70499c328e1e2a3c41108bd3730f6670a44595d1";
    const vrfCoordinatorAddress = "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625"
    const subID = 7338; //https://vrf.chain.link/sepolia/7338   
    const keyHash150gwei = "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c"
    // const Sepolia native token wrapper address
    const sepNativeTokenWrapperAddress = "0x7b79995e5f793a07bc00c21412e50ecae098e7f9";

    // Sepolia selector id
    const sepSelectorId = BigNumber.from("16015286601757825753");
    const mumbaiSelectorId = BigNumber.from("12532609583862916517");

    // https://vrf.chain.link/ https://sepolia.etherscan.io/tx/0xf109812aa8c18c01256e2dfe6eaa4012cc04a9000b928dbf4601481a35888177
    const amounts = [ethers.utils.parseEther("0.05"), BigNumber.from(15).mul(BigNumber.from(10).pow(18)), BigNumber.from(3).mul(BigNumber.from(10).pow(18))];


    const contractNamesDeployParams: any = [
        [fungibleTokenName, "Dai Stablecoin", "DAI"],
        [fungibleTokenName, "Chainlink", "LINK"],
        // [fungibleTokenName, "Synthetix", "SNX"],
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
                    chainIdSelector: mumbaiSelectorId,
                    assetContract: preDeployedSNXContractOnMumbai,
                    amount: amountSNX,
                    oracleAddress: sepSNXUSDDataFeedAddress,
                },
            ]
        ) => [etfContractName,
                "ETF-v0.0.3",
                "ETF",
                tokenAmounts,
                {
                    nativeTokenWrapper: nativeTokenWrapper,
                    uriETFToken: ETFURI,
                    etfTokenAddress: etfTokenContract.address,
                    etfTokenPerWrap: etfTokenPerWrap,
                    percentageFee: fee,
                },
                {
                    router: sepRouterAddress,
                    link: sepLinkToken,
                    currentChainSelectorId: sepSelectorId,
                    subscriptionId: subID,
                    vrfCoordinator: vrfCoordinatorAddress,
                    keyHash: keyHash150gwei,
                },
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

    await contracts[etfTokenContractName][0].mint(DEM0_USER_ADDRESS_2, amounts[1].mul(10));
    await contracts[etfTokenContractName][0].setOwner(contracts[etfContractName][0].address);


    await contracts[fungibleTokenName][0].mint(DEMO_USER_ADDRESS, amounts[1].mul(1000));
    await contracts[fungibleTokenName][1].mint(DEMO_USER_ADDRESS, amounts[2].mul(1000));
    const linkContract = await ethers.getContractAt("FungibleToken", sepLinkToken);
    const linkAmount = BigNumber.from(5).mul(BigNumber.from(10).pow(17));
    const linkTransfer = await linkContract.transfer(contracts[etfContractName][0].address, linkAmount);

    writeFileSync("CONTRACTS-sepolia.json", JSON.stringify(contracts, null, 2));
    // write the args file for verification
    writeFileSync("ARGS-sepolia.json", JSON.stringify(["ETF-v0.0.3",
        "ETF",
        [
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
                chainIdSelector: mumbaiSelectorId,
                assetContract: preDeployedSNXContractOnMumbai,
                amount: amountSNX,
                oracleAddress: sepSNXUSDDataFeedAddress,
            },
        ],
        {
            nativeTokenWrapper: sepNativeTokenWrapperAddress,
            uriETFToken: ETFURI,
            etfTokenAddress: contracts[etfTokenContractName][0].address,
            etfTokenPerWrap: etfTokenPerWrap,
            percentageFee: fee,
        },
        {
            router: sepRouterAddress,
            link: sepLinkToken,
            currentChainSelectorId: sepSelectorId,
            subscriptionId: subID,
            vrfCoordinator: vrfCoordinatorAddress,
            keyHash: keyHash150gwei,
        },
    ], null, 2));

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });


