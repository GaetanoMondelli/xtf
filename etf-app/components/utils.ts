import { BigNumber, ethers } from "ethers";
import CONTRACTS from '../../CONTRACTS.json'
import SEPOLIA_CONTRACTS from '../../Sepolia-Index1.json'
import SEPOLIA_MUMBAI_CONTRACTS from '../../Sepolia-index2.json'
import SEPOLIA_MUMBAI_SIDECHAIN_CONTRACTS from '../../Mumbai-Side-index2.json';

import PRIMARY_SEPOLIA from '../../CONTRACTS-sepolia.json'
import SECONDARY_MUMBAI from '../../CONTRACTS-mumbai.json'

const MockAggregatorABI = require("../.././artifacts/contracts/MockAggregator.sol/MockAggregator.json").abi;
const ETFContractv2ABI = require("../.././artifacts/contracts/ETFContractv2.sol/ETFv2.json").abi;
export const nativeAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const amountToWrapToken1 = BigNumber.from(10).mul(BigNumber.from(10).pow(18));
const amountToWrapToken2 = BigNumber.from(20).mul(BigNumber.from(10).pow(18));
const tokenToBeWrapped1Address = CONTRACTS['FungibleToken'][0].address
const tokenToBeWrapped2Address = CONTRACTS['FungibleToken'][1].address
const nativeWrapperAddress = CONTRACTS['NativeTokenWrapper'][0].address
const SepoliaChainId = 11155111;
const HardhatChainId = 31337;
const MumbaiChainId = 80001;


export const chainSelectorIdToExplorerAddress: any = {
    "16015286601757825753": "https://sepolia.etherscan.io/address",
    "12532609583862916517": "https://mumbai.polygonscan.com/token",
}

const ETFConfigurationIndex0 = {
    name: "ETF-hardhat-index0",
    chainId: HardhatChainId,
    nativeAddress: nativeAddress,
    nativeWrapperAddress: nativeWrapperAddress,
    nativeWrapper: "0x7b79995e5f793a07bc00c21412e50ecae098e7f9",
    selectorId: BigNumber.from("16015286601757825753"),
    routerAddress: "0xd0daae2231e9cb96b94c8512223533293c3693bf",
    contracts: CONTRACTS,
}


// const ETFConfigurationIndex1 = {
//     name: "ETF-sepolia-idx1",
//     chainId: SepoliaChainId,
//     nativeAddress: nativeAddress,
//     nativeWrapper: "0x7b79995e5f793a07bc00c21412e50ecae098e7f9",
//     selectorId: BigNumber.from("16015286601757825753"),
//     routerAddress: "0xd0daae2231e9cb96b94c8512223533293c3693bf",
//     contracts: SEPOLIA_CONTRACTS,
// }

const ETFConfigurationIndex2 = {
    name: "ETF-sepolia-mumbai-idx2",
    chainId: SepoliaChainId,
    // nativeAddress: nativeAddress,
    // nativeWrapper: "0x7b79995e5f793a07bc00c21412e50ecae098e7f9",
    // selectorId: BigNumber.from("16015286601757825753"),
    // routerAddress: "0xd0daae2231e9cb96b94c8512223533293c3693bf",
    contracts: PRIMARY_SEPOLIA,
    sideChainContracts: {
        "12532609583862916517": SECONDARY_MUMBAI,
    }
}

export const SelectorIdToChainId: any = {
    "16015286601757825753": SepoliaChainId,
    "12532609583862916517": MumbaiChainId,
    "1": HardhatChainId,
    "0": HardhatChainId,
}

export const ChainIdToSelectorId: any = {
    [SepoliaChainId]: "16015286601757825753",
    [MumbaiChainId]: "12532609583862916517",
    [HardhatChainId]: "1",
}


export const configs: Array<any> = [ETFConfigurationIndex0, ETFConfigurationIndex2];

