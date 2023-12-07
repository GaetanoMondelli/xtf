import { BigNumber } from "@ethersproject/bignumber";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

export enum PayFeesIn {
    Native = 0,
    LINK = 1,
}

describe("ETFContract", () => {
    const nativeAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
    const etfTokenContractName = "ETFToken";
    const nativeWrapperContractName = "NativeTokenWrapper";
    const etfContractName = "ETFv2";
    const fungibleTokenName = "FungibleToken";
    const priceAggregatorContractName = "MockAggregator";
    const mockRouterContractName = "MockRouterClient";
    const mockVRFCoordinatorV2Name = "VRFCoordinatorV2Mock";
    const ETFURI = "https://example.com";
    // const royaltyBps = 1000;
    const fee = 0;
    const etfTokenPerWrap = BigNumber.from(100).mul(BigNumber.from(10).pow(18));
    const priceDecimals = 8;
    const priceTokenToBeWrapped1 = 1345612360;
    const priceTokenToBeWrapped2 = 299528477;
    const sideChainTokenToBeWrapped1 = 15;
    const priceNativeToken = 196741624297;
    const mockChainSelectorId = 0;

    let etfTokenContract: any;
    let etfContract: any;
    let owner: SignerWithAddress;
    let etfOwner: SignerWithAddress;
    let etfOwner2: SignerWithAddress;
    let MockRouterContractFactory: any;
    let FungibleTokenFactory: any;
    let NativeTokenWrapperFactory: any;
    let PriceAggregatorContractFactory: any;
    let VRFCoordinatorV2MockContractFactory: any;
    let EtfContractFactory: any;
    let EtfTokenContractFactory: any;
    let nativeTokenWrapper: any;
    let priceAggregatorNativeTokenWrapper: any;
    let tokenToBeWrapped1: any;
    let priceAggregatortokenToBeWrapped1: any;
    let tokenToBeWrapped2: any;
    let priceAggregatortokenToBeWrapped2: any;
    let router: any;
    let vrFCoordinatorV2: any;
    let subscriptionId: any;
    let totalValue: any;
    let tokenPrices: any;

    beforeEach(async () => {
        [owner, etfOwner, etfOwner2] = await ethers.getSigners();
        NativeTokenWrapperFactory = await ethers.getContractFactory(nativeWrapperContractName);
        FungibleTokenFactory = await ethers.getContractFactory(fungibleTokenName);
        EtfTokenContractFactory = await ethers.getContractFactory(etfTokenContractName);
        EtfContractFactory = await ethers.getContractFactory(etfContractName);
        PriceAggregatorContractFactory = await ethers.getContractFactory(priceAggregatorContractName);
        MockRouterContractFactory = await ethers.getContractFactory(mockRouterContractName);
        VRFCoordinatorV2MockContractFactory = await ethers.getContractFactory(mockVRFCoordinatorV2Name);

        tokenToBeWrapped1 = await FungibleTokenFactory.deploy(
            "TokenToWrapped1",
            "TW1"
        );

        priceAggregatortokenToBeWrapped1 = await PriceAggregatorContractFactory.deploy(
            priceTokenToBeWrapped1, priceDecimals
        );

        tokenToBeWrapped2 = await FungibleTokenFactory.deploy(
            "TokenToWrapped2",
            "TW2"
        );

        priceAggregatortokenToBeWrapped2 = await PriceAggregatorContractFactory.deploy(
            priceTokenToBeWrapped2, priceDecimals
        );

        nativeTokenWrapper = await NativeTokenWrapperFactory.deploy(
            "NativeTokenWrapper",
            "NTW"
        );

        priceAggregatorNativeTokenWrapper = await PriceAggregatorContractFactory.deploy(
            priceNativeToken, priceDecimals
        );

        etfTokenContract = await EtfTokenContractFactory.deploy();

        router = await MockRouterContractFactory.deploy();

        vrFCoordinatorV2 = await VRFCoordinatorV2MockContractFactory.deploy(0, 0);

        let subscriptionIdTx = await vrFCoordinatorV2.createSubscription();

        let subscription = await subscriptionIdTx.wait();
        subscriptionId = subscription.events[0].args['subId'];

        console.log('subscriptionId', subscriptionId);

        await vrFCoordinatorV2.connect(owner).fundSubscription(subscriptionId, BigNumber.from(10).pow(18).mul(100));

        const tokenAmounts = [
            {
                chainIdSelector: mockChainSelectorId,
                assetContract: nativeAddress,
                amount: ethers.utils.parseEther("0.5"),
                oracleAddress: priceAggregatorNativeTokenWrapper.address,
            },
            {
                chainIdSelector: mockChainSelectorId,
                assetContract: tokenToBeWrapped1.address,
                amount: BigNumber.from(10).mul(BigNumber.from(10).pow(18)),
                oracleAddress: priceAggregatortokenToBeWrapped1.address,
            },
            {
                chainIdSelector: mockChainSelectorId,
                assetContract: tokenToBeWrapped2.address,
                amount: BigNumber.from(20).mul(BigNumber.from(10).pow(18)),
                oracleAddress: priceAggregatortokenToBeWrapped2.address,
            },
        ];

        tokenPrices = [
            {
                assetContract: nativeAddress,
                amount: priceNativeToken,
            },
            {
                assetContract: tokenToBeWrapped1.address,
                amount: priceTokenToBeWrapped1,
            },
            {
                assetContract: tokenToBeWrapped2.address,
                amount: priceTokenToBeWrapped2,
            },
        ];

        totalValue = BigNumber.from(0);

        for (let i = 0; i < tokenAmounts.length; i++) {
            const tokenAmount = tokenAmounts[i];
            const tokenPrice = tokenPrices[i];
            totalValue = totalValue.add(tokenAmount.amount.mul(tokenPrice.amount));
            console.log('totalValue', tokenAmount.amount, tokenPrice.amount, totalValue.toString());
        }

        const eTFTokenOptions = {
            nativeTokenWrapper: nativeTokenWrapper.address,
            uriETFToken: ETFURI,
            etfTokenAddress: etfTokenContract.address,
            etfTokenPerWrap: etfTokenPerWrap,
            percentageFee: fee
        }

        const chainLinkData = {
            router: router.address,
            link: tokenToBeWrapped2.address,
            currentChainSelectorId: mockChainSelectorId,
            subscriptionId: subscriptionId,
            vrfCoordinator: vrFCoordinatorV2.address,
            keyHash: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc"
        }

        etfContract = await EtfContractFactory.deploy(
            "ETF-v0.0.3",
            "ETF",
            tokenAmounts,
            eTFTokenOptions,
            chainLinkData
        );

        await etfTokenContract.connect(owner).setOwner(etfContract.address);
        await router.setOnlyRouteTo(etfContract.address);
        await vrFCoordinatorV2.addConsumer(subscriptionId, etfContract.address);
    });

    describe("deploy contracts", () => {
        it("should deploy a ETF and partner contracts", async () => {
            expect(etfContract.address).toBeDefined();
            expect(nativeTokenWrapper.address).toBeDefined();
            expect(etfTokenContract.address).toBeDefined();
            expect(tokenToBeWrapped2.address).toBeDefined();
            expect(tokenToBeWrapped1.address).toBeDefined();
        });

        it("should satisfy initial conditions", async () => {
            const totalSupply = await etfTokenContract.totalSupply();
            expect(totalSupply).toEqual(BigNumber.from(0));
            const states = await etfContract.returnStateOfBundles(0, 96);
            const nextTokenIdToMint = await etfContract.nextTokenIdToMint();
            const isEtfBurned = await etfContract.isETFBurned(0);
            expect(isEtfBurned).toBeFalsy();
        }
        );

        describe("mint ETF", () => {
            it.skip("should prevent to invoke ETF wrap function from an eoa", async () => {
                // removed wrap function from etf contract
                const uriForWrappedToken = "https://example.com";

                const tokenStruct = {
                    assetContract: tokenToBeWrapped1.address,
                    tokenType: 0,
                    tokenId: 0,
                    totalAmount: 100,
                };
                await expect(
                    etfContract
                        .connect(owner)
                        .wrap([tokenStruct], uriForWrappedToken, owner.address)
                ).rejects.toThrow(
                    "VM Exception while processing transaction: reverted with reason string 'ETFContract: wrap from eoa is not allowed'"
                );
            });

            it.skip("should mint an ETF", async () => {
                const amountToWrapToken1 = BigNumber.from(10).mul(BigNumber.from(10).pow(18));
                const amountToWrapToken2 = BigNumber.from(20).mul(BigNumber.from(10).pow(18));
                const ethersToWrap = ethers.utils.parseEther("0.5");

                const nativeTokenStruct = {
                    assetContract: nativeAddress,
                    tokenType: 0,
                    tokenId: 0,
                    totalAmount: ethersToWrap,
                };

                const tokenStruct1 = {
                    assetContract: tokenToBeWrapped1.address,
                    tokenType: 0,
                    tokenId: 0,
                    totalAmount: amountToWrapToken1,
                };

                const tokenStruct2 = {
                    assetContract: tokenToBeWrapped2.address,
                    tokenType: 0,
                    tokenId: 0,
                    totalAmount: amountToWrapToken2,
                };

                await tokenToBeWrapped1.connect(owner).mint(etfOwner.address, amountToWrapToken1);
                await tokenToBeWrapped2.connect(owner).mint(etfOwner.address, amountToWrapToken2);
                await tokenToBeWrapped1.connect(etfOwner).approve(
                    etfContract.address,
                    amountToWrapToken1
                );
                await tokenToBeWrapped2.connect(etfOwner).approve(
                    etfContract.address,
                    amountToWrapToken2
                );


                await etfContract
                    .connect(etfOwner)
                    .mint(etfOwner.address, [nativeTokenStruct, tokenStruct1, tokenStruct2], {
                        value: ethersToWrap,
                    });

                const etfTokensBalance = await etfTokenContract.balanceOf(etfOwner.address);
                const diff = etfTokenPerWrap.sub(etfTokensBalance);
                expect(diff.lte(BigNumber.from(1))).toBeTruthy();
            });


            it("should reedem and burn an ETF", async () => {
                const bundleId = 0;
                const amountToWrapToken1 = BigNumber.from(10).mul(BigNumber.from(10).pow(18));
                const amountToWrapToken2 = BigNumber.from(20).mul(BigNumber.from(10).pow(18));;
                const ethersToWrap = ethers.utils.parseEther("0.5");

                const nativeTokenStruct = {
                    assetContract: nativeAddress,
                    tokenType: 0,
                    tokenId: 0,
                    totalAmount: ethersToWrap,
                };

                const tokenStruct1 = {
                    assetContract: tokenToBeWrapped1.address,
                    tokenType: 0,
                    tokenId: 0,
                    totalAmount: amountToWrapToken1,
                };

                const tokenStruct2 = {
                    assetContract: tokenToBeWrapped2.address,
                    tokenType: 0,
                    tokenId: 0,
                    totalAmount: amountToWrapToken2,
                };

                await tokenToBeWrapped1.connect(owner).mint(etfOwner.address, amountToWrapToken1.mul(2));
                await tokenToBeWrapped2.connect(owner).mint(etfOwner.address, amountToWrapToken2.mul(2));

                await tokenToBeWrapped1.connect(etfOwner).approve(
                    etfContract.address,
                    BigNumber.from(amountToWrapToken1.mul(2))
                );
                await tokenToBeWrapped2.connect(etfOwner).approve(
                    etfContract.address,
                    BigNumber.from(amountToWrapToken2.mul(2))
                );


                await etfContract.connect(etfOwner).depositFunds(
                    bundleId,
                    [nativeTokenStruct, tokenStruct1, tokenStruct2],
                    {
                        value: ethersToWrap,
                    }
                )

                // need to fix the precision in distribution of etf tokens
                await etfContract.connect(etfOwner).depositFunds(
                    bundleId + 1,
                    [nativeTokenStruct, tokenStruct1, tokenStruct2],
                    {
                        value: ethersToWrap,
                    }
                )

                let etfTokensBalance = await etfTokenContract.balanceOf(etfOwner.address);
                expect(BigNumber.from(etfTokensBalance).gt(BigNumber.from(0))).toBeTruthy();


                let token1Balance = await tokenToBeWrapped1.balanceOf(etfOwner.address);
                expect(token1Balance).toEqual(BigNumber.from(0));

                let token2Balance = await tokenToBeWrapped2.balanceOf(etfOwner.address);
                expect(token2Balance).toEqual(BigNumber.from(0));

                await etfTokenContract.connect(etfOwner).approve(etfContract.address, etfTokenPerWrap);

                // const etfOwnerAddress = await etfContract.ownerOf(startingBundleId);
                // expect(etfOwnerAddress).toEqual(etfContract.address);

                // need to wait lock time to reedem (1 day)


                const uri = await etfContract.connect(owner).tokenURI(1);
                expect(uri).toEqual(ETFURI);

                await ethers.provider.send("evm_increaseTime", [86400]);

                await etfContract.connect(etfOwner).reedemETF(bundleId);

                // const etfTokensBalance = await etfTokenContract.balanceOf(etfOwner.address);
                // expect(etfTokensBalance).toEqual(BigNumber.from(0));

                // token1Balance = await tokenToBeWrapped1.balanceOf(etfOwner.address);
                // expect(token1Balance).toEqual(amountToWrapToken1);

                // token2Balance = await tokenToBeWrapped2.balanceOf(etfOwner.address);
                // expect(token2Balance).toEqual(amountToWrapToken2);

                // const etFSupply = await etfTokenContract.totalSupply();
                // expect(etFSupply).toEqual(BigNumber.from(0));

            });



            it("should be able to  and mint in two or more steps", async () => {
                const bundleId = 0;
                const amountToWrapToken1 = BigNumber.from(10).mul(BigNumber.from(10).pow(18));
                const amountToWrapToken2 = BigNumber.from(20).mul(BigNumber.from(10).pow(18));
                const ethersToWrap = ethers.utils.parseEther("0.5");

                const halfAmountToWrapToken2 = amountToWrapToken2.div(2);

                const nativeTokenStruct = {
                    assetContract: nativeAddress,
                    tokenType: 0,
                    tokenId: 0,
                    totalAmount: ethersToWrap,
                };

                const tokenStruct1 = {
                    assetContract: tokenToBeWrapped1.address,
                    tokenType: 0,
                    tokenId: 0,
                    totalAmount: amountToWrapToken1
                };

                const tokenStruct2 = {
                    assetContract: tokenToBeWrapped2.address,
                    tokenType: 0,
                    tokenId: 0,
                    totalAmount: halfAmountToWrapToken2,
                };

                await tokenToBeWrapped1.connect(owner).mint(etfOwner.address, amountToWrapToken1.mul(2));
                await tokenToBeWrapped2.connect(owner).mint(etfOwner.address, amountToWrapToken2.mul(2));
                await tokenToBeWrapped1.connect(etfOwner).approve(
                    etfContract.address,
                    BigNumber.from(amountToWrapToken1.mul(2))
                );
                await tokenToBeWrapped2.connect(etfOwner).approve(
                    etfContract.address,
                    BigNumber.from(amountToWrapToken2.mul(2))
                );

                await etfContract.connect(etfOwner).depositFunds(
                    bundleId,
                    [nativeTokenStruct, tokenStruct1, tokenStruct2],
                    {
                        value: ethersToWrap,
                    }
                )

                let etfTokensBalance = await etfTokenContract.balanceOf(etfOwner.address);


                const tokenStruct2_2 = {
                    assetContract: tokenToBeWrapped2.address,
                    tokenType: 0,
                    tokenId: 0,
                    totalAmount: amountToWrapToken2//amountToWrapToken2.sub(halfAmountToWrapToken2),
                };

                await etfContract.connect(etfOwner).depositFunds(
                    0,
                    [tokenStruct2_2]
                )
                etfTokensBalance = await etfTokenContract.balanceOf(etfOwner.address);
                expect(BigNumber.from(etfTokensBalance).gt(BigNumber.from(0))).toBeTruthy();
            });

        });

        it("should be able to deposit", async () => {

            const amountToWrapToken1 = BigNumber.from(10).mul(BigNumber.from(10).pow(18));
            const amountToWrapToken2 = BigNumber.from(20).mul(BigNumber.from(10).pow(18));
            const ethersToWrap = ethers.utils.parseEther("0.5");

            const nativeTokenStruct = {
                assetContract: nativeAddress,
                tokenType: 0,
                tokenId: 0,
                totalAmount: ethersToWrap,
            };

            const tokenStruct1 = {
                assetContract: tokenToBeWrapped1.address,
                tokenType: 0,
                tokenId: 0,
                totalAmount: amountToWrapToken1
            };

            const tokenStruct2 = {
                assetContract: tokenToBeWrapped2.address,
                tokenType: 0,
                tokenId: 0,
                totalAmount: amountToWrapToken2,
            };

            await tokenToBeWrapped1.connect(owner).mint(etfOwner.address, tokenStruct1.totalAmount);
            await tokenToBeWrapped1.connect(etfOwner).approve(
                etfContract.address,
                tokenStruct1.totalAmount
            );

            let etfTokensBalance = await etfTokenContract.balanceOf(etfOwner.address);
            expect(etfTokensBalance).toEqual(BigNumber.from(0));

            etfTokensBalance = await etfTokenContract.balanceOf(etfOwner2.address);
            expect(etfTokensBalance).toEqual(BigNumber.from(0));

            await etfContract.connect(etfOwner).depositFunds(
                0,
                [nativeTokenStruct, tokenStruct1],
                {
                    value: ethersToWrap,
                }
            )

            etfTokensBalance = await etfTokenContract.balanceOf(etfOwner.address);
            expect(etfTokensBalance).toEqual(BigNumber.from(0));

            await tokenToBeWrapped2.connect(owner).mint(etfOwner2.address, tokenStruct2.totalAmount);
            await tokenToBeWrapped2.connect(etfOwner2).approve(
                etfContract.address,
                tokenStruct2.totalAmount
            );
            await etfContract.connect(etfOwner2).depositFunds(
                0,
                [tokenStruct2]
            )

            etfTokensBalance = await etfTokenContract.balanceOf(etfOwner.address);
            let valueDepositedByEtfOwner1 = BigNumber.from(tokenStruct1.totalAmount).mul(tokenPrices[1].amount);
            valueDepositedByEtfOwner1 = valueDepositedByEtfOwner1.add(ethersToWrap.mul(tokenPrices[0].amount));
            expect(etfTokensBalance).toEqual(valueDepositedByEtfOwner1.mul(etfTokenPerWrap).div(totalValue));

            etfTokensBalance = await etfTokenContract.balanceOf(etfOwner2.address);
            const valueDepositedByEtfOwner2 = BigNumber.from(tokenStruct2.totalAmount).mul(tokenPrices[2].amount);
            expect(etfTokensBalance).toEqual(valueDepositedByEtfOwner2.mul(etfTokenPerWrap).div(totalValue));

            expect(await tokenToBeWrapped1.balanceOf(etfOwner.address)).toEqual(BigNumber.from(0));
            expect(await tokenToBeWrapped2.balanceOf(etfOwner.address)).toEqual(BigNumber.from(0));
            expect(await tokenToBeWrapped1.balanceOf(etfContract.address)).toEqual(tokenStruct1.totalAmount);
            expect(await tokenToBeWrapped2.balanceOf(etfContract.address)).toEqual(tokenStruct2.totalAmount);
        });

    });

    describe("gets notification from side chain deposits", () => {
        const mockMessageId = '0x0000000000000000000000000000000000000000000000000000000000000000';
        const mockSecondaryChainSelectorId = 2;
        let sideChainTokenWrapped: any;
        let priceAggregatorSideChainTokenWrapped: any;
        let message;

        beforeEach(async () => {

            sideChainTokenWrapped = await FungibleTokenFactory.deploy(
                "SideChainTokenToWrapped1",
                "SIDE1"
            );

            priceAggregatorSideChainTokenWrapped = await PriceAggregatorContractFactory.deploy(
                sideChainTokenToBeWrapped1, priceDecimals
            );

            // await sideChainTokenWrapped.connect(owner).mint(etfOwner.address, sideChainTokenToBeWrapped1);
            // await sideChainTokenWrapped.connect(etfOwner).approve(
            //     etfContract.address,
            //     BigNumber.from(sideChainTokenToBeWrapped1)
            // );
            etfTokenContract = await EtfTokenContractFactory.deploy();

            const tokenAmounts = [
                {
                    chainIdSelector: mockChainSelectorId,
                    assetContract: tokenToBeWrapped1.address,
                    amount: 10,
                    oracleAddress: priceAggregatortokenToBeWrapped1.address,
                },
                {
                    chainIdSelector: mockSecondaryChainSelectorId,  // On the SIDE CHAIN!!
                    assetContract: sideChainTokenWrapped.address,
                    amount: 20,
                    oracleAddress: priceAggregatortokenToBeWrapped2.address,
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
                link: tokenToBeWrapped2.address,
                currentChainSelectorId: mockChainSelectorId,
                subscriptionId: subscriptionId,
                vrfCoordinator: vrFCoordinatorV2.address,
                keyHash: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc"
            }


            etfContract = await EtfContractFactory.deploy(
                "ETF-v0.0.3",
                "ETF",
                tokenAmounts,
                eTFTokenOptions,
                chainLinkData
            );

            await etfTokenContract.connect(owner).setOwner(etfContract.address);
            await router.connect(owner).setOnlyRouteTo(etfContract.address);
            await vrFCoordinatorV2.addConsumer(subscriptionId, etfContract.address);
        });



        it("should be able to receive notification and update the bundle", async () => {
            const amountOfSideChainTokenToWrap = 10;
            const tokenStruct1 = {
                assetContract: sideChainTokenWrapped.address,
                tokenType: 0,
                tokenId: 0,
                totalAmount: amountOfSideChainTokenToWrap,
            };

            const depositFundMessage = {
                bundleId: 0,
                tokensToWrap: [tokenStruct1],
            }

            const encodedData = ethers.utils.defaultAbiCoder.encode(
                ['tuple(uint256,address,tuple(address,uint256,uint256,uint256)[])'],
                [[depositFundMessage.bundleId, etfOwner.address, depositFundMessage.tokensToWrap.map(token => [
                    token.assetContract,
                    token.tokenType,
                    token.tokenId,
                    token.totalAmount
                ])]]
            );

            const tx = await router.ccipReceive(
                {
                    messageId: mockMessageId,
                    sourceChainSelector: mockSecondaryChainSelectorId,
                    // sender: etfOwner2.address,
                    sender: ethers.utils.defaultAbiCoder.encode(['address'], [etfOwner2.address]),
                    data: encodedData,
                    destTokenAmounts: []
                }
            );

            const checkMessageReceivedETFContractPromise = new Promise<void>((resolve, reject) => {
                etfContract.on("MessageReceived", (messageId: string, chainIdSelector: any, sender: any, data: any) => {
                    try {
                        expect(messageId).toEqual(mockMessageId);
                        expect(sender).toEqual(etfOwner2.address);
                        expect(chainIdSelector).toEqual(BigNumber.from(mockSecondaryChainSelectorId));
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                    finally {
                        etfContract.removeAllListeners("MessageReceived");
                    }
                });
            });

            await tx.wait();
            await checkMessageReceivedETFContractPromise;
            await etfContract.updateBundleAfterReceive(0);
            const tokens = await etfContract.getTokensBundle(0);
            console.log('tokens', tokens);
            expect(tokens[0][0]).toEqual(BigNumber.from(amountOfSideChainTokenToWrap));
            expect(tokens[1][0]).toEqual(sideChainTokenWrapped.address);
            expect(tokens[2][0]).toEqual(BigNumber.from(mockSecondaryChainSelectorId));
        });

        it("should be able to send notifaction to reedem tokens on sidechains (sendReedeemMessage)", async () => {
            const amountOfSideChainTokenToWrap = 20;
            const bundles = [0, 1];

            const ReedemETFMessage = {
                bundleId: bundles[0],
                receiver: etfOwner.address
            }

            const tokenStruct1 = {
                assetContract: tokenToBeWrapped1.address,
                tokenType: 0,
                tokenId: 0,
                totalAmount: 10,
            };

            for (let i = 0; i < bundles.length; i++) {

                const tokenStructSide = {
                    assetContract: sideChainTokenWrapped.address,
                    tokenType: 0,
                    tokenId: 0,
                    totalAmount: amountOfSideChainTokenToWrap,
                };

                const depositFundMessage = {
                    bundleId: bundles[i],
                    userSender: etfOwner.address,
                    tokensToWrap: [tokenStructSide],
                }

                const encodedData = ethers.utils.defaultAbiCoder.encode(
                    ['tuple(uint256,address, tuple(address,uint256,uint256,uint256)[])'],
                    [[depositFundMessage.bundleId, depositFundMessage.userSender, depositFundMessage.tokensToWrap.map(token => [
                        token.assetContract,
                        token.tokenType,
                        token.tokenId,
                        token.totalAmount
                    ])]]
                );

                await router.ccipReceive(
                    {
                        messageId: mockMessageId,
                        sourceChainSelector: mockSecondaryChainSelectorId,
                        sender: ethers.utils.defaultAbiCoder.encode(['address'], [etfOwner.address]),
                        data: encodedData,
                        destTokenAmounts: []
                    }
                );

                await etfContract.updateBundleAfterReceive(bundles[i]);

                await tokenToBeWrapped1.connect(owner).mint(etfOwner.address, tokenStruct1.totalAmount);

                await tokenToBeWrapped1.connect(etfOwner).approve(etfContract.address, tokenStruct1.totalAmount);


                await etfContract.connect(etfOwner).depositFunds(
                    bundles[i],
                    [tokenStruct1],
                );

                const etfTokensBalance = await etfTokenContract.balanceOf(etfOwner.address);
                console.log('etfTokensBalance', etfTokensBalance.toString(), etfTokenPerWrap.toString());
            }

            await etfTokenContract.connect(etfOwner).approve(etfContract.address, etfTokenPerWrap);

            // need to wait lock time to reedem (1 day)
            await ethers.provider.send("evm_increaseTime", [86400]);

            // // reedem etf
            await etfContract.connect(etfOwner).reedemETF(
                bundles[0]);

            // // send reedem message
            await etfContract.sendReedeemMessage(
                ReedemETFMessage.bundleId,
                mockChainSelectorId,
                PayFeesIn.LINK
            );


            const checkRouterTestPromise = new Promise<void>((resolve, reject) => {
                router.on("RouterMessageSent", (address: string, data: any) => {
                    try {
                        const reedemETFMessageMessageType = ['tuple(uint256,address)'];
                        const decoded = ethers.utils.defaultAbiCoder.decode(reedemETFMessageMessageType, data);
                        expect(decoded).toBeDefined();
                        expect(decoded).toBeDefined();
                        expect(decoded.length).toEqual(1);
                        expect(decoded[0][0]).toEqual(BigNumber.from(bundles[0]));
                        expect(decoded[0][1]).toEqual(etfOwner.address);
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                    finally {
                        router.removeAllListeners("RouterMessageSent");
                    }
                });
            });

            await checkRouterTestPromise;
        });

    });


});


