import { useAddress, useContract, useBalance, Web3Button, useContractWrite, useContractRead } from "@thirdweb-dev/react";
import styles from '../styles/page.module.css'
import { Tag } from 'antd';
import style from '../styles/page.module.css';
import { BigNumber, utils } from "ethers";
const ABI = require("../.././artifacts/contracts/TokenWrapped.sol/FungibleToken.json").abi;


const minimiseAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export default function TokenView({ address, className, etfAddress }: { address: string, etfAddress?: string, className?: string }) {

    const userAddress = useAddress();
    const { data: balance, isLoading: balanceLoading, error: balanceError } = useBalance(
        address,
    );
    const { contract, isLoading: isContractLoading, error: isContractError } = useContract(address);
    const { mutateAsync: approve, isLoading, error } = useContractWrite(contract, "approve");
    //  use contract read
    const { data: allowance, isLoading: isAllowanceLoading, error: nameError } = useContractRead(contract, "allowance", [userAddress, etfAddress]);


    return <div className={`${style.description} ${className}`}>
        {balance?.name.toUpperCase()}&nbsp;  |
        <code className={styles.code}>{minimiseAddress(address)}</code>| 
        &nbsp;
        {balanceLoading && <Tag color="processing">Loading...</Tag>}
        {!balanceError && !balanceLoading && balance && <Tag color="success">{balance.displayValue} {balance.symbol}</Tag>}
        {/* web3 button to `approve` erc20 tokens */}

        {!!etfAddress && <>
            <Web3Button
                className={style.web3Button}
                contractAddress={address}
                // Calls the "setName" function on your smart contract with "My Name" as the first argument
                action={() => approve({
                    // 10 tokens considering 18 decimals
                    args: [etfAddress,
                        BigNumber.from(10).mul(BigNumber.from(10).pow(18))
                    ]
                })}
            >
                Approve Token
            </Web3Button>

            {isAllowanceLoading && <Tag color="processing">Loading...</Tag>}
            {!nameError && !isAllowanceLoading && allowance && <Tag color="blue">Allowance: {utils.formatUnits(allowance, 18)}</Tag>}
        </>
        }


    </div>
}