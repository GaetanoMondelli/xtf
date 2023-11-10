import { BigNumber } from "@ethersproject/bignumber";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("TokenRing", () => {
  const nativeAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
  const moldTokenURI = "moldTokenURI";
  let owner: SignerWithAddress;
  let newOwner: SignerWithAddress;
  let FungibleTokenFactory: any;
  let NativeTokenWrapperFactory: any;
  let MoldTokenFactory: any;
  let TokenRingFactory: any;
  let nativeTokenWrapper: any;
  let tokenToBeWrapped1: any;
  let tokenToBeWrapped2: any;
  let moldToken: any;
  let tokenRing: any;

  beforeEach(async () => {
    [owner, newOwner] = await ethers.getSigners();
    FungibleTokenFactory = await ethers.getContractFactory("FungibleToken");
    tokenToBeWrapped1 = await FungibleTokenFactory.deploy(
      "TokenToWrapped1",
      "TW1"
    );
    tokenToBeWrapped2 = await FungibleTokenFactory.deploy(
      "TokenToWrapped2",
      "TW2"
    );
    NativeTokenWrapperFactory = await ethers.getContractFactory(
      "NativeTokenWrapper"
    );
    nativeTokenWrapper = await NativeTokenWrapperFactory.deploy(
      "NativeTokenWrapper",
      "NTW"
    );

    MoldTokenFactory = await ethers.getContractFactory("MoldToken");
    moldToken = await MoldTokenFactory.deploy("MoldToken", "MOLD", 250);

    TokenRingFactory = (await ethers.getContractFactory("TokenRing")).connect(
      owner
    );

    // I need to pass an array of TokenAmounts { address assetContract; uint256 minAmount; uint256 maxAmount } to the constructor

    const tokenAmounts = [
      {
        assetContract: nativeAddress,
        minAmount: ethers.utils.parseEther("0.02"),
        maxAmount: ethers.utils.parseEther("2"),
      },
      {
        assetContract: tokenToBeWrapped1.address,
        minAmount: 10,
        maxAmount: 20,
      },
      {
        assetContract: tokenToBeWrapped2.address,
        minAmount: 20,
        maxAmount: 30,
      },
    ];

    tokenRing = await TokenRingFactory.deploy(
      "TokenRing",
      "GODL",
      owner.address,
      250,
      nativeTokenWrapper.address,
      moldToken.address,
      tokenAmounts,
      ethers.utils.parseEther("2"),
      2,
      "https://example.com"
    );
  });

  describe("deploy contracts", () => {
    it("should deploy a TokenRing and partner contracts", async () => {
      expect(tokenRing.address).toBeDefined();
      expect(tokenToBeWrapped2.address).toBeDefined();
      expect(tokenToBeWrapped1.address).toBeDefined();
    });

    describe("mint tokenRing", () => {
      it("should prevent to invoke wrap function from an eoa", async () => {
        const uriForWrappedToken = "https://example.com";

        const tokenStruct = {
          assetContract: tokenToBeWrapped1.address,
          tokenType: 0,
          tokenId: 0,
          totalAmount: 100,
        };
        await expect(
          tokenRing
            .connect(owner)
            .wrap([tokenStruct], uriForWrappedToken, owner.address)
        ).rejects.toThrow(
          "VM Exception while processing transaction: reverted with reason string 'wrap from eoa is not allowed'"
        );
      });

      it("should mint tokenRing", async () => {
        const amountToWrap = 10;
        const ethersToWrap = ethers.utils.parseEther("0.5");

        const nativeTokenStruct = {
          assetContract: nativeAddress,
          tokenType: 0,
          tokenId: 0,
          totalAmount: ethersToWrap,
        };

        const tokenStruct = {
          assetContract: tokenToBeWrapped1.address,
          tokenType: 0,
          tokenId: 0,
          totalAmount: amountToWrap,
        };

        await tokenToBeWrapped1.mint(owner.address, amountToWrap);
        await tokenToBeWrapped1.approve(
          tokenRing.address,
          BigNumber.from(amountToWrap)
        );

        await moldToken.mintTo(owner.address, moldTokenURI);
        expect(await moldToken.ownerOf(0)).toEqual(owner.address);
        await moldToken.approve(tokenRing.address, 0);

        await tokenRing
          .connect(owner)
          .mint(owner.address, 0, [nativeTokenStruct, tokenStruct], {
            value: ethersToWrap,
          });

        // expect the moldToken to be burned
        await expect(moldToken.ownerOf(0)).rejects.toThrow(
          "OwnerQueryForNonexistentToken"
        );
        const ownerOfFirstRing = await tokenRing.ownerOf(0);
        expect(ownerOfFirstRing).toEqual(owner.address);
      });

      it("should mint tokenRing from any account not only contract owner/deployer", async () => {
        const amountToWrap = 10;
        const ethersToWrap = ethers.utils.parseEther("0.5");

        const nativeTokenStruct = {
          assetContract: nativeAddress,
          tokenType: 0,
          tokenId: 0,
          totalAmount: ethersToWrap,
        };

        const tokenStruct = {
          assetContract: tokenToBeWrapped1.address,
          tokenType: 0,
          tokenId: 0,
          totalAmount: amountToWrap,
        };

        await tokenToBeWrapped1.mint(newOwner.address, amountToWrap);
        await tokenToBeWrapped1
          .connect(newOwner)
          .approve(tokenRing.address, BigNumber.from(amountToWrap));

        await moldToken.mintTo(newOwner.address, moldTokenURI);
        await moldToken.connect(newOwner).approve(tokenRing.address, 0);

        await tokenRing
          .connect(newOwner)
          .mint(newOwner.address, 0, [nativeTokenStruct, tokenStruct], {
            value: ethersToWrap,
          });

        const ownerOfFirstRing = await tokenRing.ownerOf(0);
        expect(ownerOfFirstRing).toEqual(newOwner.address);
      });
    });
  });
});
