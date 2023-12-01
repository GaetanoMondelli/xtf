
import { ethers } from "hardhat";
import { writeFileSync } from 'fs';
import { BigNumber } from "ethers";



const linkAddressMumbai = "0x326C977E6efc84E512bB9C30f76E30c160eD06FB";
const routerAddressMumbai = "0x70499c328e1e2a3c41108bd3730f6670a44595d1";
const sepSelectorId = BigNumber.from("16015286601757825753");
const mumbaiSelectorId = BigNumber.from("12532609583862916517");

const sepLinkToken = "0x779877A7B0D9E8603169DdbD7836e478b4624789"
const sepRouterAddress = "0xd0daae2231e9cb96b94c8512223533293c3693bf";


const messangerMumbai = "0xCb719becE7ff6a1c26a0BCBe14d7bEd18b3615e8";
const messangerSepolia = "0x6b670bB6C6a239D70f448A846483E54579943dFE";
const preDeployedSNXContractOnMumbai = "0xdE617C9DaDDF41EbD739cA57eBbA607C11ba902d";
const amountSNX = BigNumber.from(6).mul(BigNumber.from(10).pow(18));


async function main() {
    const accounts = await ethers.getSigners();
    console.log("Deploying side contracts with the account:", accounts[0].address);
    const contractName = "PolygonSenderReceiver";
    const contracts: any = {};
    const contractFactory = await ethers.getContractFactory(contractName as string);
    enum PayFeesIn {
        Native = 0,
        LINK = 1,
    }
    // // Deploy
    // const contract = await contractFactory.deploy(linkAddressMumbai, routerAddressMumbai);
    // // const contract = await contractFactory.deploy(sepLinkToken, sepRouterAddress);
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

    // // after deploy
    const contract = await ethers.getContractAt(contractName, messangerMumbai);

    // const linkContract = await ethers.getContractAt("FungibleToken", linkAddressMumbai);
    // const linkAmount = BigNumber.from(1).mul(BigNumber.from(10).pow(18));
    // const linkTransfer = await linkContract.transfer(messangerMumbai, linkAmount);
    // await linkTransfer.wait();
    // console.log("link transfered to messanger");

    // const receiver = messangerSepolia;
    // 0xC02764BbB073F877561B306708c6E7ABCCcf0a2A
    // const receiver = "0xb5969A5e0f10B56aE4e9B349C5edE226b7B9e3bA";
    const receiver = "0xc5a0C64598233e6D1f32BBf88B804922FE27dE2C";
    const preDeployedSNXContractOnMumbai = "0xdE617C9DaDDF41EbD739cA57eBbA607C11ba902d";
    const amountSNX = BigNumber.from(6).mul(BigNumber.from(10).pow(18));

    const depositFundMessage = {
        bundleId: 1,
        tokensToWrap: [
            {
                assetContract: preDeployedSNXContractOnMumbai,
                totalAmount: amountSNX,
                tokenId: 0,
                tokenType: 0,
            }
        ]
    }


    const payFeesIn = PayFeesIn.LINK
    const send = await contract.send(sepSelectorId, receiver, depositFundMessage, payFeesIn);
    const tx = await send.wait();
    console.log("send done");
    const events = tx.events;
    console.log(events);


    //  after send
    // const contractRead = await ethers.getContractAt(contractName, messangerSepolia);
    // // read data the public uint256 lastmsgnum;
    // const lastmsgnum = await contractRead.lastmsgnum();
    // const tokenwrap = await contractRead.tokenwrap();
    // const tokenwrapamount = await contractRead.tokenwrapamount();
    // console.log("lastmsgnum", lastmsgnum.toString());
    // console.log("tokenwrap", tokenwrap);
    // console.log("tokenwrapamount", tokenwrapamount.toString());


}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });






// Deploying side contracts with the account: 0x2a1F5eB3e84e58e6F1e565306298B9dE1273f203
// PolygonSenderReceiver deployed to: 0xb8a127ec044B258D331f55eCE86a50bdA2e2b77C
// {
//   "contractAddress": "0xb8a127ec044B258D331f55eCE86a50bdA2e2b77C",
//   "contractArgs": [
//     "0x326C977E6efc84E512bB9C30f76E30c160eD06FB",
//     "0x70499c328e1e2a3c41108bd3730f6670a44595d1"
//   ]
// }

//     PolygonSenderReceiver deployed to: 0x6b670bB6C6a239D70f448A846483E54579943dFE
// {
//   "contractAddress": "0x6b670bB6C6a239D70f448A846483E54579943dFE",
//   "contractArgs": [
//     "0x326C977E6efc84E512bB9C30f76E30c160eD06FB",
//     "0x70499c328e1e2a3c41108bd3730f6670a44595d1"
//   ]
// }