import { BigNumber } from "@ethersproject/bignumber";
import { ethers } from "hardhat";
import {
  MultiWrapBase,
  ITokenBundle,
} from "../typechain-types/contracts/MultiWrapBase";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("MultiWrapBase", () => {
  let owner: SignerWithAddress;
  let newOwner: SignerWithAddress;
  let FungibleTokenFactory: any;
  let NativeTokenWrapperFactory: any;
  let MultiWrapBaseFactory: any;
  let tokenWrapper: any;
  let nativeTokenWrapper: any;
  let tokenToBeWrapped: any;
  let multiWrapBase: any;

  beforeEach(async () => {
    [owner, newOwner] = await ethers.getSigners();
    FungibleTokenFactory = await ethers.getContractFactory("FungibleToken");
    tokenWrapper = await FungibleTokenFactory.deploy("TokenWrapper", "TW");
    MultiWrapBaseFactory = await ethers.getContractFactory("MultiWrapBase");
    NativeTokenWrapperFactory = await ethers.getContractFactory(
      "NativeTokenWrapper"
    );
    nativeTokenWrapper = await NativeTokenWrapperFactory.deploy(
      "NativeTokenWrapper",
      "NTW"
    );
    tokenToBeWrapped = await FungibleTokenFactory.deploy("TokenWrapper", "TW");
    multiWrapBase = await MultiWrapBaseFactory.deploy(
      "MultiWrapBase",
      "DS",
      owner.address,
      250,
      nativeTokenWrapper.address
    );
  });

  describe("deploy contracts", () => {
    it("should deploy a MultiWrapBase and partner contracts", async () => {
      expect(multiWrapBase.address).toBeDefined();
      expect(tokenWrapper.address).toBeDefined();
      expect(nativeTokenWrapper.address).toBeDefined();
      expect(tokenToBeWrapped.address).toBeDefined();
    });

    describe("wrap and unwrap tokens", () => {
      const uriForWrappedToken = "https://example.com";
      const amountToWrap = BigNumber.from(100);
      let multiWrapBaseAsOldOwner: any;
      let multiWrapBaseAsNewOwner: any;
      let tokenStruct: ITokenBundle.TokenStruct;

      beforeEach(async () => {
        tokenStruct = {
          assetContract: tokenToBeWrapped.address,
          tokenType: 0,
          tokenId: 0,
          totalAmount: 100,
        };

        multiWrapBaseAsOldOwner = multiWrapBase.connect(owner);
        multiWrapBaseAsNewOwner = multiWrapBase.connect(newOwner);
        await tokenToBeWrapped.mint(owner.address, 1000);

        await tokenToBeWrapped.approve(
          multiWrapBaseAsOldOwner.address,
          amountToWrap
        );

        await multiWrapBaseAsOldOwner.wrap(
          [tokenStruct],
          uriForWrappedToken,
          owner.address
        );
      });

      it("should wrap erc20 tokens and mint an NFT to the account wrapping", async () => {
        const wrappedTokenId = await multiWrapBaseAsOldOwner.ownerOf(0);
        const tokenWrappingSupply = await multiWrapBaseAsOldOwner.totalSupply();

        expect(wrappedTokenId).toEqual(owner.address);
        expect(tokenWrappingSupply).toEqual(BigNumber.from(1));
      });

      it("should unwrap the token and return the contained tokens to the current owner of the wrapping token", async () => {
        await multiWrapBaseAsOldOwner.transferFrom(
          owner.address,
          newOwner.address,
          0
        );

        const newOwnerOfWrappedToken = await multiWrapBaseAsOldOwner.ownerOf(0);

        expect(newOwnerOfWrappedToken).toEqual(newOwner.address);

        await multiWrapBaseAsNewOwner.unwrap(0, newOwner.address);

        expect(await tokenToBeWrapped.balanceOf(newOwner.address)).toEqual(
          BigNumber.from(100)
        );

        const tokenWrappingSupply = await multiWrapBaseAsOldOwner.totalSupply();
        expect(tokenWrappingSupply).toEqual(BigNumber.from(0));
      });
    });

    describe("wrap and unwrap native currency", () => {
      const ethersToWrap = "500";
      // address of the native currency (ether) for MultiWrap Contract
      const nativeAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
      // upper bound estimation of gas consumption
      const excessEstimationOfGas = "1";
      let multiWrapBaseAsOldOwner: any;
      let multiWrapBaseAsNewOwner: any;
      let nativeTokenStruct: ITokenBundle.TokenStruct;
      let initialEtherOwnerBalance: BigNumber;
      let afterWrapEtherOwnerBalance: BigNumber;
      let afterUnwrapEtherOwnerBalance: BigNumber;
      beforeEach(async () => {
        nativeTokenStruct = {
          assetContract: nativeAddress,
          tokenType: 0,
          tokenId: 0,
          totalAmount: ethers.utils.parseEther(ethersToWrap),
        };
        multiWrapBaseAsOldOwner = multiWrapBase.connect(owner);
        multiWrapBaseAsNewOwner = multiWrapBase.connect(newOwner);
      });

      it("should wrap a native currency in a token subtracting it from the owner balance", async () => {
        // check the ethereum balance of the contract

        initialEtherOwnerBalance = await ethers.provider.getBalance(
          owner.address
        );

        await multiWrapBase.wrap(
          [nativeTokenStruct],
          "https://example.com",
          owner.address,
          {
            value: ethers.utils.parseEther(ethersToWrap),
          }
        );

        afterWrapEtherOwnerBalance = await ethers.provider.getBalance(
          owner.address
        );

        // the initial owner balance should be aroun 1000 Eth
        // the owner wraps 500 ETH and his balance become slightly less than 500 (becauase of gas)
        // the difference between intial balance and the after wrap balance is a bit more than 500
        // subtracting the wrap cost (500 ETH) we get the gas cost that are much less than 1 ETH
        // subtracting  excessEstimationOfGas (1 ETH) we get a negative value

        expect(
          initialEtherOwnerBalance
            .sub(afterWrapEtherOwnerBalance)
            .sub(ethers.utils.parseEther(ethersToWrap))
            .sub(ethers.utils.parseEther(excessEstimationOfGas))
            .isNegative()
        ).toEqual(true);
      });

      it("should unwrap a NFT token containing native currency adding it to the owner balance", async () => {
        // in theory after unwrap we should get the same amount of Ethers
        // beucase of gas we add an upper estimation of gas to the
        // after unwrap balance we get more of the initial balance

        initialEtherOwnerBalance = await ethers.provider.getBalance(
          owner.address
        );

        await multiWrapBase.wrap(
          [nativeTokenStruct],
          "https://example.com",
          owner.address,
          {
            value: ethers.utils.parseEther(ethersToWrap),
          }
        );

        afterWrapEtherOwnerBalance = await ethers.provider.getBalance(
          owner.address
        );

        await multiWrapBaseAsOldOwner.unwrap(0, owner.address);

        afterUnwrapEtherOwnerBalance = await ethers.provider.getBalance(
          owner.address
        );

        expect(
          afterUnwrapEtherOwnerBalance
            .add(ethers.utils.parseEther(excessEstimationOfGas))
            .gt(initialEtherOwnerBalance)
        ).toEqual(true);
      });
    });
  });
});
