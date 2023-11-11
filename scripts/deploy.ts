import { ethers } from "hardhat";
import { writeFileSync } from 'fs';

async function main() {
  const accounts = await ethers.getSigners();
  const nativeAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
  const etfTokenPerWrap = 100;
  const fee = 0;
  const etfTokenContractName = "ETFToken";
  const nativeWrapperContractName = "NativeTokenWrapper";
  const etfContractName = "ETFv2";
  const fungibleTokenName = "FungibleToken";
  const priceAggregatorContractName = "MockAggregator";
  const royaltyBps = 1000;
  const ETFURI = "https://etfx.com";
  const contracts: any = {};
  const DEMO_USER_ADDRESS = "0x2a1F5eB3e84e58e6F1e565306298B9dE1273f203";


  const contractNamesDeployParams: any = [
    [fungibleTokenName, "TokenToWrapped1", "TW1"],
    [fungibleTokenName, "TokenToWrapped2", "TW2"],
    [nativeWrapperContractName, "NativeTokenWrapper", "NTW"],
    [priceAggregatorContractName, 0],
    [priceAggregatorContractName, 5],
    [priceAggregatorContractName, 10],
    [etfTokenContractName],
    (owner: any, nativeTokenWrapper = contracts[nativeWrapperContractName][0],
      etfTokenContract = contracts[etfTokenContractName][0],
      tokenAmounts = [
        {
          assetContract: nativeAddress,
          amount: ethers.utils.parseEther("0.5"),
          oracleAddress: contracts[priceAggregatorContractName][0].address,
        },
        {
          assetContract: contracts[fungibleTokenName][0].address,
          amount: 10,
          oracleAddress: contracts[priceAggregatorContractName][1].address,
        },
        {
          assetContract: contracts[fungibleTokenName][1].address,
          amount: 20,
          oracleAddress: contracts[priceAggregatorContractName][2].address,
        },
      ]
    ) => [etfContractName,
        "ETF-v0.0.1",
        "ETF",
        owner.address,
        royaltyBps,
        nativeTokenWrapper.address,
        etfTokenContract.address,
        etfTokenPerWrap,
        fee,
        tokenAmounts,
        ETFURI,
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

  // mint some fungible tokens to the demo user
  const decimals = await contracts[fungibleTokenName][0].decimals();
  await contracts[fungibleTokenName][0].mint(DEMO_USER_ADDRESS, BigInt(100*10**decimals));
  await contracts[fungibleTokenName][1].mint(DEMO_USER_ADDRESS, BigInt(100*10**decimals));

  writeFileSync("CONTRACTS.json", JSON.stringify(contracts, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