const DAIAddresses = [SEPOLIA_CONTRACTS['FungibleToken'][0].address, CONTRACTS['FungibleToken'][0].address, SEPOLIA_MUMBAI_CONTRACTS['FungibleToken'][0].address];
const LINKAddresses = [SEPOLIA_CONTRACTS['FungibleToken'][1].address, CONTRACTS['FungibleToken'][1].address, SEPOLIA_MUMBAI_CONTRACTS['FungibleToken'][1].address];
const SNXAddresses = [SEPOLIA_CONTRACTS['FungibleToken'][2].address, "0xdE617C9DaDDF41EbD739cA57eBbA607C11ba902d"];
const sepoliaPriceDataFeed = ["0x694AA1769357215DE4FAC081bf1f309aDC325306",
    "0x14866185B1962B63C3Ea9E03Bc1da838bab34C19",
    "0xc59E3633BAAC79493d908e63626716e204A45EdF",
    "0xc0F82A46033b8BdBA4Bb0B0e28Bc2006F64355bC"]

    export enum Chain {
    Sepolia = 11155111,
    Localhost = 31337,
    Mumbai = 80001
}

export const networkToSelectorId: any = {
    [Chain.Sepolia]: "16015286601757825753",
    [Chain.Localhost]: "1",
    [Chain.Mumbai]: "12532609583862916517",
}



export enum PayFeesIn {
    Native = 0,
    LINK = 1,
}


export enum ETFState {
    LOADING,
    OPEN,
    MINTED,
    BURNED
}

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

const getContracts = (chainId: any) => {
    let chainContracts: any = CONTRACTS;
    if (chainId == SepoliaChainId) {
        chainContracts = SEPOLIA_CONTRACTS;
    }
    return chainContracts;
}


// export const getRequiredAsset = (address: string) => {
//     return requiredTokenStructs.find((asset) => asset.assetContract === address);
// }


export const getAssetIcon = (address: string) => {

    if (address === nativeAddress) {
        return 'https://assets.coingecko.com/coins/images/279/small/ethereum.png?1595348880'
    }
    if (DAIAddresses.includes(address)) {
        return 'https://assets.coingecko.com/coins/images/9956/standard/Badge_Dai.png?1696509996'
    }
    if (LINKAddresses.includes(address)) {
        return 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png?1547034700'
    }
    if (SNXAddresses.includes(address)) {
        return 'https://assets.coingecko.com/coins/images/3406/small/SNX.png?1598631139'
    }
    return undefined;
}

export const getAssetName = (address: string) => {
    if (address === nativeAddress) {
        return 'ETH'
    }
    if (DAIAddresses.includes(address)) {
        return 'DAI'
    }
    if (LINKAddresses.includes(address)) {
        return 'LINK'
    }
    if (SNXAddresses.includes(address)) {
        return 'SNX'
    }
    return undefined;
}


export const getTotalQuantites = async () => {
    return requiredTokenStructs.map((asset: any) => {
        return BigNumber.from(asset.totalAmount);
    });
}

