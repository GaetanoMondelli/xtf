// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LinkTokenInterface} from "./LinkTokenInterface.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {TokenAmounts, ReedeemETFMessage, NATIVE_TOKEN, DepositFundMessage, ETFTokenOptions, ChainLinkData, lockTime, PayFeesIn, REQUEST_CONFIRMATIONS, CALLBACK_GAS_LIMIT, NUM_WORDS} from "./ETFContractTypes.sol";
import {TokenBundle, ITokenBundle} from "@thirdweb-dev/contracts/extension/TokenBundle.sol";

contract PolygonSenderReceiver is CCIPReceiver {
    address immutable i_link;
    uint256 public lastmsgnum = 0;
    address public tokenwrap;
    uint256 public tokenwrapamount = 0;

    error NotEnoughBalance(
        uint256 currentBalance,
        uint256 calculatedFees,
        PayFeesIn payFeesIn
    );

    event MessageSent(bytes32 messageId, address receiver);
    event MessageReceived(address sender, bytes32 messageId, uint256 bundid);

    constructor(address _link, address _router) CCIPReceiver(_router) {
        i_link = _link;
    }

    function send(
        uint64 destinationChainSelector,
        address receiver,
        DepositFundMessage memory data,
        PayFeesIn payFeesIn
    ) public returns (bytes32 messageId) {
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(receiver),
            data: abi.encode(data),
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: 4_000_000, strict: false})
            ),
            feeToken: payFeesIn == PayFeesIn.LINK ? i_link : address(0)
        });

        uint256 fee = IRouterClient(i_router).getFee(
            destinationChainSelector,
            message
        );

        if (payFeesIn == PayFeesIn.LINK) {
            if (fee > LinkTokenInterface(i_link).balanceOf(address(this)))
                revert NotEnoughBalance(
                    LinkTokenInterface(i_link).balanceOf(address(this)),
                    fee,
                    PayFeesIn.LINK
                );
            LinkTokenInterface(i_link).approve(i_router, fee);
            messageId = IRouterClient(i_router).ccipSend(
                destinationChainSelector,
                message
            );
        } else {
            if (fee > address(this).balance)
                revert NotEnoughBalance(
                    address(this).balance,
                    fee,
                    PayFeesIn.Native
                );

            messageId = IRouterClient(i_router).ccipSend{value: fee}(
                destinationChainSelector,
                message
            );
        }

        emit MessageSent(messageId, receiver);
    }

    function _ccipReceive(
        Client.Any2EVMMessage memory message
    ) internal virtual override {
        DepositFundMessage memory depositFundMessage = abi.decode(
            message.data,
            (DepositFundMessage)
        );

        emit MessageReceived(
            address(bytes20(message.sender)),
            message.messageId,
            depositFundMessage.bundleId
        );

        lastmsgnum = depositFundMessage.bundleId;
        tokenwrap = depositFundMessage.tokensToWrap[0].assetContract;
        tokenwrapamount = depositFundMessage.tokensToWrap[0].totalAmount;
    }
}
