
## Chainlink usage link


### Chainlink Data Feed
Once the contract knows a vault can be closed it calculates all users' contributions using **Chainlink DataFeed** 


[`closeBundle` - calculate the total value of the valut in ths period summing up the quantities times prices from Data Feed ](https://github.com/GaetanoMondelli/xtf/blob/766ae477d2053badf1d4943c7bc642deef3d1650/contracts/ETFContractv2.sol#L319)

```
uint256 totalValue = 0;
        for (uint256 i = 0; i < getTokenCountOfBundle(bundleId); i += 1) {
            //  TO-DO: NEED TO SCALE THE PRICE TO THE TOKEN DECIMALS
            // uint256 priceAggrDecimals = tokenIdToDataFeed[
            //     getTokenOfBundle(bundleId, i).assetContract
            // ].decimals();
            uint256 tokenDecimals = 18;
            if (getTokenOfBundle(bundleId, i).assetContract != NATIVE_TOKEN) {
                tokenDecimals = IERC20Metadata(
                    getTokenOfBundle(bundleId, i).assetContract
                ).decimals();
            }

            (, /* uint80 roundID */ int answer, , , ) = tokenIdToDataFeed[
                getTokenOfBundle(bundleId, i).assetContract
            ].latestRoundData();

            totalValue +=
                uint256(answer) *
                // 10 ** (tokenDecimals - priceAggrDecimals) * // scale the price to the token decimals
                getTokenOfBundle(bundleId, i).totalAmount;
        }

```

[`closeBundle` - calculates how many ETF tokens to send to each user](https://github.com/GaetanoMondelli/xtf/blob/766ae477d2053badf1d4943c7bc642deef3d1650/contracts/ETFContractv2.sol#L376)

!Note this can be optimised storing price values


```
 for (
    uint256 j = 0;
    j < getTokenCountOfBundle(bundleId);
    j += 1
) {
    address assetContract = getTokenOfBundle(bundleId, j)
        .assetContract;

    (, int answer, , , ) = tokenIdToDataFeed[assetContract]
        .latestRoundData();

    amountToSend +=
        (remainingAmount *
            // 10 ** (tokenDecimals - priceAggrDecimals) * // scale the price to the token decimals
            (uint256(answer) * tokenIdToAmount[j])) /
        totalValue;
}
addressToAmount[bundleId][addressToSend] += amountToSend;


```



### DepositFundMessage Message of Tokens deposited from SideChain --> MainChain

When a user deposit on a sidechain an asset, after some checks on the sidechain a message is sent trhough CCIP to the Mainchain.
In this case the contract does not automatically add the tokens to the bundle. This operation could be too much gas expensive considered that if these addition completes the bundle with all the required assets, it would also trigger the `closebundle` method that calculates all the contributions, mints the tokens and send a message to VRF Coordinator to elect a winner for the NFT Vote. Instead a EventSource (ES) approach is used, where the message is stored in an array and later the user can apply those changes by calling the public method `updateBundleAfterReceive(bundleId)` 

[`DepositFundMessage` - Message Strucuture in types contract](https://github.com/GaetanoMondelli/xtf/blob/766ae477d2053badf1d4943c7bc642deef3d1650/contracts/ETFContractTypes.sol#L27)

```

struct Token {
    address assetContract; // token deposited
    TokenType tokenType; // The token type (ERC20 / ERC721 / ERC1155)
    uint256 tokenId; // if NFT, tokenId of NFT 
    uint256 totalAmount; // amount deposited
}


struct DepositFundMessage {
    uint256 bundleId; // in wich bundle (vault) the deposit was made
    address userSender; // who made the deposit (contributor)
    ITokenBundle.Token[] tokensToWrap; // array of token deposit (contribution)
}
```

[Sidechain -  SidechainDeposit `send` DepositFundMessage to Mainchain- ETFContract after validationg the deposit](https://github.com/GaetanoMondelli/xtf/blob/766ae477d2053badf1d4943c7bc642deef3d1650/contracts/SidechainDeposit.sol#L197)


```
function depositFundsAndNotify(
    uint256 _bundleId,
    Token[] memory _tokensToWrap,
    PayFeesIn _payFeesIn,
    bool debug
) external payable returns (bytes32 messageId) {
    require(
    ... CHECKS FOR VALIDATION OF THE DEPOSIT ON SIDE CHAIN
    ... UPGRADING THE VAULT ON SIDECHAIN 
    return
        send(
            primaryChainSelectorId,
            primaryEtfContract,
            message,
            _payFeesIn
        );
}

```


[Mainchain - ETFContract `_ccipReceive`  from Sidechain - SidechainDeposit ](https://github.com/GaetanoMondelli/xtf/blob/766ae477d2053badf1d4943c7bc642deef3d1650/contracts/ETFContractBase.sol#L290) 

```
function _ccipReceive(
    Client.Any2EVMMessage memory message
) internal virtual override {
DepositFundMessage memory depositFundMessage = abi.decode(
    message.data,
    (DepositFundMessage)
);
MessageDesposit memory messageDesposit = MessageDesposit({
    messageId: message.messageId,
    depositFundMessage: message.data,
    sender: abi.decode(message.sender, (address)),
    sourceChainSelector: message.sourceChainSelector
});
messages[depositFundMessage.bundleId].push(messageDesposit);
messageCount[depositFundMessage.bundleId] += 1; 
}

```

---


### RedeemETFMessage Message of Tokens deposited from MainChain --> SideChain 

Once a vault is completed, it mints ETF tokens to the contributors. After a locking period a if a user has enough ETFTokens can decide to `burn` the vault and redeem the underlying assets. This operation is done in the Mainchain and release automatically all the assets to the `burners`. The vault is now in `Burned` state and the related `burner` is stored in the contract. At this point any user can ask to send messages to the other Sidechains asking to relaese the token to the `burner/receiver`.  

[`RedeemETFMessage`- Message Strucuture in types contract](https://github.com/GaetanoMondelli/xtf/blob/766ae477d2053badf1d4943c7bc642deef3d1650/contracts/ETFContractTypes.sol#L19)
```
struct RedeemETFMessage {
    uint256 bundleId;
    address receiver; // The burner that will receive the token locked in the Sidechain
    bytes32 messageId;
}
```

[Mainchain - ETFContract `sendReedeemMessage` RedeemETFMessage to Sidechain - SidechainDeposit ](https://github.com/GaetanoMondelli/xtf/blob/766ae477d2053badf1d4943c7bc642deef3d1650/contracts/ETFContractv2.sol#L434) 
Note: other cheks should be implemented here.

```
function sendReedeemMessage(
    uint256 bundleId,
    uint64 destinationChainSelector,
    PayFeesIn payFeesIn
) public returns (bytes32 messageId) {
    require(isETFBurned(bundleIdToETFId[bundleId]), "notbrnd");
    ReedeemETFMessage memory data = ReedeemETFMessage({
        bundleId: bundleId,
        receiver: burner[bundleId],
        messageId: 0
    });
    messageId = send(destinationChainSelector, payFeesIn, data);
    data.messageId = messageId;
    reedeemMessages[bundleId].push(data);
    }
```

Note that sidechain contracts are stored after the deployment in the  `chainSelectorIdToSidechainAddress` map

```
    function send(
    uint64 destinationChainSelector,
    PayFeesIn payFeesIn,
    ReedeemETFMessage memory data
) internal returns (bytes32 messageId) {
    Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
        receiver: abi.encode(
            chainSelectorIdToSidechainAddress[destinationChainSelector]
        ),
        data: abi.encode(data),
        tokenAmounts: new Client.EVMTokenAmo
```

[Sidechain - SidechainDeposit  `_ccipReceive` from Mainchain - ETFContract ](https://github.com/GaetanoMondelli/xtf/blob/766ae477d2053badf1d4943c7bc642deef3d1650/contracts/ETFContractBase.sol#L290) 

```
    function _ccipReceive(
        Client.Any2EVMMessage memory message
    ) internal virtual override {
        ReedeemETFMessage memory reedeemMessage = abi.decode(
            message.data,
            (ReedeemETFMessage)
        );
        require(
            burner[reedeemMessage.bundleId] == address(0),
            "bundleId is already burned"
        );
        _burnCounter += 1;
        _releaseTokens(reedeemMessage.receiver, reedeemMessage.bundleId);
        burner[reedeemMessage.bundleId] = reedeemMessage.receiver;
    }
```


### VRF `Running sum` for elect a Winner

[`closeBundle` method sends the requests to elect a Vote winner after minting ETF tokens to users](https://github.com/GaetanoMondelli/xtf/blob/766ae477d2053badf1d4943c7bc642deef3d1650/contracts/ETFContractv2.sol#L397C1-L405C22)

Once all the required tokens are deposited in a vault (bundle) the ETF tokens are minted and a NFT Vote is minted to the Contract. The `closeBundle` method after assigning the NFT Vote to the contract, sends a VRF Request to get a random word that will be used to elect the winner of the Vote.

```
requestIdToBundleId[
COORDINATOR.requestRandomWords(
    chainLinkData.keyHash,
    chainLinkData.subscriptionId,
    REQUEST_CONFIRMATIONS,
    VRG_GAS_LIMIT,
    NUM_WORDS
)
] = bundleId;
```

The easiest solution (gas efficient)

```
address winner = bundleIdToAddress[requestIdToBundleId[requestId]][
randomWords[0] %
    bundleIdToAddress[requestIdToBundleId[requestId]].length
];

bundleIdToRandomWinner[requestIdToBundleId[requestId]] = winner;
```



The more complex solution (gas inefficient), temporarily disabled as it was sometimes consuming more GAS than MAX_CALLBACK 2_000_000.


```
// uint256 totalContributions = 0;
for (
    uint256 i = 0;
    i < bundleIdToAddress[requestIdToBundleId[requestId]].length;
    i++
) {
    totalContributions += addressToAmount[
        requestIdToBundleId[requestId]
    ][bundleIdToAddress[requestIdToBundleId[requestId]][i]];
}

uint256 randomIndex = randomWords[0] % totalContributions;
uint256 runningSum = 0;
address winner;

for (
    uint256 i = 0;
    i < bundleIdToAddress[requestIdToBundleId[requestId]].length;
    i++
) {
    runningSum += addressToAmount[requestIdToBundleId[requestId]][
        bundleIdToAddress[requestIdToBundleId[requestId]][i]
    ];
    if (randomIndex < runningSum) {
        winner = bundleIdToAddress[requestIdToBundleId[requestId]][i];
        break;
    }
}
```

The last solution uses a running sum to make sure that the more an account contributed to the vault the more are the chances to get a NFT token.

---


### Mock Chainlink Contracts for initial protocol design/test

All the mocks were necessary for deploying the contract locally and launch a local chain with the xtf protocol on localhost. This script documents also all the requirements necessary for using xtf.
- [script/deploy.ts](https://github.com/GaetanoMondelli/xtf/blob/42d6edbc54fcd3da54f1a7ece6c2dae3d9bb482f/scripts/deploy.ts#L35) 

#### Data Feed

[MockAggreagator.sol](https://github.com/GaetanoMondelli/xtf/blob/42d6edbc54fcd3da54f1a7ece6c2dae3d9bb482f/contracts/MockAggregator.sol#L55)

For mocking data feed price aggreagator in hardhat tests and whe. In the second case I hardcoded values from end of November 2023 for simulating prices of ETH, LINK, SNX, DAI. 

- [tests/etfContract.spec.ts](https://github.com/GaetanoMondelli/xtf/blob/42d6edbc54fcd3da54f1a7ece6c2dae3d9bb482f/test/etfContract.spec.ts#L16)


#### CCIP


[MockRouterClient.sol](https://github.com/GaetanoMondelli/xtf/blob/main/contracts/MockRouter.sol) 

For mocking CCIP Router, in this case a method `setOnlyRouteTo` was used to all the requests were forwarded to a specific address based on the test case.
CCIP basic usage was first tested with a simple example in [tests/messageLayer.spec.ts](https://github.com/GaetanoMondelli/xtf/blob/main/test/messageLayer.spec.ts) using trivial implementation of a sender a receiver included in the chainlink contracts library
and later tested for proving the correct messages ware sent and received by the Router were added to the [tests/etfContract.spec.ts](https://github.com/GaetanoMondelli/xtf/blob/42d6edbc54fcd3da54f1a7ece6c2dae3d9bb482f/test/etfContract.spec.ts#L16) and the [tests/sideChainDepositContract.spec.ts](https://github.com/GaetanoMondelli/xtf/blob/main/test/sideChainDepositContract.spec.ts) 
[LinkTokenInterface](https://github.com/GaetanoMondelli/xtf/blob/main/contracts/LinkTokenInterface.sol) became a crucial aspect of testing in prod, particularly for managing LINK payments for CCIP given the challenges encountered with the Mumbai Faucet, which limited its distribution to a maximum of 0.5 MATIC per day.

- The test suite [gets notification from side chain deposits](https://github.com/GaetanoMondelli/xtf/blob/42d6edbc54fcd3da54f1a7ece6c2dae3d9bb482f/test/etfContract.spec.ts#L513) have tests to prove the message was sent correctly to the router for sending it to the sidechain and that was able to receive and parse (this was quite challenging, especially when defining the abi strucuture of messages that contained arrays) the message from the sidechain via the router.
 - [should be able to receive notification and update the bundle](https://github.com/GaetanoMondelli/xtf/blob/42d6edbc54fcd3da54f1a7ece6c2dae3d9bb482f/test/etfContract.spec.ts#L604)
 - [should be able to send notifaction to reedem tokens on sidechains (sendReedeemMessage)](https://github.com/GaetanoMondelli/xtf/blob/42d6edbc54fcd3da54f1a7ece6c2dae3d9bb482f/test/etfContract.spec.ts#L733)

#### VRF

In this case I was able to find a mock mockimplentation ready [here](https://docs.chain.link/vrf/v2/subscription/examples/test-locally) 
- [should be able to handle the VRF promises fullfilment for NFT Vote winner](https://github.com/GaetanoMondelli/xtf/blob/766ae477d2053badf1d4943c7bc642deef3d1650/test/etfContract.spec.ts#L820) 


