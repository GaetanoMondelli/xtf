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
FungibleToken deployed to: 0xeC55089610216F34430f593FdD1251e94E4362a0
FungibleToken deployed to: 0x107A3dfc854565f29BAF17fD4bc7d698276e9f38
ETFToken deployed to: 0x6eed84AEEfAa04D45f1746737a801F4582719E8b
ETFv2 deployed to: 0xC40E953DB5f27d077Cb1019B379131529c8D0E0D
0xc40e953db5f27d077cb1019b379131529c8d0e0d
```
2. replace primary etf on side chain script, you can reuse the pre-deployed token from the primer
```
const primaryETFContractAddress = "0xC40E953DB5f27d077Cb1019B379131529c8D0E0D";
```
3. `npm run deploy-sidechain-mumbai `

```
Deploying side contracts with the account: 0x2E9891eC8C58986da8dC4173041cB9B1cdbaa35A
0x2a1F5eB3e84e58e6F1e565306298B9dE1273f203
SidechainDeposit deployed to: 0x0f8A8eDa76C1B2C1AfdB6698c1E0D3FbB94415e7
```
4. Add consumers to VRF 
`https://vrf.chain.link/sepolia/7338` add 0xC40E953DB5f27d077Cb1019B379131529c8D0E0D

---

