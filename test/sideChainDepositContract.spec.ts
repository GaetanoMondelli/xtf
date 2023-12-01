import { BigNumber } from "@ethersproject/bignumber";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";


describe("ChainLink CCIP Message layer", () => {
    const nativeAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
    const fungibleTokenName = "FungibleToken";
    const nativeWrapperContractName = "NativeTokenWrapper";
    const etfContractName = "ETFv2";
    // const royaltyBps = 1000;
    const etfTokenContractName = "ETFToken";
    const etfTokenPerWrap = 100;
    const fee = 0;
    const priceLinkToken = 5;
    const mockPrimaryChainSelectorId = 0;
    const mockSecondaryChainSelectorId = 1;

    const mockMessgaeId = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const messageSideChainDepositName = "SidechainDeposit";
    const mockRouterContractName = "MockRouterClient";
    const priceAggregatorContractName = "MockAggregator";

    const primaryChainSelectorId = 0;
    let FungibleTokenFactory: any;
    let MessageSideChainContractFactory: any;
    let MockRouterContractFactory: any;
    let NativeTokenWrapperFactory: any;
    let PriceAggregatorContractFactory: any;
    let EtfTokenContractFactory: any;
    let EtfContractFactory: any;
    let priceAggregatorLinkToken: any;
    let linkToken: any;
    const ETFURI = "https://example.com";
    let sideChainDepositContract: any;
    let router: any;
    let owner: SignerWithAddress;
    let sender: SignerWithAddress;
    let receiver: SignerWithAddress;
    let nativeTokenWrapper: any;
    let etfTokenContract: any;
    let etfPrimaryContract: any;


    const enum PayFeesIn {
        Native = 0,
        LINK = 1,
    }

    beforeEach(async () => {
        [owner, sender, receiver] = await ethers.getSigners();
        // MessageReceiverContractFactory = await ethers.getContractFactory(
        //     messageReceiverContractName
        // );
        NativeTokenWrapperFactory = await ethers.getContractFactory(nativeWrapperContractName);
        EtfContractFactory = await ethers.getContractFactory(etfContractName);
        EtfTokenContractFactory = await ethers.getContractFactory(etfTokenContractName);
        PriceAggregatorContractFactory = await ethers.getContractFactory(priceAggregatorContractName);
        etfTokenContract = await EtfTokenContractFactory.deploy();

        MessageSideChainContractFactory = await ethers.getContractFactory(
            messageSideChainDepositName
        );
        MockRouterContractFactory = await ethers.getContractFactory(
            mockRouterContractName
        );

        FungibleTokenFactory = await ethers.getContractFactory(
            fungibleTokenName
        );

        nativeTokenWrapper = await NativeTokenWrapperFactory.deploy(
            "NativeTokenWrapper",
            "NTW"
        );

        linkToken = await FungibleTokenFactory.deploy(
            'mLINK', 'mLINK'
        );
        router = await MockRouterContractFactory.deploy();


        priceAggregatorLinkToken = await PriceAggregatorContractFactory.deploy(
            priceLinkToken, 8
        );

        const tokenAmounts = [
            {
                chainIdSelector: mockPrimaryChainSelectorId,
                assetContract: linkToken.address,
                amount: 10,
                oracleAddress: priceAggregatorLinkToken.address,
            },
        ];


        const eTFTokenOptions = {
            nativeTokenWrapper: nativeTokenWrapper.address,
            uriETFToken: ETFURI,
            etfTokenAddress: etfTokenContract.address,
            etfTokenPerWrap: etfTokenPerWrap,
            percentageFee: fee
        }

        const chainLinkData = {
            router: router.address,
            link: linkToken.address,
            currentChainSelectorId: mockPrimaryChainSelectorId,
            subscriptionId: 1,
            vrfCoordinator: linkToken.address,
            keyHash: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc"
        }

        etfPrimaryContract = await EtfContractFactory.deploy(
            "ETF-v0.0.3",
            "ETF",
            tokenAmounts,
            eTFTokenOptions,
            chainLinkData,
        );

        const sideChainTokenAmounts = [
            {
                assetContract: linkToken.address,
                amount: 10,
            }
        ];

        sideChainDepositContract = await MessageSideChainContractFactory.deploy(
            primaryChainSelectorId,
            mockSecondaryChainSelectorId,
            etfPrimaryContract.address,
            router.address,
            linkToken.address,
            nativeTokenWrapper.address,
            sideChainTokenAmounts
        );

        // mint 1000 mLINK to sender
        await linkToken.mint(sender.address, BigNumber.from("1000000000000000000000"));
        const balance = await linkToken.balanceOf(sender.address);
        expect(balance).toEqual(BigNumber.from("1000000000000000000000"));
        await etfTokenContract.connect(owner).setOwner(etfPrimaryContract.address);
        await router.setOnlyRouteTo(etfPrimaryContract.address);

    });


    describe("deploy contracts", () => {
        it("should deploy a ETF and partner contracts", async () => {
            expect(etfPrimaryContract.address).toBeDefined();
            expect(sideChainDepositContract.address).toBeDefined();
            expect(linkToken.address).toBeDefined();
            expect(router.address).toBeDefined();
        });

        it("should send a message to the primary contract on primary chain when deposit funds", async () => {
            const tokenStruct = {
                assetContract: linkToken.address,
                tokenType: 0,
                tokenId: 0,
                totalAmount: 10,
            };
            const bundleId = 12;

            const checkRouterTestPromise = new Promise<void>((resolve, reject) => {
                router.on("RouterMessageSent", (address: string, data: any) => {
                    try {
                        const depositFundMessageType = ['tuple(uint256,tuple(address,uint8,uint256,uint256)[])'];
                        const decoded = ethers.utils.defaultAbiCoder.decode(depositFundMessageType, data);
                        expect(decoded).toBeDefined();
                        expect(decoded).toBeDefined();
                        expect(decoded.length).toEqual(1);
                        expect(decoded[0][0]).toEqual(BigNumber.from(bundleId));
                        const token = decoded[0][1][0];
                        const decodedTokenStruct = {
                            assetContract: token[0],
                            tokenType: token[1],
                            tokenId: BigNumber.from(token[2]).toNumber(),
                            totalAmount: BigNumber.from(token[3]).toNumber(),
                        };
                        expect(decodedTokenStruct).toEqual(tokenStruct);
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                    finally {
                        router.removeAllListeners("RouterMessageSent");
                    }
                });
            });

            await linkToken.connect(sender).approve(sideChainDepositContract.address, BigNumber.from(100));
            await router.setOnlyRouteTo(etfPrimaryContract.address);

            const tx = await sideChainDepositContract.connect(sender).depositFundsAndNotify(
                bundleId,
                [tokenStruct],
                PayFeesIn.Native,
                false
            );

            const receipt = await tx.wait();

            const event = receipt.events?.find(
                (e: any) => e.event === "MessageSent"
            );

            expect(event).toBeDefined();
            expect(event.args?.[0]).toEqual(mockMessgaeId);
            await checkRouterTestPromise;
        });


        it("should receive a message from the primary contract to release funds when reedemed", async () => {
            const mockMessageId = '0x0000000000000000000000000000000000000000000000000000000000000000';
            const tokenStruct = {
                assetContract: linkToken.address,
                tokenType: 0,
                tokenId: 0,
                totalAmount: 10,
            };
            const bundleId = 12;
            const balanceSenderLinkTokenBeforeDeposit = await linkToken.balanceOf(sender.address);
            await linkToken.connect(sender).approve(sideChainDepositContract.address, BigNumber.from(100));
            await sideChainDepositContract.connect(sender).depositFundsAndNotify(
                bundleId,
                [tokenStruct],
                PayFeesIn.Native,
                false
            );
            const balanceSenderLinkTokenAfterDeposit = await linkToken.balanceOf(sender.address);

            // Router sends message from primary contract with a reedem message 
            // to the sidechain contract to release funds to the receiver

            const ReedemETFMessage = {
                bundleId: bundleId,
                receiver: receiver.address
            }

            const balanceReceiverLinkTokenBeforeReedemMessage = await linkToken.balanceOf(receiver.address);

            const encodedData = ethers.utils.defaultAbiCoder.encode(
                ['tuple(uint256,address)'],
                [[ReedemETFMessage.bundleId, ReedemETFMessage.receiver]]
            );
            // Message from Primary contract -> Sidechain contract
            await router.setOnlyRouteTo(sideChainDepositContract.address);
            await router.ccipReceive(
                {
                    messageId: mockMessageId,
                    sourceChainSelector: mockSecondaryChainSelectorId,
                    sender: etfPrimaryContract.address,
                    data: encodedData,
                    destTokenAmounts: []
                }
            );

            const balanceReceiverLinkTokenAfterReedemMessage = await linkToken.balanceOf(receiver.address);

            expect(balanceSenderLinkTokenAfterDeposit).toEqual(balanceSenderLinkTokenBeforeDeposit.sub(tokenStruct.totalAmount));
            expect(balanceReceiverLinkTokenAfterReedemMessage).toEqual(balanceReceiverLinkTokenBeforeReedemMessage.add(tokenStruct.totalAmount));

        });
    });
});