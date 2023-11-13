import { ethers } from "ethers";
import CONTRACTS from '../../CONTRACTS.json'
const addresses = new Map<string, string>();
const nativeAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const amountToWrapToken1 = 10;
const amountToWrapToken2 = 20;
const tokenToBeWrapped1Address = CONTRACTS['FungibleToken'][0].address
const tokenToBeWrapped2Address = CONTRACTS['FungibleToken'][1].address
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

export const minimiseAddress = (address: string) => {
    if (!address) return '';
    if (address === nativeAddress) return 'ETH';
    return `${address.slice(0, 6)}...${address.slice(-4)}`
}
