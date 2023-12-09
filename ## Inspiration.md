## Inspiration

The finance sector is currently buzzing with the potential of integrating cryptocurrencies, such as Bitcoin and Ethereum, into traditional ETFs, especially with firms like BlackRock and Fidelity leading the way.
This shift sparked my interest in exploring a decentralised variant for ETFs. The rise in demand for such financial instruments, coupled with the crucial need for transparency in the cryptocurrency market, set the stage for the development of XTF protocol.

The acronym 'XTF', (deX Traded Fund) interestingly flips 'FTX', reflecting on the recent downfall of the centralised exchanger. This collapse brought to light the risks and pitfalls of centralisation, underscoring the need for decentralised alternatives that offer enhanced security and openness.
While centralised crypto indexes like the Bitpanda Crypto Index (BCI) offer a way to invest in a diverse cryptocurrency portfolio, the value of a decentralised ecosystem stands out. It's about more than just another financial product; it's about creating an eco-system that encourages equitable participation from all stakeholders. Every participant, from the depositor to the token holder, has a clear role and sees the benefits of their involvement in a transparent and efficient manner.

## What it does

XTF, short for deX Traded Fund, reinvents traditional ETFs with a decentralized approach, utilizing blockchain technology for enhanced transparency, efficiency, and equity. Here’s how XTF operates:

1. **DAO-Driven Index Composition**: Initially, a Decentralised Autonomous Organization (DAO) decides the composition for the vaults, similar to how an index is created in traditional ETFs. This involves specifying the tokens and their quantities, ensuring a balanced and discrete asset distribution in each vault.

2. **Vault Formation and ETF Token Issuance**: Users contribute assets to these pre-defined vaults. ETF tokens are issued to depositors only once a vault has collected all the required assets, ensuring no disparity in asset distribution. The issuance of ETF tokens is proportional to each user's contribution, mirroring the vault's asset composition. To determine the value of each contribution accurately, XTF uses Chainlink Data Feeds. This ensures that the valuation of contributed assets is based on reliable, real-time market data. This is how ETF tokens are issued for this specific index.
The formula for calculating the number of ETF tokens minted for each user, considering multiple token types, is given as:



