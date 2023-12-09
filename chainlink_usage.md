
## Chainlink usage link


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
