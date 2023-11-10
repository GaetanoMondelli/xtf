import { BigNumber } from "@ethersproject/bignumber";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("ETFContract", () => {
    const nativeAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
    const etfTokenContractName = "ETFToken";
    const nativeWrapperContractName = "NativeTokenWrapper";
    const etfContractName = "ETFv2";
    const fungibleTokenName = "FungibleToken";
    const priceAggregatorContractName = "MockAggregator";
    const ETFURI = "https://example.com";
    const royaltyBps = 1000;
    const fee = 0;
    const etfTokenPerWrap = 100;
    const priceTokenToBeWrapped1 = 5;
    const priceTokenToBeWrapped2 = 10;
    const priceNativeToken = 0;

    let etfTokenContract: any;
    let etfContract: any;
    let owner: SignerWithAddress;
    let etfOwner: SignerWithAddress;
    let etfOwner2: SignerWithAddress;
    let FungibleTokenFactory: any;
    let NativeTokenWrapperFactory: any;
    let PriceAggregatorContractFactory: any;
    let EtfContractFactory: any;
    let EtfTokenContractFactory: any;
    let nativeTokenWrapper: any;
    let priceAggregatorNativeTokenWrapper: any;
    let tokenToBeWrapped1: any;
    let priceAggregatortokenToBeWrapped1: any;
    let tokenToBeWrapped2: any;
    let priceAggregatortokenToBeWrapped2: any;
    let totalValue: any;
    let tokenPrices: any;

    beforeEach(async () => {
        [owner, etfOwner, etfOwner2] = await ethers.getSigners();
        NativeTokenWrapperFactory = await ethers.getContractFactory(nativeWrapperContractName);
        FungibleTokenFactory = await ethers.getContractFactory(fungibleTokenName);
        EtfTokenContractFactory = await ethers.getContractFactory(etfTokenContractName);
        EtfContractFactory = await ethers.getContractFactory(etfContractName);
        PriceAggregatorContractFactory = await ethers.getContractFactory(priceAggregatorContractName);

        tokenToBeWrapped1 = await FungibleTokenFactory.deploy(
            "TokenToWrapped1",
            "TW1"
        );

        priceAggregatortokenToBeWrapped1 = await PriceAggregatorContractFactory.deploy(
            priceTokenToBeWrapped1
        );

        tokenToBeWrapped2 = await FungibleTokenFactory.deploy(
            "TokenToWrapped2",
            "TW2"
        );

        priceAggregatortokenToBeWrapped2 = await PriceAggregatorContractFactory.deploy(
            priceTokenToBeWrapped2
        );

        nativeTokenWrapper = await NativeTokenWrapperFactory.deploy(
            "NativeTokenWrapper",
            "NTW"
        );

        priceAggregatorNativeTokenWrapper = await PriceAggregatorContractFactory.deploy(
            priceNativeToken
        );

        etfTokenContract = await EtfTokenContractFactory.deploy();

        const tokenAmounts = [
            {
                assetContract: nativeAddress,
                amount: ethers.utils.parseEther("0.5"),
                oracleAddress: priceAggregatorNativeTokenWrapper.address,
            },
            {
                assetContract: tokenToBeWrapped1.address,
                amount: 10,
                oracleAddress: priceAggregatortokenToBeWrapped1.address,
            },
            {
                assetContract: tokenToBeWrapped2.address,
                amount: 20,
                oracleAddress: priceAggregatortokenToBeWrapped2.address,
            },
        ];



        // TO-DO: Pass the data strucuture as a parameter in v1.1
        tokenPrices = [
            {
                assetContract: nativeAddress,
                amount: 0,
            },
            {
                assetContract: tokenToBeWrapped1.address,
                amount: 5,
            },
            {
                assetContract: tokenToBeWrapped2.address,
                amount: 10,
            },
        ];

        totalValue = BigNumber.from(0);

        for (let i = 0; i < tokenAmounts.length; i++) {
            const tokenAmount = tokenAmounts[i];
            const tokenPrice = tokenPrices[i];
            if (tokenAmount.amount instanceof BigNumber) {
                totalValue = totalValue.add(tokenAmount.amount.mul(tokenPrice.amount));
            }
            else {
                totalValue = totalValue.add(BigNumber.from(tokenAmount.amount).mul(tokenPrice.amount));
            }
            console.log('totalValue', tokenAmount.amount, tokenPrice.amount, totalValue.toString());
        }


        etfContract = await EtfContractFactory.deploy(
            "ETF-v0.0.1",
            "ETF",
            owner.address,
            royaltyBps,
            nativeTokenWrapper.address,
            etfTokenContract.address,
            etfTokenPerWrap,
            fee,
            tokenAmounts,
            ETFURI,
        );

        await etfTokenContract.connect(owner).setOwner(etfContract.address);
    });

    describe("deploy contracts", () => {
        it("should deploy a ETF and partner contracts", async () => {
            expect(etfContract.address).toBeDefined();
            expect(nativeTokenWrapper.address).toBeDefined();
            expect(etfTokenContract.address).toBeDefined();
            expect(tokenToBeWrapped2.address).toBeDefined();
            expect(tokenToBeWrapped1.address).toBeDefined();
        });

        describe("mint ETF", () => {
            it("should prevent to invoke ETF wrap function from an eoa", async () => {
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

            it("should mint an ETF", async () => {
                const amountToWrapToken1 = 10;
                const amountToWrapToken2 = 20;
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
                    BigNumber.from(amountToWrapToken1)
                );
                await tokenToBeWrapped2.connect(etfOwner).approve(
                    etfContract.address,
                    BigNumber.from(amountToWrapToken2)
                );


                await etfContract
                    .connect(etfOwner)
                    .mint(etfOwner.address, [nativeTokenStruct, tokenStruct1, tokenStruct2], {
                        value: ethersToWrap,
                    });

                const etfTokensBalance = await etfTokenContract.balanceOf(etfOwner.address);
                expect(etfTokensBalance).toEqual(BigNumber.from(etfTokenPerWrap));
            });


            it("should reedem and burn an ETF", async () => {
                const amountToWrapToken1 = 10;
                const amountToWrapToken2 = 20;
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
                    BigNumber.from(amountToWrapToken1)
                );
                await tokenToBeWrapped2.connect(etfOwner).approve(
                    etfContract.address,
                    BigNumber.from(amountToWrapToken2)
                );


                await etfContract
                    .connect(etfOwner)
                    .mint(etfOwner.address, [nativeTokenStruct, tokenStruct1, tokenStruct2], {
                        value: ethersToWrap,
                    });

                let token1Balance = await tokenToBeWrapped1.balanceOf(etfOwner.address);
                expect(token1Balance).toEqual(BigNumber.from(0));

                let token2Balance = await tokenToBeWrapped2.balanceOf(etfOwner.address);
                expect(token2Balance).toEqual(BigNumber.from(0));

                await etfTokenContract.connect(etfOwner).approve(etfContract.address, etfTokenPerWrap);

                const etfOwnerAddress = await etfContract.ownerOf(0);
                expect(etfOwnerAddress).toEqual(etfContract.address);

                await etfContract.connect(etfOwner).reedemETF();

                const etfTokensBalance = await etfTokenContract.balanceOf(etfOwner.address);
                expect(etfTokensBalance).toEqual(BigNumber.from(0));

                token1Balance = await tokenToBeWrapped1.balanceOf(etfOwner.address);
                expect(token1Balance).toEqual(BigNumber.from(amountToWrapToken1));

                token2Balance = await tokenToBeWrapped2.balanceOf(etfOwner.address);
                expect(token2Balance).toEqual(BigNumber.from(amountToWrapToken2));

            });

            it("should be able to deposit", async () => {

                const amountToWrapToken1 = 10;
                const amountToWrapToken2 = 20;
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
                await tokenToBeWrapped1.connect(etfOwner).approve(
                    etfContract.address,
                    BigNumber.from(amountToWrapToken1)
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

                await tokenToBeWrapped2.connect(owner).mint(etfOwner2.address, amountToWrapToken2);
                await tokenToBeWrapped2.connect(etfOwner2).approve(
                    etfContract.address,
                    BigNumber.from(amountToWrapToken2)
                );
                await etfContract.connect(etfOwner2).depositFunds(
                    0,
                    [tokenStruct2]
                )

                etfTokensBalance = await etfTokenContract.balanceOf(etfOwner.address);
                const valueDepositedByEtfOwner1 = BigNumber.from(tokenStruct1.totalAmount).mul(tokenPrices[1].amount);
                expect(etfTokensBalance).toEqual(valueDepositedByEtfOwner1.mul(etfTokenPerWrap).div(totalValue));

                etfTokensBalance = await etfTokenContract.balanceOf(etfOwner2.address);
                const valueDepositedByEtfOwner2 = tokenStruct2.totalAmount * tokenPrices[2].amount;
                expect(etfTokensBalance).toEqual(BigNumber.from(valueDepositedByEtfOwner2 / totalValue * etfTokenPerWrap));

                expect(await tokenToBeWrapped1.balanceOf(etfOwner.address)).toEqual(BigNumber.from(0));
                expect(await tokenToBeWrapped2.balanceOf(etfOwner.address)).toEqual(BigNumber.from(0));
                expect(await tokenToBeWrapped1.balanceOf(etfContract.address)).toEqual(BigNumber.from(10));
                expect(await tokenToBeWrapped2.balanceOf(etfContract.address)).toEqual(BigNumber.from(20));

            });

        });
    });

});
