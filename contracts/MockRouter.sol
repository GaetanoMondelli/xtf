// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";

import "hardhat/console.sol";


contract MockRouterClient is IRouterClient {

    address routeAllMessagesTo;

    function ccipSend(
        uint64,
        Client.EVM2AnyMessage memory message
    ) external payable override returns (bytes32) {
        emit RouterMessageSent(
            abi.decode(message.receiver, (address)),
            message.data
        );
        return bytes32(0);
    }

    function setOnlyRouteTo(address to) external {
        routeAllMessagesTo = to;
    }

    function ccipReceive(Client.Any2EVMMessage memory message) external {
        emit RouterReceivedMessage(
            message.messageId,
            address(bytes20(message.sender)),
            message.data
        );

        CCIPReceiver(routeAllMessagesTo).ccipReceive(message);
    }

    function getFee(
        uint64,
        Client.EVM2AnyMessage memory
    ) external pure override returns (uint256) {
        return 0;
    }

    function isChainSupported(
        uint64 chainSelector
    ) external pure override returns (bool supported) {
        if(chainSelector == 1) return false;
        return true;
    }

    function getSupportedTokens(
        uint64 chainSelector
    ) external view override returns (address[] memory tokens) {}

    event RouterReceivedMessage(bytes32 messageId, address sender, bytes data);
    event RouterMessageSent(address recipient, bytes data);
}
