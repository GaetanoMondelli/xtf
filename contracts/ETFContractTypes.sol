// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import {TokenBundle, ITokenBundle} from "@thirdweb-dev/contracts/extension/TokenBundle.sol";

/**
 *  @notice A generic interface to describe any ERC20, ERC721 or ERC1155 token.
 *
 *  @param assetContract    The contract address of the asset.
 *  @param amount           Amount of the asset required.
 */
struct TokenAmounts {
    address assetContract;
    uint256 amount;
    address oracleAddress;
    uint64 chainIdSelector;
}

struct ReedeemETFMessage {
    uint256 bundleId;
    address receiver;
}

address constant NATIVE_TOKEN = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

struct DepositFundMessage {
    uint256 bundleId;
    ITokenBundle.Token[] tokensToWrap;
}

struct ChainLinkData {
    address router;
    address link;
    uint64 currentChainSelectorId;
    uint64 subscriptionId;
    address vrfCoordinator;
    bytes32 keyHash;
}

uint constant lockTime = 1 minutes;

enum PayFeesIn {
    Native,
    LINK
}
uint32 constant CALLBACK_GAS_LIMIT = 100000;

// The default is 3, but you can set this higher.
uint16 constant REQUEST_CONFIRMATIONS = 3;

// For this example, retrieve 2 random values in one request.
// Cannot exceed VRFCoordinatorV2.MAX_NUM_WORDS.
uint32 constant NUM_WORDS = 1;

        //     uriETFToken = _etfOptions.uriETFToken;
        // etfTokenAddress = _etfOptions.etfTokenAddress;
        // etfTokenPerWrap = _etfOptions._etfTokenPerWrap;
        // percentageFee = _etfOptions._percentageFee;

struct ETFTokenOptions {
    address nativeTokenWrapper;
    string uriETFToken;
    address etfTokenAddress;
    uint256 etfTokenPerWrap;
    uint256 percentageFee;
}