import { ethers } from "hardhat";
import { writeFileSync } from 'fs';
import { BigNumber } from "ethers";

async function main() {
  const accounts = await ethers.getSigners();
  const nativeAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
  const etfTokenPerWrap = BigNumber.from(100).mul(BigNumber.from(10).pow(18));
  const fee = 0;
  const etfTokenContractName = "ETFToken";
  const nativeWrapperContractName = "NativeTokenWrapper";
  const etfContractName = "ETFv2";
  const fungibleTokenName = "FungibleToken";
  const priceAggregatorContractName = "MockAggregator";
  const mockRouterContractName = "MockRouterClient";
  const royaltyBps = 1000;
  const ETFURI = "https://etfx.com";
  const contracts: any = {};
  const DEMO_USER_ADDRESS = "0x2a1F5eB3e84e58e6F1e565306298B9dE1273f203";
  const DEM0_USER_ADDRESS_2 = "0x001385E75cfc5563a925981F8501916D7Efb4344";
  const mockChainSelectorId = 0;
  const amounts = [ethers.utils.parseEther("0.5"), BigNumber.from(10).mul(BigNumber.from(10).pow(18)), BigNumber.from(20).mul(BigNumber.from(10).pow(18))];


  const contractNamesDeployParams: any = [
    [mockRouterContractName],
    [fungibleTokenName, "Chainlink", "LINK"],
    [fungibleTokenName, "Synthetix", "SNX"],
    [nativeWrapperContractName, "Wrapped ETH", "WETH"],
    [priceAggregatorContractName, 196741624297, 8],
    [priceAggregatorContractName, 1345612360, 8],
    [priceAggregatorContractName, 299528477, 8],

    [etfTokenContractName],
    (owner: any, nativeTokenWrapper = contracts[nativeWrapperContractName][0],
      etfTokenContract = contracts[etfTokenContractName][0],
      router = contracts[mockRouterContractName][0],
      tokenAmounts = [
        {
          chainIdSelector: mockChainSelectorId,
          assetContract: nativeAddress,
          amount: amounts[0],
          oracleAddress: contracts[priceAggregatorContractName][0].address,
        },
        {
          chainIdSelector: mockChainSelectorId,
          assetContract: contracts[fungibleTokenName][0].address,
          amount: amounts[1],
          oracleAddress: contracts[priceAggregatorContractName][1].address,
        },
        {
          chainIdSelector: mockChainSelectorId,
          assetContract: contracts[fungibleTokenName][1].address,
          amount: amounts[2],
          oracleAddress: contracts[priceAggregatorContractName][2].address,
        },
      ]
    ) => [etfContractName,
        "ETF-v0.0.1",
        "ETF",
        {
          recipient: owner.address,
          bps: royaltyBps
        },
        nativeTokenWrapper.address,
        etfTokenContract.address,
        etfTokenPerWrap,
        fee,
        tokenAmounts,
        ETFURI,
        mockChainSelectorId,
        router.address
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
      // store the abi of the contract

      console.log(`${contractName} deployed to: ${contracts[contractName]
      [contracts[contractName].length - 1].address}
      `);
    }
  }
  await contracts[etfTokenContractName][0].setOwner(contracts[etfContractName][0].address);

  await accounts[0].sendTransaction({
    to: DEMO_USER_ADDRESS,
    value: ethers.utils.parseEther("10.0"),
  });

  await accounts[0].sendTransaction({
    to: DEM0_USER_ADDRESS_2,
    value: ethers.utils.parseEther("10.0"),
  });

  // mint some fungible tokens to the demo user
  await contracts[fungibleTokenName][0].mint(DEMO_USER_ADDRESS, amounts[1].mul(100));
  await contracts[fungibleTokenName][1].mint(DEMO_USER_ADDRESS, amounts[2].mul(100));
  writeFileSync("CONTRACTS.json", JSON.stringify(contracts, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
