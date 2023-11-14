// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";

contract MockRouterClient is IRouterClient {
    function ccipSend(
        uint64,
        Client.EVM2AnyMessage memory
    ) external payable override returns (bytes32) {
        return bytes32(0);
    }

    function ccipReceive(Client.Any2EVMMessage memory message) external {
        emit ReceivedMessage(
            address(bytes20(message.sender)),
            message.messageId,
            message.data
        );
    }

    function getFee(
        uint64,
        Client.EVM2AnyMessage memory
    ) external pure override returns (uint256) {
        return 0;
    }

    function isChainSupported(
        uint64 chainSelector
    ) external view override returns (bool supported) {}

    function getSupportedTokens(
        uint64 chainSelector
    ) external view override returns (address[] memory tokens) {}

    event ReceivedMessage(address sender, bytes32 messageId, bytes data);
}
