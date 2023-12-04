import { BigNumber } from "@ethersproject/bignumber";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("Fungible token for faucet", () => {
    let owner: SignerWithAddress;
    let newOwner: SignerWithAddress;
    let FungibleTokenFactory: any;
    let fungibleToken: any;


    beforeEach(async () => {
        [owner, newOwner] = await ethers.getSigners();
        FungibleTokenFactory = await ethers.getContractFactory("FungibleToken");

        fungibleToken = await FungibleTokenFactory.deploy("TokenWrapper", "TW");
    });

    describe("deploy contracts", () => {
        it("should deploy a fungible token", async () => {
            expect(fungibleToken.address).toBeDefined();
        });

        it("should wrap erc20 tokens and mint an NFT to the account wrapping", async () => {
            await fungibleToken.connect(owner).mint(owner.address, BigNumber.from(100));
            await fungibleToken.connect(newOwner).mint(newOwner.address, BigNumber.from(100));

            expect(await fungibleToken.balanceOf(owner.address)).toEqual(BigNumber.from(100));
            expect(await fungibleToken.balanceOf(newOwner.address)).toEqual(BigNumber.from(100));
        });

    });
});
