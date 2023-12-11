# Chainlink usage link


Parts of the smart contract of ETFv2 (that inherits by ETFBase) and SideChainDeposit (for handling sidechain deposit) that uses Chainlink.

Please refer to this Readme for the full description of the protocol.



## Chainlink Data Feed
Once the contract knows a vault can be closed it calculates all users' contributions using **Chainlink DataFeed** 


[`closeBundle` - This calculates the total value of the vault by summing the quantities of the deposited assets multiplied by their respective prices, sourced from the Data Feed.](https://github.com/GaetanoMondelli/xtf/blob/766ae477d2053badf1d4943c7bc642deef3d1650/contracts/ETFContractv2.sol#L319)

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

## Chainlink CCIP

### DepositFundMessage Message of Tokens deposited from SideChain --> MainChain

When a user deposits an asset on a sidechain, the sidechain contract performs some checks and then sends a message through CCIP to the Mainchain. However, this process doesn't automatically add the tokens to the bundle in the Mainchain contract. This is to avoid high gas costs that could occur if this addition completes the bundle, triggering the `closeBundle` method. This method not only finalises the bundle but also calculates all contributions, mints tokens, and sends a message to the VRF Coordinator for the NFT Vote winner selection.

To manage this efficiently, we employ an Event Source (ES) approach. Here, the message from the sidechain is stored in an array on the Mainchain. Users can then apply these changes at their convenience by invoking the public method `updateBundleAfterReceive(bundleId)`. This method allows users to update the bundle status and process contributions from sidechains, ensuring a cost-effective and user-driven approach.

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


After a vault is fully contributed to, it transitions to the next state by minting ETF tokens for its contributors. Following a set locking period ()`locktime`), if a user has accumulated enough ETF tokens, they have the option to burn the vault (`redeem`). Usually the total amount of tokens minted per vault is required to burned it. This action is initiated on the Mainchain and automatically releases all the assets to the user  who initiates the burn (`burner`) on the main chain. Consequently, the vault's status changes to Burned, and the burner's details are recorded in the contract.
At this point, any user can trigger a process to send messages to the associated sidechains. These messages instruct the sidechains to release the stored assets for that vault to the burner (known in the message as `receiver`). This step completes the asset redemption process from the vault, ensuring that the `burner` receives their due share from both the Mainchain and the sidechains.


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

### VRF 

## `Running sum` for elect a Winner

[`closeBundle` method sends the requests to elect a Vote winner after minting ETF tokens to users](https://github.com/GaetanoMondelli/xtf/blob/766ae477d2053badf1d4943c7bc642deef3d1650/contracts/ETFContractv2.sol#L397C1-L405C22)

When a vault (sometimes referred as bundle) receives all the required token deposits, the protocol initiates the minting of ETF tokens. Alongside this, a unique `NFT Vote`  is minted and assigned to the contract. The `closeBundle` method, which is responsible for this process, also triggers a subsequent action: it `sends` out a request to the VRF (Verifiable Random Function) system to obtain a random word. This random word is then utilized to determine the winner of the NFT Vote, ensuring a fair and transparent selection process.

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

The gas efficient trivial solution

```
address winner = bundleIdToAddress[requestIdToBundleId[requestId]][
randomWords[0] %
    bundleIdToAddress[requestIdToBundleId[requestId]].length
];

bundleIdToRandomWinner[requestIdToBundleId[requestId]] = winner;
```

The more sophisticated yet temporarily disabled solution, due to its high gas consumption often exceeding the MAX_CALLBACK limit of `2_000_000 `GAS, employs a running index. This methodology is designed to allocate a higher chance of winning to users based on the size of their contributions. However, due to its gas inefficiency, we've had to pause its implementation, as it occasionally demands more gas than is feasible under the current system constraints.


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

---


### Mock Chainlink Contracts for initial protocol design/test

All the mocks were necessary for deploying the contract locally and launch a local chain with the XTF protocol on localhost. This script documents also all the requirements necessary for using xtf locally.

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


