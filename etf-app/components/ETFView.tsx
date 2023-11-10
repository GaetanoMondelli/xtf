import { ConnectWallet, Web3Button, useContract, useContractRead, useContractWrite, useNFTs, useTotalCount } from "@thirdweb-dev/react";
import styles from '../styles/page.module.css'
import CONTRACTS from '../../CONTRACTS.json'
const ABI = require("../.././artifacts/contracts/ETFContractv2.sol/ETFv2.json").abi;
const nativeAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
import { Tag } from 'antd';
import { ContractInterface, ethers } from "ethers";


const minimiseAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// export Next component that takes index parameter as props

export default function ETFView({ address }: { address: string }) {

    const { contract, isLoading, error } = useContract(address, ABI);
    const { data: name, isLoading: isNameLoading, error: nameError } = useContractRead(contract, "symbol");
    const { data: count, isLoading: countLoading, error: countError } = useTotalCount(
        contract
    );


    return <div className={styles.description}>
        {/* <Web3Button
            contractAddress={address}
            // Calls the "setName" function on your smart contract with "My Name" as the first argument
            action={() => deposit({ args: [0, ] })}
        >
            Send Transaction
        </Web3Button> */}
        <code className={styles.code}>{minimiseAddress(address)}</code>
        &nbsp;
        {countLoading && <Tag color="processing">Loading...</Tag>}
        {!countError && !countLoading && count && <Tag color="success">Total Count: {count.toNumber()}</Tag>}

        {/* {!count && countError && <Tag color="error">Error {JSON.stringify(countError)}</Tag>} */}
        {/* {JSON.stringify(ABI)} */}
        {/* {isNameLoading && <Tag color="processing">Loading...</Tag>} */}
        {/* {!error && !isNameLoading && name && <Tag color="success">{name}</Tag>} */}
        {/* {nameError && <Tag color="error">Error {JSON.stringify(nameError)}</Tag>} */}
        {!nameError && !isNameLoading && name && <Tag color="success">Name: {name}</Tag>}


        {/* 
        {
            nfts?.map((nft: any) => {
                return <div>
                    <code className={styles.code}>{minimiseAddress(nft.tokenId)}</code>|
                    &nbsp;
                    {nftLoading && <Tag color="processing">Loading...</Tag>}
                    {!nftError && !nftLoading && nft && <Tag color="success">{nft.displayValue}</Tag>}
                </div>
            })
        } */}
    </div>
}