import { ConnectWallet, Web3Button, useContract, useContractRead, useContractWrite, useNFTs, useTotalCount } from "@thirdweb-dev/react";
import styles from '../styles/page.module.css'
import CONTRACTS from '../../CONTRACTS.json'
const ABI = require("../.././artifacts/contracts/ETFContractv2.sol/ETFv2.json").abi;
// const ABI = require("../.././artifacts/contracts/TokenWrapped.sol/FungibleToken.json").abi;

const nativeAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
import { Tag } from 'antd';
import { ContractInterface, ethers } from "ethers";


const minimiseAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
}


export default function OpenETFView({ address, tokenToBeWrapped1Address, tokenToBeWrapped2Address }: {
    address: string,
    tokenToBeWrapped1Address: string,
    tokenToBeWrapped2Address: string
}) {


    const amountToWrapToken1 = 10;
    const amountToWrapToken2 = 20;
    const ethersToWrap = ethers.utils.parseEther("0.5");

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

    const { contract, isLoading: isContractLoading, error: isContractError } = useContract(address, ABI);

    const { mutateAsync: mint, isLoading, error } = useContractWrite(
        contract,
        "mint"
    );

    return <span
        className={styles.card}
        rel="noopener noreferrer"
        onClick={
            () =>
                mint({
                    args: [
                        address,
                        [nativeTokenStruct, tokenStruct1, tokenStruct2],
                    ],
                    overrides: {
                        value: ethersToWrap,
                    }
                })
        }
    >
        <h2>
            Open<span>-&gt;</span>
        </h2>
        {address}
        <p>Find in-depth information about Next.js features and API.</p>
    </span >

}