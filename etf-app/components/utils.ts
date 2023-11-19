import { BigNumber, ethers } from "ethers";
import CONTRACTS from '../../CONTRACTS.json'
const MockAggregatorABI = require("../.././artifacts/contracts/MockAggregator.sol/MockAggregator.json").abi;
const ETFContractv2ABI = require("../.././artifacts/contracts/ETFContractv2.sol/ETFv2.json").abi;



import { useContract, useContractRead } from "@thirdweb-dev/react";
const addresses = new Map<string, string>();
const nativeAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const amountToWrapToken1 = BigNumber.from(10).mul(BigNumber.from(10).pow(18));
const amountToWrapToken2 = BigNumber.from(20).mul(BigNumber.from(10).pow(18));
const tokenToBeWrapped1Address = CONTRACTS['FungibleToken'][0].address
const tokenToBeWrapped2Address = CONTRACTS['FungibleToken'][1].address
const nativeWrapperAddress = CONTRACTS['NativeTokenWrapper'][0].address

export const ethersToWrap = ethers.utils.parseEther("0.5");

const nativeTokenStruct = {
    assetContract: nativeAddress,
    tokenType: 0,
    tokenId: 0,
    totalAmount: ethersToWrap,
};

const tokenStruct1 = {
    assetContract: tokenToBeWrapped1Address,
    tokenType: 0,
    tokenId: 0,
    totalAmount: amountToWrapToken1,
};

const tokenStruct2 = {
    assetContract: tokenToBeWrapped2Address,
    tokenType: 0,
    tokenId: 0,
    totalAmount: amountToWrapToken2,
};

export const requiredTokenStructs = [nativeTokenStruct, tokenStruct1, tokenStruct2];

export const getRequiredAsset = (address: string) => {
    return requiredTokenStructs.find((asset) => asset.assetContract === address);
}


export const getTotalQuantites = async () => {
    return requiredTokenStructs.map((asset: any) => {
        return BigNumber.from(asset.totalAmount);
    });
}

export const getPriceAggregatorAddress = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);

    let prices = [];

    for (const contractObject of CONTRACTS['MockAggregator']) {
        const { address } = contractObject;
        const contract = new ethers.Contract(address, MockAggregatorABI, provider);
        const price = await contract.latestRoundData();
        prices.push(BigNumber.from(price.answer));
    }

    return prices;
};


export const getValueChartData = async () => {
    let values: any = [];
    const labels: any = [];
    const prices: any[] = await getPriceAggregatorAddress();
    requiredTokenStructs.map((asset: any, index: number) => {
        const value = prices[index]
        values.push(BigNumber.from(value).mul(BigNumber.from(asset.totalAmount).div((BigNumber.from(10).pow(16)))).div(BigNumber.from(10).pow(8)).toNumber() / 100);
        labels.push(asset.assetContract);
    });
    return [labels, values];
}


export const minimiseAddress = (address: string) => {
    if (!address) return '';
    if (address === nativeAddress) return 'ETH';
    return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export const getInvestorAddressesForBundle = async (bundleId: number) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const addressTokensMap = new Map<string, any>();
    const contractObject = CONTRACTS['ETFv2'][0];
    const { address } = contractObject;
    const contract = new ethers.Contract(address, ETFContractv2ABI, provider);
    const investorAddresses = await contract.getAllAddressesForBundleId(bundleId);

    for (const investorAddress of investorAddresses) {
        console.log('add', investorAddress);
        const record = await contract.getAddressQuantityPerBundle(bundleId, investorAddress);
        addressTokensMap.set(investorAddress, record);
    }

    return addressTokensMap;
}

export const getTokensByAddres = async (bundleId: number, address: string) => {
    const values = [];
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const prices: any[] = await getPriceAggregatorAddress();

    const contractObject = CONTRACTS['ETFv2'][0];
    const { address: contractAddress } = contractObject;
    const contract = new ethers.Contract(contractAddress, ETFContractv2ABI, provider);
    const recordArray = await contract.getAddressQuantityPerBundle(bundleId, address);
    for (const record of recordArray) {
        console.log('record22', address, record);

        // values.push(BigNumber.from(value).mul(BigNumber.from(record.amount).div((BigNumber.from(10).pow(16)))).div(BigNumber.from(10).pow(8)).toNumber() / 100);
    }
    // console.log('values', values);
    // return values;
    return recordArray;
}