import { BigNumber } from "@ethersproject/bignumber";
import { ethers } from "hardhat";
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
    let linkToken: any;
    let messageReceiver: any;
    let messageSender: any;
    let router: any;
    let sender: SignerWithAddress;
    let receiver: SignerWithAddress;

    const enum PayFeesIn {
        Native = 0,
        LINK = 1,
    }

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

        // mint 1000 mLINK to sender
        await linkToken.mint(sender.address, BigNumber.from("1000000000000000000000"));
        const balance = await linkToken.balanceOf(sender.address);
        expect(balance).toEqual(BigNumber.from("1000000000000000000000"));

        await router.setOnlyRouteTo(messageReceiver.address);

    });


    describe("deploy contracts", () => {
        it("should deploy a ETF and partner contracts", async () => {
            expect(linkToken.address).toBeDefined();
            expect(router.address).toBeDefined();
            expect(messageReceiver.address).toBeDefined();
            expect(messageSender.address).toBeDefined();
        });

        it("should send a message to the receiver contract", async () => {
            const message = "Hello World";
            const destinationAddress = 1234;
            const mockMessageId = '0x0000000000000000000000000000000000000000000000000000000000000000';

            // Create a promise that resolves when the event is emitted
            const eventPromise = new Promise<void>((resolve, reject) => {
                router.on("RouterMessageSent", (address: string, data: any) => {
                    try {
                        const dataString = ethers.utils.toUtf8String(data);
                        // console.log("RouterMessageSent", address, dataString);
                        expect(address).toEqual(messageReceiver.address);
                        expect(dataString).toContain(message);
                        resolve(); // Resolve the promise after assertions
                    } catch (error) {
                        reject(error); // Reject the promise if assertions fail
                    }
                    finally {
                        router.removeAllListeners("RouterMessageSent");
                    }
                });
            });

            const tx = await messageSender.send(destinationAddress, messageReceiver.address, message, PayFeesIn.Native);
            const receipt = await tx.wait();

            const eventSender = receipt.events?.find((e: any) => e.event === "MessageSent");
            expect(eventSender).toBeDefined();
            expect(eventSender.args).toBeDefined();
            expect(eventSender.args[0]).toEqual(mockMessageId);

            // Wait for the event promise to resolve
            await eventPromise;
        });



        it("should send a message to the receiver contract ", async () => {
            const mockMessageId = '0x0000000000000000000000000000000000000000000000000000000000000000';
            const message = "Hello World";
            const bytes32Message = ethers.utils.formatBytes32String(message);
            const fakeChainSelector = 0;

            const tx = await router.ccipReceive(
                {
                    messageId: mockMessageId,
                    sourceChainSelector: fakeChainSelector,
                    sender: sender.address,
                    data: bytes32Message,
                    destTokenAmounts: []
                }
            );

            const receipt = await tx.wait();
            // event named RouterMessageSent
            const eventSender = receipt.events?.find((e: any) => e.event === "RouterReceivedMessage");
            expect(eventSender).toBeDefined();
            expect(eventSender.args).toBeDefined();
            expect(eventSender.args[0]).toEqual(mockMessageId);
            expect(eventSender.args[1]).toEqual(sender.address);
            expect(eventSender.args[2]).toEqual(bytes32Message);

            // check the last message

            const lastMessage = await messageReceiver.getLatestMessageDetails();
            // console.log("lastMessage", lastMessage);
            expect(lastMessage[0]).toEqual(mockMessageId);
            expect(lastMessage[1]).toEqual(BigNumber.from(fakeChainSelector));
            expect(lastMessage[2]).toEqual(sender.address);
            expect(lastMessage[3]).toContain(message);
        });
    });
});



