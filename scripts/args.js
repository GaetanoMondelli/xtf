const BigNumber = require('ethers').BigNumber;
const CONTRACTS = require('../CONTRACTS-sepolia.json');
const nativeAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const fungibleTokenName = "FungibleToken";
const etfTokenContractName = "ETFToken";
const fee = 0;
const etfTokenPerWrap = BigNumber.from(100).mul(BigNumber.from(10).pow(18));
const amounts = [ethers.utils.parseEther("0.05"), BigNumber.from(15).mul(BigNumber.from(10).pow(18)), BigNumber.from(3).mul(BigNumber.from(10).pow(18)), BigNumber.from(6).mul(BigNumber.from(10).pow(18))];
const sepNativeTokenWrapperAddress = "0x7b79995e5f793a07bc00c21412e50ecae098e7f9";
const sepSelectorId = BigNumber.from("16015286601757825753");

// Sepolia data feed addresses
const sepDAIUSDDataFeedAddress = "0x14866185B1962B63C3Ea9E03Bc1da838bab34C19";
const sepETHUSDDataFeedAddress = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
const sepLINKUSDDataFeedAddress = "0xc59E3633BAAC79493d908e63626716e204A45EdF";
const sepSNXUSDDataFeedAddress = "0xc0F82A46033b8BdBA4Bb0B0e28Bc2006F64355bC";
const sepRouterAddress = "0xd0daae2231e9cb96b94c8512223533293c3693bf";

tokenAmounts = [
    {
        chainIdSelector: sepSelectorId,
        assetContract: nativeAddress,
        amount: amounts[0],
        oracleAddress: sepETHUSDDataFeedAddress,
    },
    {
        chainIdSelector: sepSelectorId,
        assetContract: CONTRACTS[fungibleTokenName][0].address,
        amount: amounts[1],
        oracleAddress: sepDAIUSDDataFeedAddress,
    },
    {
        chainIdSelector: sepSelectorId,
        assetContract: CONTRACTS[fungibleTokenName][1].address,
        amount: amounts[2],
        oracleAddress: sepLINKUSDDataFeedAddress,
    },
    {
        chainIdSelector: sepSelectorId,
        assetContract: CONTRACTS[fungibleTokenName][2].address,
        amount: amounts[3],
        oracleAddress: sepSNXUSDDataFeedAddress,
    },
]

module.exports = [
    "ETF-v0.0.1",
    "ETF",
    sepNativeTokenWrapperAddress,
    CONTRACTS[etfTokenContractName][0].address,
    etfTokenPerWrap,
    fee,
    tokenAmounts,
    "https://cryptotrade.fund",
    sepSelectorId,
    sepRouterAddress,
    // CONTRACTS[fungibleTokenName][0].address
]