import { useContract, useContractRead, useContractWrite, useBalance, useAddress } from "@thirdweb-dev/react";
import styles from '../styles/page.module.css'
const ABI = require("../.././artifacts/contracts/ETFContractv2.sol/ETFv2.json").abi;
import { Avatar } from 'antd';
import { useEffect, useState } from "react";
import { ethersToWrap, requiredTokenStructs } from "./utils";


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
    const [nativeTokenStruct, tokenStruct1, tokenStruct2] = requiredTokenStructs;
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