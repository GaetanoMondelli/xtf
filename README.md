# XTF

## Project name

## Elevator pitch

## About the project
Be sure to write what inspired you, what you learned, how you built your project, and the challenges you faced. Format your story in Markdown.


## Built with
Languages, frameworks, platforms, cloud services, databases, APIs, etc.



## "Try it out" links

## Image gallery
JPG, PNG or GIF format, 5 MB max file size. For best results, use a 3:2 ratio.


## Video demo link


## Url to the piece of code that utilizes Chainlink (Github)


---

# Demo Deployment

1. `npm run deploy-sepolia`

```
Deploying side contracts with the account: 0x2a1F5eB3e84e58e6F1e565306298B9dE1273f203
FungibleToken deployed to: 0xFf0BD6Fd281A6fb51b586E97ae4bc152D60dE65c
FungibleToken deployed to: 0xCCd8465C8bc41E523372123C4e64b24ddC45222B
ETFToken deployed to: 0x41F3A0e775889897e2cfc5b535C0aEBB06C4a9F2
ETFv2 deployed to: 0xEafA5B2447E0Aa9cabf3e538d5b2e6F6f024bb9C
```
2. replace primary etf on side chain script, you can reuse the pre-deployed token from the primer
```
const primaryETFContractAddress = "0xC40E953DB5f27d077Cb1019B379131529c8D0E0D";
```
3. `npm run deploy-sidechain-mumbai `

```
Deploying side contracts with the account: 0x2E9891eC8C58986da8dC4173041cB9B1cdbaa35A
Deploying side contracts with the account: 0x2a1F5eB3e84e58e6F1e565306298B9dE1273f203
SidechainDeposit deployed to: 0x106d24F579D77fbe71CBBF169f6Dc376208e25b5
```
4. Add consumers to VRF 
`https://vrf.chain.link/sepolia/7338` add 0xC40E953DB5f27d077Cb1019B379131529c8D0E0D


---

