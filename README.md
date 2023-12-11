
## SCRIPTS

- `npm run test`: to run all hardhat tests
- `npm run cheksize`: to check the size of contracts
- `npm run init`: runs a localchain, build the contracts and deploy them to the local chain (see /scripts/deploy.ts script)

Refer to th script folder, `package.json`script section and  Deployment Section of this repository to deploy on public chains.

## Inspiration

The finance sector is currently buzzing with the potential of integrating cryptocurrencies, such as Bitcoin and Ethereum, into traditional ETFs, especially with firms like BlackRock and Fidelity leading the way.
This shift sparked my interest in exploring a decentralised variant for ETFs. The rise in demand for such financial instruments, coupled with the crucial need for transparency in the cryptocurrency market, set the stage for the development of XTF protocol.

The acronym 'XTF', (deX Traded Fund) interestingly flips 'FTX', reflecting on the recent downfall of the centralised exchanger. This collapse brought to light the risks and pitfalls of centralisation, underscoring the need for decentralised alternatives that offer enhanced security and openness.
While centralised crypto indexes like the Bitpanda Crypto Index (BCI) offer a way to invest in a diverse cryptocurrency portfolio, the value of a decentralised ecosystem stands out.


It's more than just another financial product; it's about creating an eco-system that encourages equitable participation from all stakeholders. Every participant, from the depositor to the ETF token holder, has a clear role and sees the benefits of their involvement in a transparent and efficient manner.


The XTF logo features a multi-layered cake, each layer representing a different asset, with the Ethereum symbol as the cherry on top. This design symbolises the ETF's composition, offering a 'slice' of diverse assets in a single, cohesive investment.

