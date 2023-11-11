import { useContract, useContractRead, useContractWrite, useBalance, useAddress } from "@thirdweb-dev/react";
import styles from '../styles/page.module.css'
const ABI = require("../.././artifacts/contracts/ETFContractv2.sol/ETFv2.json").abi;
const TokenABI = require("../.././artifacts/contracts/TokenWrapped.sol/FungibleToken.json").abi;

import { Avatar } from 'antd';
const nativeAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { use } from "chai";

const minimiseAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
}



function TokenBalance({ address, quantity }: { address: string, quantity: string }) {
    const { data: balance, isLoading: balanceLoading, error: balanceError } = useBalance(
        address
    );

    return <span>
        {/* <code className={styles.code}>{minimiseAddress(address)}</code>| */}
        {/* <Avatar style={{ backgroundColor: '#fde3cf', color: '#f56a00' }}>U</Avatar> */}
        &nbsp;
        {balanceLoading && <span color="processing">Loading...</span>}
        {!balanceError && !balanceLoading && balance && <Avatar
            style={
                {
                    backgroundColor: `#${address.slice(2, 8)}`,
                    color: 'black',
                    borderRadius: '50%',
                    fontWeight: 'bold',
                }
            }

        >{balance.symbol}</Avatar>}
    </span>
}


export default function OpenETFView({ address, tokenToBeWrapped1Address, tokenToBeWrapped2Address }: {
    address: string,
    tokenToBeWrapped1Address: string,
    tokenToBeWrapped2Address: string
}) {

    const [addresses, setAddresses] = useState<string[]>([]);
    const [quantities, setQuantities] = useState<string[]>([]);
    const userAddress = useAddress();

    const { contract, isLoading: isContractLoading, error: isContractError } = useContract(address, ABI);
    const { data: requiredAssets, isLoading: requiredAssetsLoading, error: requiredAssetsError } = useContractRead(
        contract,
        "getRequiredAssets"
    );

    useEffect(() => {
        if (!requiredAssets) return;
        setQuantities(requiredAssets[0]);
        setAddresses(requiredAssets[1]);
    }, [requiredAssets]);


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


    // const { data: balance, isLoading: balanceLoading, error: balanceError } = useBalance(
    //     ,
    // );


    const { mutateAsync: mint, isLoading, error } = useContractWrite(
        contract,
        "mint"
    );

    // use contract read to see what is needed to mint



    return <span
        className={styles.card}
        rel="noopener noreferrer"
        onClick={
            () =>
                mint({
                    args: [
                        userAddress,
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
        <p>
            Open an ETF position with 0.5 ETH, 10 Token1, 20 Token2
        </p>
        <div>
        </div>
    </span >

}