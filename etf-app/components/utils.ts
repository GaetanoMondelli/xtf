import { BigNumber, ethers } from "ethers";
import CONTRACTS from '../../CONTRACTS.json'
import SEPOLIA_CONTRACTS from '../../Sepolia-Index1.json'
import SEPOLIA_MUMBAI_CONTRACTS from '../../Sepolia-index2.json'



import SEPOLIA_AMOY_CONTRACTS from '../../Sepolia-index2.json'

// import SEPOLIA_MUMBAI_SIDECHAIN_CONTRACTS from '../../Mumbai-Side-index2.json';

import PRIMARY_SEPOLIA from '../../CONTRACTS-sepolia.json'
import SECONDARY_MUMBAI from '../../CONTRACTS-mumbai.json'


export const nativeAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const amountToWrapToken1 = BigNumber.from(10).mul(BigNumber.from(10).pow(18));
const amountToWrapToken2 = BigNumber.from(20).mul(BigNumber.from(10).pow(18));
const tokenToBeWrapped1Address = CONTRACTS['FungibleToken'][0].address
const tokenToBeWrapped2Address = CONTRACTS['FungibleToken'][1].address
const nativeWrapperAddress = CONTRACTS['NativeTokenWrapper'][0].address
const SepoliaChainId = 11155111;
const HardhatChainId = 31337;
const MumbaiChainId = 80001;
const AmoyChainId = 80002;

// export const _ETFv2ABI = require("../.././artifacts/contracts/ETFContractv2.sol/ETFv2.json").abi;
// const _MockAggregatorABI = require("../.././artifacts/contracts/MockAggregator.sol/MockAggregator.json").abi;
// const _ETFContractv2ABI = require("../.././artifacts/contracts/ETFContractv2.sol/ETFv2.json").abi;
// export const _SIDE_ABI = require("../.././artifacts/contracts/SidechainDeposit.sol/SidechainDeposit").abi;




function isProduction() {
    return process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';
}

async function fetchABI(fileName: string) {
    if (!process.browser) {
        return []; // Or some mock ABI data if necessary
    }
    const isProduction = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';
    const baseUrl = isProduction ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'http://localhost:3000';
    const url = `${baseUrl}/assets/${fileName}`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data.abi;
}
// const ETFv2ABI = isProduction() ? fetchABI("ETFContractv2.sol/ETFv2.json") : require("../../artifacts/contracts/ETFContractv2.sol/ETFv2.json").abi;
// const MockAggregatorABI = isProduction() ? fetchABI("MockAggregator.sol/MockAggregator.json") : require("../../artifacts/contracts/MockAggregator.sol/MockAggregator.json").abi;
// const ETFContractv2ABI = isProduction() ? fetchABI("ETFContractv2.sol/ETFv2.json") : require("../../artifacts/contracts/ETFContractv2.sol/ETFv2.json").abi;
// const SIDE_ABI = isProduction() ? fetchABI("SidechainDeposit.sol/SidechainDeposit.json") : require("../../artifacts/contracts/SidechainDeposit.sol/SidechainDeposit").abi;

const ETFv2ABI = fetchABI("ETFv2.json");
const MockAggregatorABI = fetchABI("MockAggregator.json");
const SIDE_ABI = fetchABI("SidechainDeposit.json");
const FungibleTokenABI = fetchABI("FungibleToken.json");


export {
    ETFv2ABI,
    MockAggregatorABI,
    SIDE_ABI,
    FungibleTokenABI,
};


export const chainSelectorIdToExplorerAddress: any = {
    "16015286601757825753": "https://sepolia.etherscan.io/address",
    "12532609583862916517": "https://mumbai.polygonscan.com/token",
    "16281711391670634445": "https://amoy.polygonscan.com/token",
}

export const chainIdToNetworkName: any = {
    11155111: ["Ethereum", "Sepolia"],
    80001: ["Polygon", "Mumbai"],
    80002: ["Polygon", "Amoy"],
    1: ["Hardhat", "Localhost"],
    0: ["Hardhat", "Localhost"],
}

