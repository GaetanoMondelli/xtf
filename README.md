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

