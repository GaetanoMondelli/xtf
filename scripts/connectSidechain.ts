
import { ethers } from "hardhat";
import { writeFileSync } from 'fs';
import { BigNumber } from "ethers";



const linkAddressMumbai = "0x326C977E6efc84E512bB9C30f76E30c160eD06FB";
const routerAddressMumbai = "0x70499c328e1e2a3c41108bd3730f6670a44595d1";
const sepSelectorId = BigNumber.from("16015286601757825753");
const mumbaiSelectorId = BigNumber.from("12532609583862916517");

const amoySelectorId = BigNumber.from("16281711391670634445");

const sepLinkToken = "0x779877A7B0D9E8603169DdbD7836e478b4624789"
const sepRouterAddress = "0xd0daae2231e9cb96b94c8512223533293c3693bf";


const messangerMumbai = "0x735770Bd277473058B35b4D9Ad005b0C874cEB31";
const messangerSepolia = "0xB8C88Fc9ff63E01b0C535Fd75408E81d2CD17ea7";

async function main() {
    const accounts = await ethers.getSigners();
    // const contractName = "PolygonSenderReceiver";
    // const contracts: any = {};
    // const contractFactory = await ethers.getContractFactory(contractName as string);
    // enum PayFeesIn {
    //     Native = 0,
    //     LINK = 1,
    // }
    // Deploy
    // const contract = await contractFactory.deploy(linkAddressMumbai, routerAddressMumbai);
    // const contract = await contractFactory.deploy(sepLinkToken, sepRouterAddress);
    // contracts[contractName] = [contract];
    // console.log(`${contractName} deployed to: ${contracts[contractName][
    //     contracts[contractName].length - 1
    // ].address}`);
    // // write to file
    // const contractAddress = contracts[contractName][0].address;
    // const contractAbi = contracts[contractName][0].abi;
    // const contractArgs = [linkAddressMumbai, routerAddressMumbai];
    // const contractObj = {
    //     contractAddress,
    //     contractAbi,
    //     contractArgs
    // }
    // const contractObjStr = JSON.stringify(contractObj, null, 2);
    // console.log(contractObjStr);
    // writeFileSync("test-messanger-mumbai.json", JSON.stringify(contracts, null, 2));


    // PolygonSenderReceiver deployed to: 0x735770Bd277473058B35b4D9Ad005b0C874cEB31
    // {
    //   "contractAddress": "0x735770Bd277473058B35b4D9Ad005b0C874cEB31",
    //   "contractArgs": [
    //     "0x326C977E6efc84E512bB9C30f76E30c160eD06FB",
    //     "0x70499c328e1e2a3c41108bd3730f6670a44595d1"
    //   ]
    // PolygonSenderReceiver deployed to: 0xB8C88Fc9ff63E01b0C535Fd75408E81d2CD17ea7
    // {
    //   "contractAddress": "0xB8C88Fc9ff63E01b0C535Fd75408E81d2CD17ea7",
    //   "contractArgs": [
    //     "0x326C977E6efc84E512bB9C30f76E30c160eD06FB",
    //     "0x70499c328e1e2a3c41108bd3730f6670a44595d1"
    //   ]
    // }

    // after deploy
    // const contract = await ethers.getContractAt(contractName, messangerMumbai);

    // const linkContract = await ethers.getContractAt("FungibleToken", linkAddressMumbai);
    // const linkAmount = BigNumber.from(1).mul(BigNumber.from(10).pow(18));
    // const linkTransfer = await linkContract.transfer(messangerMumbai, linkAmount);
    // await linkTransfer.wait();
    // console.log("link transfered to messanger");

    // const receiver = messangerSepolia;
    // const data = BigNumber.from(421);
    // const payFeesIn = PayFeesIn.LINK
    // const send = await contract.send(sepSelectorId, receiver, data, payFeesIn);
    // const tx = await send.wait();
    // console.log("send done");
    // const events = tx.events;
    // console.log(events);


    //  after send
    // const contractRead = await ethers.getContractAt(contractName, messangerSepolia);
    // // read data the public uint256 lastmsgnum;
    // const lastmsgnum = await contractRead.lastmsgnum();
    // console.log("lastmsgnum", lastmsgnum.toString());

    const contractName = "ETFv2";
    const primaryETFContractAddress = "0x2dB25eBf7917F7127f63fFbA388ce8c3504e89f5";
    const secondaryETFContractAddress = "0x24521Ec44FEeC05F7a1Ec3268DC96Cbf9144F8Ac";
    console.log("Deploying side contracts with the account:", accounts[0].address);
    // const sideContractName = "SidechainDeposit";
    const contract = await ethers.getContractAt(contractName, primaryETFContractAddress);
    // const sideContract = await ethers.getContractAt(sideContractName, "0x0b3A4FA2eBc31F932a9A4CE83E3ba217AEeF4281");

    // const tx = await contract.setSideChainAddress(mumbaiSelectorId, secondaryETFContractAddress);
    const tx = await contract.setSideChainAddress(amoySelectorId, secondaryETFContractAddress);

    // const tx = await contract.setBaseTokenURI("https://gaetanomondelli.github.io/static/media/gman2.f52db750.png");
    await tx.wait();
    console.log("setSideChainAddress done");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