export const chainIdToNetworkLogo: any = {
    80001: "https://assets.coingecko.com/coins/images/4713/standard/polygon.png?1698233745",
    80002: "https://assets.coingecko.com/coins/images/4713/standard/polygon.png?1698233745",
    11155111: "https://assets.coingecko.com/coins/images/279/standard/ethereum.png?1696501628",
    1: "https://hashnode.com/utility/r?url=https%3A%2F%2Fcdn.hashnode.com%2Fres%2Fhashnode%2Fimage%2Fupload%2Fv1641721533244%2FEDjMSBz-F.png%3Fw%3D1200%26auto%3Dcompress%2Cformat%26format%3Dwebp%26fm%3Dpng"
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

// const ETFConfigurationIndex2 = {
//     name: "ETF-sepolia-mumbai-idx2",
//     chainId: SepoliaChainId,
//     // nativeAddress: nativeAddress,
//     // nativeWrapper: "0x7b79995e5f793a07bc00c21412e50ecae098e7f9",
//     // selectorId: BigNumber.from("16015286601757825753"),
//     // routerAddress: "0xd0daae2231e9cb96b94c8512223533293c3693bf",
//     contracts: PRIMARY_SEPOLIA,
//     sideChainContracts: {
//         "12532609583862916517": SECONDARY_MUMBAI,
//     }
// }

const ETFConfigurationIndex2 = {
    name: "ETF-sepolia-amoy-idx2",
    chainId: SepoliaChainId,
    // nativeAddress: nativeAddress,
    // nativeWrapper: "0x7b79995e5f793a07bc00c21412e50ecae098e7f9",
    // selectorId: BigNumber.from("16015286601757825753"),
    // routerAddress: "0xd0daae2231e9cb96b94c8512223533293c3693bf",
    contracts: PRIMARY_SEPOLIA,
    sideChainContracts: {
        // "12532609583862916517": SECONDARY_MUMBAI,
        "16281711391670634445": SEPOLIA_AMOY_CONTRACTS,
    }
}

export const SelectorIdToChainId: any = {
    "16015286601757825753": SepoliaChainId,
    "12532609583862916517": MumbaiChainId,
    "16281711391670634445": AmoyChainId,
    "1": HardhatChainId,
    "0": HardhatChainId,
}

export const ChainIdToSelectorId: any = {
    [SepoliaChainId]: "16015286601757825753",
    [MumbaiChainId]: "12532609583862916517",
    [AmoyChainId]: "16281711391670634445",
    [HardhatChainId]: "1",
}


export const configs: Array<any> = [ETFConfigurationIndex0, ETFConfigurationIndex2];

const DAIAddresses = [PRIMARY_SEPOLIA['FungibleToken'][0].address, SEPOLIA_CONTRACTS['FungibleToken'][0].address, CONTRACTS['FungibleToken'][0].address, SEPOLIA_MUMBAI_CONTRACTS['FungibleToken'][0].address];
const LINKAddresses = [PRIMARY_SEPOLIA['FungibleToken'][1].address, SEPOLIA_CONTRACTS['FungibleToken'][1].address, CONTRACTS['FungibleToken'][1].address, SEPOLIA_MUMBAI_CONTRACTS['FungibleToken'][1].address];
const SNXAddresses = [SEPOLIA_CONTRACTS['FungibleToken'][2].address, "0xdE617C9DaDDF41EbD739cA57eBbA607C11ba902d"];
const sepoliaPriceDataFeed = ["0x694AA1769357215DE4FAC081bf1f309aDC325306",
    "0x14866185B1962B63C3Ea9E03Bc1da838bab34C19",
    "0xc59E3633BAAC79493d908e63626716e204A45EdF",
    "0xc0F82A46033b8BdBA4Bb0B0e28Bc2006F64355bC"]

export enum Chain {
    Sepolia = 11155111,
    Localhost = 31337,
    Mumbai = 80001,
    Amoy = 80002
}

export const networkToSelectorId: any = {
    [Chain.Sepolia]: "16015286601757825753",
    [Chain.Localhost]: "1",
    [Chain.Mumbai]: "12532609583862916517",
    [Chain.Amoy]: "16281711391670634445",
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
    else if (chainId == AmoyChainId) {
        chainContracts = SEPOLIA_AMOY_CONTRACTS;
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

export const getPriceAggregatorAddress = async (PriceAggregatorABI: any) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    // get chainId
    const network = await provider.getNetwork();
    const chainId = network.chainId;

    let prices = [];

    if (chainId == SepoliaChainId) {
        for (let address of sepoliaPriceDataFeed) {
            const contract = new ethers.Contract(address, PriceAggregatorABI, provider);
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
            const contract = new ethers.Contract(address, PriceAggregatorABI, provider);
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


export const getValueChartData = async (PriceAggregatorABI: any) => {
    let values: any = [];
    const labels: any = [];
    const prices: any[] = await getPriceAggregatorAddress(PriceAggregatorABI);
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
    const contract = new ethers.Contract(address, await ETFv2ABI, provider);
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
    const contract = new ethers.Contract(contractAddress, await ETFv2ABI, provider);
    const recordArray = await contract.getAddressQuantityPerBundle(bundleId, address);
    return recordArray;
}

export const calculateTLV = async (bundleIdQuantities: any, PriceAggregatorABI: any) => {
    const prices = await getPriceAggregatorAddress(PriceAggregatorABI);
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
    userSender: string; // Ethereum address
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
        return messageDeposit?.depositFundMessage.bundleId.eq(bundleId) && messageDeposit.depositFundMessage.tokensToWrap.find((token: any) => token.assetContract === assetAddress)
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
        const messageId = messageDeposit[1];
        const contractSender = messageDeposit[2];
        const sourceChainSelector = BigNumber.from(messageDeposit[2]);

        // Decoding depositFundMessage
        // This assumes depositFundMessage is ABI-encoded and follows a specific format
        // The specific decoding logic will depend on how depositFundMessage is structured
        try {
            const depositFundMessageDecoded = ethers.utils.defaultAbiCoder.decode(
                // Provide the expected types of DepositFundMessage here
                ["tuple(uint256,address,tuple(address,uint256,uint256,uint256)[])"], // Example types, adjust according to actual structure
                depositFundMessageEncoded
            );
            const depositFundMessage: DepositFundMessage = {
                // Populate based on the decoded data
                bundleId: depositFundMessageDecoded[0][0],
                userSender: depositFundMessageDecoded[0][1],
                tokensToWrap: depositFundMessageDecoded[0][2].map((asset: string) => ({
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
                messageId,
                sender: depositFundMessage.userSender,
                sourceChainSelector,
            };
        }
        catch (err) {
            console.log('err', err);
            return undefined;
        }

        // Constructing the DepositFundMessage object

    });
}