export const getPriceAggregatorAddress = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    // get chainId
    const network = await provider.getNetwork();
    const chainId = network.chainId;

    let prices = [];

    if (chainId == SepoliaChainId) {
        for (let address of sepoliaPriceDataFeed) {
            const contract = new ethers.Contract(address, MockAggregatorABI, provider);
            try {
                const price = await contract.latestRoundData();
                prices.push(BigNumber.from(price.answer));
            }
            catch (err) {
                console.log('err data feed', err);
                prices.push(BigNumber.from(0));
            }
        }
    } else {

        for (const contractObject of CONTRACTS['MockAggregator']) {
            const { address } = contractObject;
            const contract = new ethers.Contract(address, MockAggregatorABI, provider);
            try {
                const price = await contract.latestRoundData();
                prices.push(BigNumber.from(price.answer));
            }
            catch (err) {
                console.log('err', err);
                prices.push(BigNumber.from(0));
            }
        }
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

export const showOnlyTwoDecimals = (value: string) => {
    return Number(value).toFixed(2).toString();
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


export const getTokensByAddress = async (bundleId: number, address: string) => {
    const values = [];
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    // get chainId
    const network = await provider.getNetwork();
    const chainId = network.chainId;
    let chainContracts = getContracts(chainId);

    const contractObject = chainContracts['ETFv2'][0];
    const { address: contractAddress } = contractObject;
    const contract = new ethers.Contract(contractAddress, ETFContractv2ABI, provider);
    const recordArray = await contract.getAddressQuantityPerBundle(bundleId, address);
    return recordArray;
}

export const calculateTLV = async (bundleIdQuantities: any) => {
    const prices = await getPriceAggregatorAddress();
    let total = BigNumber.from(0);
    if (!bundleIdQuantities) return 0;
    const quantities = bundleIdQuantities[2]
    const areBurned = bundleIdQuantities[4]

    for (let i = 0; i < quantities.length; i++) {
        for (let j = 0; j < quantities[i].length; j++) {
            if (!areBurned[i]) {
                try {
                    total = total.add(BigNumber.from(quantities[i][j]).mul(prices[j]));
                }
                catch (err) {
                    console.log('err', err);
                }
            }
        }
    }
    // div((BigNumber.from(10).pow(16)))).div(BigNumber.from(10).pow(8)).toNumber() / 100
    return total.div(BigNumber.from(10).pow(16)).div(BigNumber.from(10).pow(8)).toNumber() / 100;
}


export const getSepoliaDataFeedAddress = () => {
    return sepoliaPriceDataFeed;
}


export const getETFStatus = (etfIdLoading: any, etfId: any, isETFBurnedLoading: any, isETFBurned: any) => {
    if (etfIdLoading || isETFBurnedLoading) {
        return ETFState.LOADING;
    } else if (etfId == 0 && !isETFBurned) {
        return ETFState.OPEN;
    }
    else if (isETFBurned) {
        return ETFState.BURNED;
    } else {
        return ETFState.MINTED;
    }
}


interface Token {
    assetContract: string; // Ethereum address
    tokenType: number;
    tokenId: BigNumber;
    totalAmount: BigNumber;
}

interface DepositFundMessage {
    bundleId: BigNumber;
    tokensToWrap: Token[];
}

interface MessageDeposit {
    depositFundMessage: any; // Assuming this is a hex string
    sender: string; // Ethereum address
    sourceChainSelector: BigNumber;
}


export function matchDepositFundMessage(messageDeposit: MessageDeposit[], bundleId: BigNumber, assetAddress: string): any {

    const decodedArray = decodeMessageDepositArray(messageDeposit);
    const matchedMessageDeposit = decodedArray.filter((messageDeposit: any) => {
        return messageDeposit.depositFundMessage.bundleId.eq(bundleId) && messageDeposit.depositFundMessage.tokensToWrap.find((token: any) => token.assetContract === assetAddress)
    });
    // sum all big numbers
    const sumMatchedMessageDeposit =
        matchedMessageDeposit.reduce((accumulator: BigNumber, currentValue: any) => {
            return accumulator.add(currentValue.depositFundMessage.tokensToWrap.find((token: any) => token.assetContract === assetAddress).totalAmount || BigNumber.from(0));
        }, BigNumber.from(0));


    return { messages: matchedMessageDeposit, sum: sumMatchedMessageDeposit };
}



export function decodeMessageDepositArray(messageDeposits: any[]): any[] | any[] {
    return messageDeposits.map((messageDeposit) => {
        const depositFundMessageEncoded = messageDeposit[0];
        const sender = messageDeposit[1];
        const sourceChainSelector = BigNumber.from(messageDeposit[2]);

        // Decoding depositFundMessage
        // This assumes depositFundMessage is ABI-encoded and follows a specific format
        // The specific decoding logic will depend on how depositFundMessage is structured
        const depositFundMessageDecoded = ethers.utils.defaultAbiCoder.decode(
            // Provide the expected types of DepositFundMessage here
            ["tuple(uint256,tuple(address,uint256,uint256,uint256)[])"], // Example types, adjust according to actual structure
            depositFundMessageEncoded
        );

        // Constructing the DepositFundMessage object
        const depositFundMessage: DepositFundMessage = {
            // Populate based on the decoded data
            bundleId: depositFundMessageDecoded[0][0],
            tokensToWrap: depositFundMessageDecoded[0][1].map((asset: string) => ({
                // Assuming each token is just an address, adjust as necessary
                assetContract: asset[0],
                tokenType: asset[1],
                tokenId: asset[2],
                totalAmount: asset[3]
                // Add other properties of the Token struct here
            })),
        };

        return {
            depositFundMessage, // Updated type from string to DepositFundMessage
            sender,
            sourceChainSelector,
        };
    });
}