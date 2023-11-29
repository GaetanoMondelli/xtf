// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.9;
import {TokenBundle, ITokenBundle} from "@thirdweb-dev/contracts/extension/TokenBundle.sol";
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

uint16 constant REQUEST_CONFIRMATIONS = 3;

uint32 constant NUM_WORDS = 1;

struct ETFTokenOptions {
    address nativeTokenWrapper;
    string uriETFToken;
    address etfTokenAddress;
    uint256 etfTokenPerWrap;
    uint256 percentageFee;
}

library Checks {
    function validateTokensToWrap(
        mapping(uint64 => mapping(address => bool)) storage isWhiteListedToken,
        mapping(uint64 => bool) storage chainSelectorIdInETF,
        ITokenBundle.Token[] memory tokensToWrap,
        uint64 chainSelectorId
    ) internal view {
        // check if the chainIdSelector is in the ETF
        require(
            chainSelectorIdInETF[chainSelectorId],
            "chain"
        );

        for (uint256 i = 0; i < tokensToWrap.length; i += 1) {
            // check each assetContract is whitelisted
            require(
                isWhiteListedToken[chainSelectorId][
                    tokensToWrap[i].assetContract
                ],
                "blklst"
            );
            for (uint256 j = i + 1; j < tokensToWrap.length; j += 1) {
                require(
                    tokensToWrap[i].assetContract !=
                        tokensToWrap[j].assetContract,
                    "dup"
                );
            }
        }
    }
}