![logo](https://xtf.vercel.app/_next/image?url=%2Fimages%2Flogo3.png&w=128&q=75)

## What it does

XTF, short for deX Traded Fund, reinvents traditional ETFs with a decentralised approach using a [finite](https://en.wikipedia.org/wiki/Discrete_mathematics) index vault composition model.

In traditional finance, investors rely on a central entity to secure and manage the underlying assets of an ETF. This entity gathers all the necessary assets at once, creating a large, balanced bucket of assets and then fractionalises it into ETFs. 

In contrast, my decentralised approach breaks this process down into smaller, more manageable parts. 
Instead of accumulating all the assets for a comprehensive bucket, the protocol divided it into smaller vaults. Each vault requires the same proportional asset composition but in smaller quantities. This makes it easier for users to contribute to filling these vaults and allows them to quickly get their proportional share of ETF tokens (ERC20). 

Unlike traditional finance, this system also allows for the process to be reversed, where users can return their ETF tokens and redeem the underlying assets from the respective vaults.

We present the full xState (state machine) representation of the protocol. This will be further detailed and explained in an upcoming whitepaper.

![lyfecycle](https://github.com/GaetanoMondelli/xtf/blob/95f277cb9be09efdc8552cbdb6d209513ecf15f2/vault-lifecycle.png?raw=true)

Following this, let's delve into some of the key functionalities of the protocol:

- **DAO-Driven Index Composition**:  In the initial phase, a Decentralised Autonomous Organization (DAO) determines the composition of the vaults,. similar to how an index is created in traditional ETFs. This process includes defining the specific tokens and their quantities, aimed at achieving a balanced distribution of assets within each vault. Additionally, the DAO finalised key parameters such as the total number of available vaults, the token fractionalisation for vault (ETF tokens per vault), the required number of  tokens to redeem vault assets, and applicable fees.

- **User contribution**: Users possessing the assets specified in the index can deposit them into any of the vaults. This contributes to fulfilling the vault's asset quantity requirements. In return, they receive ETF share tokens and NFT Votes in proportion to their contributions.

- **ETF Token Issuance**: ETF tokens are issued to depositors only once a vault has collected all the required assets, ensuring no disparity in asset distribution in the overall ETF index. The issuance of ETF tokens is proportional to each user's contribution, mirroring the vault's asset composition. To determine the value of each contribution accurately, XTF uses **Chainlink Data Feeds**. This ensures that the valuation of contributed assets is based on reliable, real-time market data. 


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


- **Vaults Lyfecycle**:  Within an XTF Index, vaults exist at various stages of their lifecycle. Some vaults are OPEN, actively accepting contributions. Some vaults have received trusted  messages about deposits on external chains that needs to be processed. Others have achieved their asset targets and have issued tokens (MINTED). Meanwhile, certain vaults may have already been burned, with their underlying assets redeemed using the corresponding ETF tokens. Below is a diagram illustrating the lifecycle of each vault in the XTF protocol:

![states](https://github.com/GaetanoMondelli/xtf/blob/main/states2.png?raw=true)


- **Simplified Cross-Chain multi asset investment via Chainlink CCIP**:  XTF enables exposure to diverse assets across various blockchains without the complexity of managing multiple wallets or navigating different blockchain environments. This simplifies the investment process, offering a convenient way to diversify portfolios.  The protocol features cross-chain communication between two types of smart contracts: ETFContractV2.sol on the primary chain (referred as mainchain) and one or more SidechainDeposit.sol contracts on external chains (referred as sidechains).

On the mainchain, users deposit funds using the `depositFunds` method of ETFContractV2.sol, while on any sidechain, they use the SidechainDeposit.sol's `depositFundsAndNotify` method. This method authenticates deposits, updates vault balances, and sends out a `MessageDeposit` from a sidechain to the mainchain. These deposit messages are then received on the mainchain by ETFContractV2.sol through its _ccipReceive method and queued for later processing. Users can process these messages on the mainchain by invoking `updateBundleAfterReceive` on ETFContractV2.sol, which aligns the token quantities deposited on the sidechain with those on the mainchain. Finally when a bundle gets all the required tokens, it is locked for a set period (`lockTime`), 

After the lockTime expires, users with an adequate amount of ETF share tokens for a particular index can begin the redemption process. This step immediately releases the corresponding assets on the mainchain and burns the vault. Users can then use the `sendRedeemMessage` method to instruct all the involved sidechains to release assets on those chains, thus finalising the cross-chain redemption.

Deposit funds on sidechain flow (from Sidechain to Mainchain)
 

![DepositFundsAndNotify](https://github.com/GaetanoMondelli/xtf/blob/main/depositAndNotify.png?raw=true)


Redeem assets on sidechain (from Mainchain to Sidechain) 


![SendReedemMessage](https://github.com/GaetanoMondelli/xtf/blob/main/sendRedeemMessage.png?raw=true)


- **Vault's assets Redemption and Liquidity**: ETF token holders can redeem their tokens for the underlying assets in the vault, providing liquidity and flexibility. This feature allows investors to easily convert their token holdings back into the original assets. After a vault reaches completion, it generates a specific quantity of ETF tokens. These tokens are distributed proportionally among the contributors, with a portion also allocated for fees. Usually the same quantity of ETF tokens issued becomes redeemable for the underlying assets after a predetermined locking period.


- **DAO Token and Chainlink VRF 'Lottery' Mechanism**: When a vault is fully contributed to, a DAO NFT Vote is also issued, leveraging Chainlink VRF (Verifiable Random Function) to introduce a randomness element in the selection process. This ensures fairness and transparency, with the odds of receiving a DAO token being proportional to the user's contribution. Such random selection processes, similar to lotteries, are also found in Proof of Stake (PoS) consensus strategies and recently in the Proof of Transfer (PoT) used in the sBTC protocol [[2]](https://stacks-network.github.io/stacks/sbtc.pdf) 

The DAO token itself is an NFT but it cannot be burned directly by the holder. Instead, its burning occurs indirectly as a result of the vault redemption process. When a user redeems the assets from a vault, after a predefined locking period, using their ETF tokens, the smart contract automatically burns the related DAO NFT token. This indirect burning mechanism plays a crucial role in incentivising investors to keep their assets locked in vaults, thus enhancing the liquidity of ETF tokens.

While ETF tokens are used to represent contributions, the unique handling of the DAO NFT vote avoids the inefficiencies that could arise from overly granular voting in large, decentralised networks [[1]](https://arxiv.org/abs/2012.08313)​​. By tying the burning of the DAO NFT to the redemption process, the XTF protocol ensures a balanced ecosystem where the dynamics of the tokens are carefully aligned with the goals of security, liquidity, and equitable participation. 

[[1] See On Fairness in Voting Protocol](https://arxiv.org/abs/2012.08313)

[[2] sBTC Design of a Trustless Two-way Peg for Bitcoin](https://stacks-network.github.io/stacks/sbtc.pdf)


- **Transparent and Equitable System**: Leveraging blockchains and smart contracts, XTF ensures complete transparency in asset management and distribution. All transactions and vault compositions are immutably recorded, improving trust and clarity among participants.


## How we built it

The development journey of XTF during the hackathon began with the crafting of smart contracts in Solidity. Initially envisioned as a single-chain protocol, the primary goal was to rapidly develop and test the core functionalities. To facilitate this, I created mock interfaces for the DataFeed and employed Hardhat for initial testing, ensuring that the foundational aspects of the protocol were robust. 

At this point the protocol was able to define vaults composition, receive deposits into vaults and once a vault had all the required resources, to mint tokens proportionally to each user. 

Recognising the importance of reliability and security, I integrated vetted libraries for some key functionalities. For instance, the management of vaults (sometimes referred to Bundle) was enhanced using the [TokenBundle](https://portal.thirdweb.com/contracts/TokenBundle) and [TokenStore](https://portal.thirdweb.com/contracts/TokenStore) from Thirdweb. This approach significantly reduced risks, resulting also in an accelerated development process.

As the project evolved, the focus shifted to implementing multi-chain functionality. This phase involved adding mock contracts for the Link Token interface and the CCIP router. Finally the addition of the NFT Vote lottery extraction brought in another layer, with the integration of a mock  for VRFCoordinator. 
A comprehensive suite of tests played a critical role, allowing me to validate the protocol's viability and quickly iterate through different versions and extensions.

With the core protocol functionality in place, attention turned to the user interface. I chose NEXT.js and React along with ThirdWebUI for the frontend development. The user interface includes various graphical representations, powered by third-party libraries like Chart.js for pie charts (showcasing asset allocation) and ApexCharts.js for the bundle states' grid view.

Data displayed on the website is primarily sourced directly from the blockchain. **QuickNode** providers were used for blockchain data fetching. 
Bundle states and compositions were fetched using tailored methods (considering to move to theGraph like solutions!), and the asset allocation percentages in the pie charts are derived from Chainlink data feeds. 
The only exception is the data used for index price comparisons in the normalised and logarithmic views in the second tab which are sourced from the [Young Platform API](https://youngplatform.com/en/glossary/api/).

The final step was deploying the project on Vercel, making it accessible for judges to review and interact with (Soon, I will provide in website fake token asset faucets for judges' tryouts). While the deployment has been successful, the performance with multiple users accessing the website, particularly in terms of Vercel and blockchain provider capabilities, remains untested. 
For example during the demo, I realised that having multiple tabs on the website, each on different chains, results in a looping chain-change prompt. Therefore, I have decided to keep the platform from public access for the time being, to ensure stability and optimal user experience.
[webapp](https://xtf.vercel.app)

### List of all implemented smart contracts

- [ETFContractBase.sol](https://github.com/GaetanoMondelli/xtf/blob/main/contracts/ETFContractBase.sol): This contract lays the foundation for XTF tokens, encompassing the basic functionalities essential to the ecosystem.
- [ETFVote.sol](https://github.com/GaetanoMondelli/xtf/blob/main/contracts/ETFVote.sol): A straightforward implementation of an NFT, designed with a unique feature: it can only be burned by the Contract Owner (admin), facilitating the burning process when underlying asset tokens are released from the vault.
- [ETFContractV2.sol](https://github.com/GaetanoMondelli/xtf/blob/main/contracts/ETFContractV2.sol): Building upon ETFContractBase.sol and ETFVote.sol, this contract inherits and extends certain functionalities, primarily adaptations made to address size restrictions.

- [SidechainDeposit.sol](https://github.com/GaetanoMondelli/xtf/blob/main/contracts/SidechainDeposit.sol): A streamlined version of ETFContractV2 designed for deployment on sidechains. This implementation focuses on storing assets in vaults and sending messages to the mainchain. However, it delegates the responsibility for releasing or burning vaults to ETFContractV2, awaiting messages to proceed with these actions.
- [ETFContractTypes.sol](https://github.com/GaetanoMondelli/xtf/blob/main/contracts/ETFContractTypes.sol):A comprehensive library containing all the struct definitions utilised by ETFContractBase, ETFContractV2, and SidechainDeposit.
- [NativeTokenWrapper.sol] (https://github.com/GaetanoMondelli/xtf/blob/main/contracts/ETFContractTypes.sol): This component is crucial for handling deposits of native currency in the XTF ecosystem. It utilises wrapped tokens, a key feature especially considering *future enhancements where gas expenses and LINK tokens used for messaging operations might be factored in as part of deposit contributions*. For development across various chains, reliable wrapped token solutions were essential. The specific wrapping tokens utilised can be found in the addresses listed in the deployment scripts within the 'scripts' folder of the repository (e.g [WMATIC for Mumbai](https://github.com/GaetanoMondelli/xtf/blob/c1a17034add8501557462b88c3775c98570aae27/scripts/deploy-side-polygon.ts#L23)

Tests Contracts:

- [MockAggregator.sol](https://github.com/GaetanoMondelli/xtf/blob/main/contracts/MockAggregator.sol): Data Feed Aggregator mock for testing and local development
- [MockRouter.sol](https://github.com/GaetanoMondelli/xtf/blob/main/contracts/MockRouter.sol): CCIP Router Mock for testing and local development
- [MessageReceiver.sol](https://github.com/GaetanoMondelli/xtf/blob/main/contracts/MessageReceiver.sol) & [MessageSender](https://github.com/GaetanoMondelli/xtf/blob/main/contracts/MessageSender.sol): Trivial implementation of a sender and a receiver for testing purpose and understand CCIP processes                  
- [PolygonSender.sol](https://github.com/GaetanoMondelli/xtf/blob/main/contracts/PolygonSender.sol): Trivial implementation for sending DepositFund Messages from a Sidechain for testing purposes. 
- [LinkTokenInterface.sol](https://github.com/GaetanoMondelli/xtf/blob/main/contracts/LinkTokenInterface.sol): Mock implementation of the LINK token for testing LINK payments for CCIP

## Challenges we ran into

During the development of XTF, I encountered a series of challenges. A primary obstacle was the lack of mock contracts for certain Chainlink components. This required me to delve deeper into understanding how these components function and to build custom mocks from scratch. 

Another significant challenge was adhering to the `MAXIMUM_BYTECODE_SIZE` limit set by the 'Spurious Dragon' hard fork. This constraint necessitated continuous refactoring efforts. To comply, I often had to optimise our smart contracts, either by removing functions that conveniently displayed data or altering the visibility of certain fields. In the end, I had to divide the contract into three parts — a base contract and a types contract — to reduce the overall size. To manage this effectively, I developed a script that checked the contract size after each modification, informing me of the remaining bytes available (size check script).

As someone with more of a backend focus, creating a user interface that allowed seamless network switching was particularly challenging. My objective was to facilitate interactions across multiple chains within a single interface, but the standard wallet connection model limits users to one chain at a time. This proved to be a major obstacle in providing an integrated and versatile user experience. While a backend solution to serve auxiliary data from unconnected chains might be effective, I believe that future browser advancements will enable wallet connections to multiple chains simultaneously.

Last but not least, creating a comprehensive video to explain the XTF protocol and provide a complete walkthrough of the web app in only five minutes was hard, both in production and post-editing. The process was time-consuming and any small mistake often necessitated recapturing entire lengthy sequences. As a non-native English speaker, narrating the video swiftly and accurately proved to be odd and demanding too. 
![checksize](https://github.com/GaetanoMondelli/xtf/blob/main/checksize.png?raw=true)


## Accomplishments that we're proud of

One of the greatest achievements of this project was the journey from the conceptual design to its code implementation. I successfully moved the XTF protocol from the initial ideas on paper to fully functioning smart contract implementations. This progression involved not only developing and testing the proof of concept using Hardhat but also creating a comprehensive website and deploying it into a production environment in less than a few weeks. Building a solid foundation for the protocol was key. It allowed for continuous iteration, enabling me to seamlessly add new features or make necessary adjustments that surfaced during the transition from testing to production. The ability to adapt and refine the system in response to real-world application challenges was an exciting aspect of this process.

![coffe](https://github.com/GaetanoMondelli/xtf/blob/main/etf-app/public/images/coffee.jpeg?raw=true)

(Yes I have spilled coffee on my notes multiple times)


## What we learned

Among other things, one significant lesson from this project was quickly learning and implementing a complex protocol, particularly utilising three Chainlink services (Data Feed, CCIP, VRF) with a focus on CCIP.  Working with CCIP was an interesting journey into a mature and effective solution for the  interoperability chains problems.

My background as the inventor of the Overledger protocol [[3]](https://patents.google.com/patent/US20200311718A1/en), now known as Quant Overledger, an early example of cross-chain communication, gave me a foundation to understand and navigate the complexities of such technologies. Engaging with CCIP  was a valuable learning part of my work I'm especially proud of. This project not only leveraged my existing knowledge in cross-chain systems but also expanded it, particularly in understanding and applying Chainlink's solutions in the space.

## What's next

Looking ahead for XTF, my primary focus is on optimising the smart contracts. This will involve a detailed refactoring process, with an emphasis on introducing Proxy Contracts for enhanced manageability and audit simplicity (SRP -Single responsibility pattern). 

In addition to enhancing [XTF](https://xtf.vercel.app), we're focused on refining our platform by adding new functionalities and rectifying bugs in both the smart contract and the website interface, as detailed [here](https://github.com/GaetanoMondelli/xtf/blob/main/TO-DOs.md)
A key upcoming feature will allow users to deposit non-fungible assets (ERC721, ERC1155) into vaults. This will increase the liquidity of these assets, potentially leveraging tools like Chainlink's NFT Floor Price Feeds. Another critical enhancement includes enabling the withdrawal of assets from vaults before they're minted, thus offering users greater flexibility with their deposits. Alongside these developments, a thorough audit of the protocol will also be crucial to ensure its robustness and security.

To ensure our protocol meets the needs of its diverse user base, ongoing feedback from various stakeholders, including token holders and investors, remains a priority. Token holders, who seek to diversify their portfolios, and investors, who value the ease of managing assets across multiple chains, each have distinct needs and expectations. Recognising that these benefits alone may not fully address user requirements, we are actively seeking input to better tailor our services.
For instance, a key feature under consideration is the rebalancing of the index, a common practice in traditional ETFs. By engaging with a broad spectrum of users and understanding their perspectives, we aim to refine this aspect of the protocol to ensure it aligns with the interests and needs of all participants. This collaborative approach is crucial for developing a well-rounded, ecosystem-centric platform.

Finally expanding my knowledge in Chainlink's Functions and in  Chainlink Proof of reserves, is another exciting direction. This could open up possibilities for integrating off-chain assets into decentralised ETFs, broadening the scope of XTF's offerings.
Perhaps XTF will be at the forefront of offering ETFs with traditional assets and crypto exposure, stepping ahead of major players like Blackrock and Fidelity. 

![news](https://github.com/GaetanoMondelli/xtf/blob/main/news.png?raw=true)

---

#  Deployment Section

1. `npm run deploy-sepolia`

```
Deploying side contracts with the account: 0x2a1F5eB3e84e58e6F1e565306298B9dE1273f203
FungibleToken deployed to: 0x85325798FF4E6bd40B1766AEa13bFe1e3e586D75
FungibleToken deployed to: 0xA46139c16434029AAc2eae8a0323a0C6efF45297
ETFToken deployed to: 0xdf6B0C29d10dDa933Bc03DCe737376E7299c8996
ETFv2 deployed to: 0x2dB25eBf7917F7127f63fFbA388ce8c3504e89f5


```
2. replace primary etf on side chain script, you can reuse the pre-deployed token from the primer
```
const primaryETFContractAddress = "0x2dB25eBf7917F7127f63fFbA388ce8c3504e89f5";
```
3. `npm run deploy-sidechain-mumbai `

```
Deploying side contracts with the account: 0x2a1F5eB3e84e58e6F1e565306298B9dE1273f203
SidechainDeposit deployed to: 0x24521Ec44FEeC05F7a1Ec3268DC96Cbf9144F8Ac
```
4. Add consumers to VRF 
`https://vrf.chain.link/sepolia/7338` add 0x2a1F5eB3e84e58e6F1e565306298B9dE1273f203

5. Add to allowlist the sidechain contract to the main one
in the `script/connectSidechain.ts` replace with the current values: 
```
const primaryETFContractAddress = "0x6bF7fE3446aBd60f8DC4a1e8db07e504c38Ee592";
const secondaryETFContractAddress = "0x2872f4107E9234fC5d9066e5b30C175d94A66DEB";
```
and run `npm run connect-sidechain`

---

