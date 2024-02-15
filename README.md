
## SCRIPTS

- `npm run test`: to run all hardhat tests
- `npm run cheksize`: to check the size of contracts
- `npm run init`: runs a localchain, build the contracts and deploy them to the local chain (see /scripts/deploy.ts script)

Refer to th script folder, `package.json`script section and  Deployment Section of this repository to deploy on public chains.

## Inspiration

The move by financial giants, including BlackRock and Fidelity, to integrate cryptocurrencies like Bitcoin and Ethereum into their ETF offerings, sparked my curiosity. It led me to think: Is it possible for me to create an ETF that is decentralised, easy to understand, and transparent for everyday investors?

That's how XTF (DeX Traded Fund) was born. My goal was simple: to make financial investments in multiple digital assets more convenient, clearer, and safer for everyone. The recent issues with centralised solutions underscored the need for an alternative approach. I aimed to offer a fair protocol where every stakeholder, from those depositing assets into the ETF bucket to the holders of the resulting share tokens, could clearly recognise the benefits.

The logo of XTF, resembling a multi-layered cake, symbolizes the integration of different assets into a unified investment, offering investors a 'slice' of this diversity in a single, cohesive asset

![logo](https://xtf.vercel.app/_next/image?url=%2Fimages%2Flogo3.png&w=128&q=75)

## What it does

XTF, which stands for deX Traded Fund, transforms the way traditional Exchange-Traded Funds (ETFs) work by adopting a decentralised approach. Typically, in traditional finance, a single central entity is responsible for managing and securing all the assets in an ETF. They collect these assets to form a large, diversified pool and then split this pool into smaller parts, each representing a share of the ETF.

XTF takes a different approach by decentralizing the entire process. Instead of pooling all assets into one large collective, it organizes them into multiple smaller 'vaults.' Each of these vaults holds a part of the overall asset mix, but in manageable quantities. This design makes it easier for users to participate in these vaults, allowing them to quickly acquire their share of the investment through ETF shares in the form of ERC20 tokens.

Furthermore, XTF offers a flexibility not commonly found in traditional finance: users can choose to return their ETF tokens to redeem the actual assets stored in these vaults. This reverse process adds an extra layer of user control and liquidity. Detailed insights into this process, including the full 'xState' (state machine) representation of the protocol, will be covered in an upcoming whitepaper.

![lyfecycle](https://github.com/GaetanoMondelli/xtf/blob/95f277cb9be09efdc8552cbdb6d209513ecf15f2/vault-lifecycle.png?raw=true)

"Now, let's explore some of the key features of XTF:

- **DAO-Driven Index Composition**: Initially, a Decentralized Autonomous Organization (DAO) decides on the vaults' composition. This is akin to constructing an index in traditional ETFs. The process involves selecting specific tokens and determining their quantities to ensure a balanced asset distribution in each vault. Moreover, the DAO sets critical parameters like the total number of vaults, how the tokens are split within each vault, the number of tokens needed to reclaim vault assets, and any relevant fees

- **User contribution**: Users holding assets listed in the index can deposit these into any vault. This helps meet the vault's required asset mix. In exchange, contributors receive ETF share tokens and NFT Votes, proportional to the amount they put in.

- **ETF Token Issuance**: The protocol issues ETF tokens to users only after a vault has gathered all necessary assets, maintaining a balanced distribution across the ETF index. The number of tokens a user gets corresponds to their contribution size, aligned with the vault's asset mix. XTF leverages **Chainlink Data Feeds** to precisely value each contribution, ensuring the valuation is based on up-to-date market data.



The following formula specifies how many ETF tokens are minted for each user, considering multiple assets types:

![formula](https://github.com/GaetanoMondelli/xtf/blob/main/formula2.png?raw=true)

and the total number of  tokens minted for each vault is equal to:

![total](https://github.com/GaetanoMondelli/xtf/blob/main/total.png?raw=true)


Where:
- \( T_{mu} \) represents the total ETF tokens minted and allocated to each user.
- \( T_{pv} \) is the total number of ETF tokens issued per vault.
- \( f \) is the protocol percentage fee.
- \( V_{ci} \) is the value of the \( i \)-th token contribution.
- \( P_{ti} \) is the price of the \( i \)-th token.
- \( V_{total} \) is the total value of contributions in the vault.
- \( m \) is the total number of token types contributed.


- **Vaults Lyfecycle**: Vaults within XTF go through different stages. Some are 'OPEN' and ready for contributions. Others are processing deposits from external blockchains. Once a vault accumulates the targeted assets, it issues tokens ('MINTED' stage). And some vaults are 'burned' after their assets are redeemed by ETF token holders, marking the completion of their cycle.

![states](https://github.com/GaetanoMondelli/xtf/blob/main/states2.png?raw=true)


- **Vault's assets Redemption and Liquidity**: ETF token holders can trade their tokens for the actual assets in the vaults, adding significant utility to these tokens.  Upon the completion of a vault cycle, it issues ETF tokens based on the amount invested by each contributor, with some tokens set aside for fees. These tokens can then be redeemed for the underlying assets after a certain period, encouraging investors to hold onto their tokens for future advantages.


- **Simplified Cross-Chain multi asset investment via Chainlink CCIP**: XTF simplifies investing in diverse assets across multiple blockchains. It does this without the need for managing several wallets or navigating different blockchain systems. XTF's protocol uses cross-chain communication, involving two types of smart contracts: 'ETFContractV2.sol' on the main chain and 'SidechainDeposit.sol' contracts on external chains (sidechains). This feature simplifies the investment process and offers a more convenient way to diversify investment portfolios.

    - **Sidechain Deposit**: In XTF's system, users on the mainchain deposit funds using a specific method (depositFunds) in the ETFContractV2.sol contract. For sidechain deposits, they use a different method (depositFundsAndNotify) in the SidechainDeposit.sol contract. This process ensures that deposits are authenticated, and vault balances are updated accurately. The deposits from sidechains are sent to the mainchain, where they're processed and aligned with the mainchain assets. 
    
    Deposit funds on sidechain flow (from Sidechain to Mainchain)

    ![DepositFundsAndNotify](https://github.com/GaetanoMondelli/xtf/blob/main/depositAndNotify.png?raw=true)

    - **Sidechain redemption**: After a set period (lockTime), users holding enough ETF share tokens can start redeeming their investments. This action releases the assets on the mainchain and marks the completion of that vault's cycle. Additionally, users can initiate a cross-chain redemption, using `sendRedeemMessage` to release assets across the involved sidechains.

    Redeem assets on sidechain (from Mainchain to Sidechain) 

    ![SendReedemMessage](https://github.com/GaetanoMondelli/xtf/blob/main/sendRedeemMessage.png?raw=true)

 
- **DAO Token and Chainlink VRF 'Lottery' Mechanism**: In XTF, when a vault reaches full contribution, participants receive a special DAO NFT Vote, utilizing Chainlink VRF (Verifiable Random Function). This introduces an element of randomness in awarding DAO tokens, ensuring a fair and transparent process. The likelihood of receiving a DAO token is linked to the size of the user's contribution. This method, akin to a lottery system, is similar to the selection mechanisms used in various blockchain consensus models, like Proof of Stake (PoS) and Proof of Transfer (PoT) in the sBTC protocol [[1]](https://stacks-network.github.io/stacks/sbtc.pdf). The DAO token in XTF, a unique type of NFT, can't be burned by its holder directly. Instead, it's automatically burned when a user redeems assets from a vault using their ETF tokens, which happens after a specified lock period. This process incentivizes investors to hold their assets longer.
While ETF tokens are also a representation of contributions within a XTF index, they are inefficient for governance purposes (See On Fairness in Voting Protocol [2]](https://arxiv.org/abs/2012.08313)). The specific handling of the DAO NFT vote is designed to avoid complications in large-scale, decentralized voting. By linking the burning of the DAO NFT to the redemption of assets, XTF ensures a balanced system that prioritizes security, efficient liquidity, and fair participation


- **Transparent and Equitable System**: Leveraging blockchains and smart contracts, XTF ensures complete transparency in asset management and distribution. All transactions and vault compositions are immutably recorded, improving trust and clarity among participants.


## How we built it

My journey in developing XTF during the hackathon started with creating smart contracts using Solidity, initially as a single-chain protocol. The main aim was quick development and testing of key features. For this, I used mock interfaces for the DataFeed and Hardhat for early testing, ensuring the protocol’s foundation was strong.

The protocol first handled defining vault compositions and managing deposits, then progressed to minting tokens in proportion to each user's contribution once a vault was fully funded. To enhance reliability and security, I integrated vetted libraries like Thirdweb’s [TokenBundle](https://portal.thirdweb.com/contracts/TokenBundle) and [TokenStore](https://portal.thirdweb.com/contracts/TokenStore).

As XTF evolved, I introduced multi-chain functionality, adding mock contracts for the LinkToken interface and the CCIP router, and incorporated a VRFCoordinator mock for the NFT Vote lottery feature. A comprehensive suite of tests was crucial for validating the protocol and refining its versions.

For the user interface, I chose NEXT.js, React, and ThirdWebUI, incorporating graphical elements using libraries like Chart.js and ApexCharts.js. The data on the website, mainly sourced directly from the blockchain through . **QuickNode** providers, includes bundle states, compositions, and asset allocations, with some data for index price comparisons sourced from the [Young Platform API](https://youngplatform.com/en/glossary/api/).

The final stage was deploying the project on Vercel for judges' review. However, I've kept broader public access limited for now, prioritizing stability and user experience, especially since the performance under multiple user access scenarios is yet to be fully tested


![tests](https://github.com/GaetanoMondelli/xtf/blob/main/tests.png?raw=true)

### List of all implemented smart contracts

- [ETFContractBase.sol](https://github.com/GaetanoMondelli/xtf/blob/main/contracts/ETFContractBase.sol): This contract lays the foundation for XTF tokens, encompassing the basic functionalities essential to the ecosystem.
- [ETFVote.sol](https://github.com/GaetanoMondelli/xtf/blob/main/contracts/ETFVote.sol): A straightforward implementation of an NFT, designed with a unique feature: it can only be burned by the Contract Owner (admin), facilitating the burning process when underlying asset tokens are released from the vault.
- [ETFContractV2.sol](https://github.com/GaetanoMondelli/xtf/blob/main/contracts/ETFContractV2.sol): Building upon ETFContractBase.sol and ETFVote.sol, this contract inherits and extends certain functionalities, primarily adaptations made to address size restrictions.

- [SidechainDeposit.sol](https://github.com/GaetanoMondelli/xtf/blob/main/contracts/SidechainDeposit.sol): A simpler version of ETFContractV2 designed for deployment on sidechains. This implementation focuses on storing assets in vaults and sending messages to the mainchain. However, it delegates the responsibility for releasing or burning vaults to ETFContractV2, awaiting messages to proceed with these actions.
- [ETFContractTypes.sol](https://github.com/GaetanoMondelli/xtf/blob/main/contracts/ETFContractTypes.sol):A comprehensive library containing all the struct definitions utilised by ETFContractBase, ETFContractV2, and SidechainDeposit.
- [NativeTokenWrapper.sol] (https://github.com/GaetanoMondelli/xtf/blob/main/contracts/ETFContractTypes.sol): This component is crucial for handling deposits of native currency in the XTF ecosystem. It utilises wrapped tokens, a key feature especially considering *future enhancements where gas expenses and LINK tokens used for messaging operations might be factored in as part of deposit contributions*. For development across various chains, reliable wrapped token solutions were essential. The specific of the wrapped tokens utilised can be found in the deployment scripts inside the 'scripts' folder of the repository (e.g [WMATIC for Mumbai](https://github.com/GaetanoMondelli/xtf/blob/c1a17034add8501557462b88c3775c98570aae27/scripts/deploy-side-polygon.ts#L23) )

Tests Contracts:

- [MockAggregator.sol](https://github.com/GaetanoMondelli/xtf/blob/main/contracts/MockAggregator.sol): Data Feed Aggregator mock for testing and local development
- [MockRouter.sol](https://github.com/GaetanoMondelli/xtf/blob/main/contracts/MockRouter.sol): CCIP Router Mock for testing and local development
- [MessageReceiver.sol](https://github.com/GaetanoMondelli/xtf/blob/main/contracts/MessageReceiver.sol) & [MessageSender](https://github.com/GaetanoMondelli/xtf/blob/main/contracts/MessageSender.sol): Trivial implementation of a sender and a receiver for testing purpose and understand CCIP processes                  
- [PolygonSender.sol](https://github.com/GaetanoMondelli/xtf/blob/main/contracts/PolygonSender.sol): Trivial implementation for sending DepositFund Messages from a Sidechain for testing purposes. 
- [LinkTokenInterface.sol](https://github.com/GaetanoMondelli/xtf/blob/main/contracts/LinkTokenInterface.sol): Mock implementation of the LINK token for testing LINK payments for CCIP

### Tryouts

IMPORTANT IF YOU WANT TO TRY THE WEB-APP:
**A full step by step guide on how to use the [demo web app](https://xtf.vercel.app/) is published [here]((https://github.com/GaetanoMondelli/xtf/blob/main/app-guide.md))**

- If you want to run scripts or test please refer to [README.md](https://github.com/GaetanoMondelli/xtf/blob/main/etf-app/README.md) of the repo

- `npm run test`: to run all hardhat tests to check the XTF protocol
- `npm run cheksize`: to check the size of the contracts
`npm run init`:  to run a local testchain, build the contracts and deploy them to the local chain (see [deploy.ts script](https://github.com/GaetanoMondelli/xtf/blob/main/scripts/deploy.ts))

## Challenges we ran into


Developing XTF presented several challenges. One major obstacle was the absence of mock contracts for certain Chainlink components, requiring me to deepen my understanding of these elements and create custom mocks from scratch.

Another significant challenge was adhering to the `MAXIMUM_BYTECODE_SIZE` limit set by the 'Spurious Dragon' hard fork. This limitation demanded continuous optimization and refactoring of our smart contracts. To manage the contract size effectively, I crafted a script that checked the size after each change, guiding my adjustments. Eventually, I divided the contract into three parts — a base contract, a types contract, and a third segment — to meet size constraints.

From a backend development perspective, crafting a user interface that supported seamless network switching across multiple chains was a complex task. The standard wallet connection model, which typically limits users to a single chain, posed a significant challenge in creating a unified and flexible user experience.

Lastly, producing a comprehensive video to explain the XTF protocol and demonstrate the web app within a five-minute timeframe proved to be a demanding task.

![checksize](https://github.com/GaetanoMondelli/xtf/blob/main/checksize.png?raw=true)



## Accomplishments that we're proud of

One of our project's major accomplishment was transforming the XTF protocol from a conceptual design to a fully operational set of smart contracts. This journey from initial sketches on paper to working code was both challenging and rewarding. It involved not only developing and testing a proof of concept using Hardhat but also swiftly building and launching a comprehensive website into a live environment, all within a matter of weeks.

Establishing a strong foundation for the protocol was crucial. It provided the flexibility needed for continuous improvements, allowing me to effortlessly integrate new features and make adjustments as required during the shift from testing to production. Adapting and refining the system to meet the demands of real-world applications proved to be one of the most exhilarating parts of this venture

![coffe](https://github.com/GaetanoMondelli/xtf/blob/main/etf-app/public/images/coffee.jpeg?raw=true)

(Yes I have spilled coffee on my notes multiple times)


## What we learned

One key takeaway from this project was the rapid learning and implementation of a complex protocol, especially in using three Chainlink services: Data Feed, CCIP, and VRF, with a particular emphasis on CCIP. Delving into CCIP was a journey into a sophisticated and effective solution for interoperability challenges in blockchain networks.

My experience as the inventor of the Overledger protocol [[3]](https://patents.google.com/patent/US20200311718A1/en), now known as Quant Overledger, laid the groundwork for understanding and managing the intricacies of cross-chain communication. Engaging with CCIP was an enriching experience and a highlight of my work. This project not only capitalized on my background in cross-chain systems but also broadened my expertise, particularly in harnessing Chainlink's technologies for practical applications



## What's next

Moving forward, the primary focus for XTF is a comprehensive refactoring of the smart contracts, including integrating Proxy Contracts for simplify code management and audits.

In addition to making ongoing improvements to XTF, I want to add some new features and addressing any issues in both the smart contract and website interface, as outlined here [TO-DO Github](https://github.com/GaetanoMondelli/xtf/blob/main/TO-DOs.md). XTF's roadmap includes enabling users to deposit non-fungible assets like ERC721 and ERC1155 into vaults, which will enhance liquidity utilizing Chainlink's NFT Floor Price Feeds. I am also implementing the option for users to withdraw assets from pre-minted vaults, offering more flexibility to the depositors. A thorough security audit of the protocol is planned to ensure its robustness and security after these features are implemented.

User feedback, gathered from share token holders and depositors, is essential in shaping the DAO functionality within XTF. I am currently exploring the implementation of a DAO-driven index rebalancing feature. Actively understanding and incorporating stakeholders' feedback is crucial to ensure that XTF aligns with the diverse needs and interests of all users.

Finally expanding my knowledge in Chainlink's Functions and in  Chainlink Proof of reserves, is another exciting direction. This could open up possibilities for integrating off-chain assets into decentralised ETFs, broadening the scope of XTF's offerings.
Perhaps XTF will be at the forefront of offering ETFs with traditional assets and crypto exposure, stepping ahead of major players like Blackrock and Fidelity. 

![news](https://github.com/GaetanoMondelli/xtf/blob/main/news.png?raw=true)


<!--  -->