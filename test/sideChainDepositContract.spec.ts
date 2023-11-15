import { BigNumber } from "@ethersproject/bignumber";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("ChainLink CCIP Message layer", () => {
    const nativeAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
    const fungibleTokenName = "FungibleToken";
    const nativeWrapperContractName = "NativeTokenWrapper";

    const messageSideChainDepositName = "SidechainDeposit";
    // const messageReceiverContractName = "BasicMessageReceiver";
    const mockRouterContractName = "MockRouterClient";
    let FungibleTokenFactory: any;
    // let MessageReceiverContractFactory: any;
    let MessageSideChainContractFactory: any;
    let MockRouterContractFactory: any;
    let NativeTokenWrapperFactory: any;
    let linkToken: any;
    // let messageReceiver: any;
    let messageSideChainDepositContract: any;
    let router: any;
    let sender: SignerWithAddress;
    let receiver: SignerWithAddress;
    let nativeTokenWrapper: any;


    const enum PayFeesIn {
        Native = 0,
        LINK = 1,
    }

    beforeEach(async () => {
        [sender, receiver] = await ethers.getSigners();
        // MessageReceiverContractFactory = await ethers.getContractFactory(
        //     messageReceiverContractName
        // );
        NativeTokenWrapperFactory = await ethers.getContractFactory(nativeWrapperContractName);
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
        // messageReceiver = await MessageReceiverContractFactory.deploy(
        //     router.address
        // );

        // address _primaryEtfContract,
        // address router,
        // address link,
        // address _nativeTokenWrapper,
        // TokenAmounts[] memory _whitelistedTokenAmounts

        const sideChainTokenAmounts = [
            {
                assetContract: nativeAddress,
                amount: ethers.utils.parseEther("0.2"),
            },
            {
                assetContract: linkToken.address,
                amount: 50,
            }
        ];


        messageSideChainDepositContract = await MessageSideChainContractFactory.deploy(
            router.address,
            router.address,
            linkToken.address,
            nativeTokenWrapper.address,
            sideChainTokenAmounts
        );

        // mint 1000 mLINK to sender
        await linkToken.mint(sender.address, BigNumber.from("1000000000000000000000"));
        const balance = await linkToken.balanceOf(sender.address);
        expect(balance).toEqual(BigNumber.from("1000000000000000000000"));

        // await router.setOnlyRouteTo(messageReceiver.address);

    });


    describe("deploy contracts", () => {
        it("should deploy a ETF and partner contracts", async () => {
            expect(linkToken.address).toBeDefined();
            expect(router.address).toBeDefined();
            // expect(messageSideChainDepositContract).toBeDefined();

        });
    });
});




