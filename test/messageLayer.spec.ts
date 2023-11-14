import { BigNumber } from "@ethersproject/bignumber";
import { ethers } from "hardhat";
import {
    MultiWrapBase,
    ITokenBundle,
} from "../typechain-types/contracts/MultiWrapBase";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("ChainLink CCIP Message layer", () => {
    const fungibleTokenName = "FungibleToken";
    const messageReceiverContractName = "BasicMessageReceiver";
    const messageSenderContractName = "BasicMessageSender";
    const mockRouterContractName = "MockRouterClient";
    let FungibleTokenFactory: any;
    let MessageReceiverContractFactory: any;
    let MessageSenderContractFactory: any;
    let MockRouterContractFactory: any;
    let router: any;
    let linkToken: any;
    let messageReceiver: any;
    let messageSender: any;
    let sender: SignerWithAddress;
    let receiver: SignerWithAddress;

    beforeEach(async () => {
        [sender, receiver] = await ethers.getSigners();
        MessageReceiverContractFactory = await ethers.getContractFactory(
            messageReceiverContractName
        );
        MessageSenderContractFactory = await ethers.getContractFactory(
            messageSenderContractName
        );
        MockRouterContractFactory = await ethers.getContractFactory(
            mockRouterContractName
        );

        FungibleTokenFactory = await ethers.getContractFactory(
            fungibleTokenName
        );

        linkToken = await FungibleTokenFactory.deploy(
            'mLINK', 'mLINK'
        );
        router = await MockRouterContractFactory.deploy();
        messageReceiver = await MessageReceiverContractFactory.deploy(
            router.address
        );
        messageSender = await MessageSenderContractFactory.deploy(
            router.address,
            linkToken.address
        );

    });


    describe("deploy contracts", () => {
        it("should deploy a ETF and partner contracts", async () => {
            expect(linkToken.address).toBeDefined();
            expect(router.address).toBeDefined();
            expect(messageReceiver.address).toBeDefined();
            expect(messageSender.address).toBeDefined();
        });

    });
});


