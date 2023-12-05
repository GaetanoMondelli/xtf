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
FungibleToken deployed to: 0xcdf1913b4027D49596b935C0020d4671B3bbc3EA
FungibleToken deployed to: 0xd5BD4B6EfDCB3151291395B549444Fcc9e5E09fD
ETFToken deployed to: 0x5065510427b04E199c61dEeE91fD600520eA76Dd
ETFv2 deployed to: 0xb973c1ff930f796Afe8fe25e50FFF59e986517Fa
```
2. replace primary etf on side chain script, you can reuse the pre-deployed token from the primer
```
const primaryETFContractAddress = "0xC40E953DB5f27d077Cb1019B379131529c8D0E0D";
```
3. `npm run deploy-sidechain-mumbai `

```
Deploying side contracts with the account: 0x2E9891eC8C58986da8dC4173041cB9B1cdbaa35A
Deploying side contracts with the account: 0x2a1F5eB3e84e58e6F1e565306298B9dE1273f203
SidechainDeposit deployed to: 0x58F99A23d66Fe0546DA6e5e2C0174285681fc47e
```
4. Add consumers to VRF 
`https://vrf.chain.link/sepolia/7338` add 0xC40E953DB5f27d077Cb1019B379131529c8D0E0D


---