and the total number of  tokens minted for each vault is equal to:
![total](https://github.com/GaetanoMondelli/xtf/blob/main/total.png?raw=true)
![lyfecycle](https://github.com/GaetanoMondelli/xtf/blob/main/total.png?raw=true)
Where:
- \( T_{mu} \) represents the total ETF tokens minted and allocated to each user.
- \( T_{pv} \) is the total number of ETF tokens issued per vault.
- \( f \) is the protocol percentage fee.
- \( V_{ci} \) is the value of the \( i \)-th token contribution.
- \( P_{ti} \) is the price of the \( i \)-th token.
- \( V_{total} \) is the total value of contributions in the vault.
- \( m \) is the total number of token types contributed.

3. **Multiple Vaults in Various States for each Index**: The XTF ecosystem comprises multiple vaults, each at different stages – some may be open for contributions, while others might have reached their asset targets and have issued tokens and other may have been burned using the related ETF tokens to redeem the underlying assets. Please refer to the 'ETF Stats' tab of the website for insightful metrics related to the specific ETF index.

4. DAO Token and Chainlink VRF Lottery Mechanism: Upon the completion of a vault, a DAO token is issued through a lottery system powered by Chainlink VRF (Verifiable Random Function), ensuring a fair and transparent selection process. The probability of receiving this DAO token is proportional to the user's level of contribution. The DAO token itself is an NFT and cannot be burned directly by the holder. Instead, its burning occurs indirectly as a result of the vault redemption process. When a user redeems the assets from a vault, after a predefined locking period, using their ETF tokens, the smart contract automatically burns the related DAO NFT token. This indirect burning mechanism plays a crucial role in incentivising investors to keep their assets locked in vaults, thus enhancing the liquidity of ETF tokens.

While ETF tokens are used to represent contributions, the unique handling of the DAO NFT vote avoids the inefficiencies that could arise from overly granular voting in large, decentralized networks​​. By tying the burning of the DAO NFT to the redemption process, the XTF protocol ensures a balanced ecosystem where the dynamics of the tokens are carefully aligned with the goals of security, liquidity, and equitable participation.

5. **Simplified Cross-Chain Investment**: XTF enables exposure to diverse assets across various blockchains without the complexity of managing multiple wallets or navigating different blockchain environments. This simplifies the investment process, offering a convenient way to diversify portfolios.

6. **Cross-Chain Communication via Chainlink CCIP**: For seamless cross-chain communication, XTF leverages Chainlink Cross-Chain Interoperability Protocol (CCIP). This facilitates reliable and secure interactions between different blockchain networks within the XTF ecosystem.

7. **Token Redemption and Liquidity**: ETF token holders can redeem their tokens for the underlying assets in the vault, providing liquidity and flexibility. This feature allows investors to easily convert their token holdings back into the original assets. After a vault reaches completion, it generates a specific quantity of ETF tokens. These tokens are distributed proportionally among the contributors, with a portion also allocated for fees. The same quantity of ETF tokens issued becomes redeemable for the underlying assets after a predetermined locking period.

8. **Transparent and Equitable System**: Leveraging blockchain and smart contracts, XTF ensures complete transparency in asset management and distribution. All transactions and vault compositions are immutably recorded, fostering trust and clarity among participants.

Here a diagram that shows the lifecycle of each vault

![lyfecycle](https://github.com/GaetanoMondelli/xtf/blob/95f277cb9be09efdc8552cbdb6d209513ecf15f2/vault-lifecycle.png?raw=true)


## How we built it

The development journey of XTF during the hackathon began with the crafting of smart contracts in Solidity. Initially envisioned as a single-chain protocol, the primary goal was to rapidly develop and test the core functionalities. To facilitate this, I created mock interfaces for the DataFeed and employed Hardhat for initial testing, ensuring that the foundational aspects of the protocol were robust and functional. At this point the protocol was able to define vaults composition, receive deposits into vaults and once a vault had all the required resources, to mint tokens proportionally to each user. 




Recognizing the importance of reliability and security, I integrated vetted libraries for certain key functionalities. For instance, the management of vaults (sometimes referred to with the thirdweb terminology) was enhanced using the tokenbundle and Tokenstore from thirdweb. This approach significantly reduced risks and streamlined the development process.

As the project evolved, the focus shifted to implementing multi-chain functionality. This phase involved adding mock contracts for the Link token interface and the CCIP router. The addition of the vote lottery extraction brought in another layer, with the integration of a mock VRFCoordinator. A comprehensive suite of tests played a critical role, allowing me to validate the protocol's viability and quickly iterate through different versions and extensions.

With the core protocol functionality in place, attention turned to the user interface. I chose Next.js and React along with thirdweb for the frontend development. The user interface includes various graphical representations, powered by third-party libraries like Chart.js for pie charts (showcasing asset allocation) and ApexCharts.js for the bundle states' grid view.

Data displayed on the website is primarily sourced directly from the blockchain. Thirdweb providers were used for general data fetching, while QuickNode was employed for more intensive tasks. Bundle states and compositions are fetched using tailored methods, and the asset allocation percentages in the pie charts are derived from Chainlink price feeds. The only exception is the data used for index price comparisons in the normalized and logarithmic views, which are sourced from the Young Platform API.

The final step was deploying the project on Vercel, making it accessible for judges to review and interact with. While the deployment has been successful, the performance with multiple users accessing the website, particularly in terms of Vercel and blockchain provider capabilities, remains cautiously untested. Therefore, I have decided to keep the platform from public access for the time being, to ensure stability and optimal user experience.

## Challenges we ran into

## Accomplishments that we're proud of

## What we learned

## What's next for XTF
