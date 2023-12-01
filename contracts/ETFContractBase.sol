// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;
import {IETFToken} from "./ETFTokenContract.sol";
import {Ownable} from "@thirdweb-dev/contracts/extension/Ownable.sol";
import {TokenBundle, ITokenBundle} from "@thirdweb-dev/contracts/extension/TokenBundle.sol";
import {IERC165} from "@thirdweb-dev/contracts/eip/interface/IERC165.sol";
import {ERC1155Receiver} from "@thirdweb-dev/contracts/openzeppelin-presets/utils/ERC1155/ERC1155Receiver.sol";
import {TokenStore} from "@thirdweb-dev/contracts/extension/TokenStore.sol";
import {ContractMetadata} from "@thirdweb-dev/contracts/extension/ContractMetadata.sol";
import {ERC721A} from "@thirdweb-dev/contracts/eip/ERC721AVirtualApprove.sol";
import {DefaultOperatorFilterer} from "@thirdweb-dev/contracts/extension/DefaultOperatorFilterer.sol";
import {IERC20Metadata, IERC20} from "@thirdweb-dev/contracts/base/ERC20Base.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {VRFCoordinatorV2Interface} from "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import {TokenAmounts, MessageDesposit, ReedeemETFMessage, NATIVE_TOKEN, DepositFundMessage, ETFTokenOptions, ChainLinkData, lockTime, PayFeesIn, REQUEST_CONFIRMATIONS, CALLBACK_GAS_LIMIT, NUM_WORDS} from "./ETFContractTypes.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";

import "hardhat/console.sol";

contract ETFBase is
    TokenStore,
    ERC721A,
    ContractMetadata,
    Ownable,
    DefaultOperatorFilterer,
    CCIPReceiver,
    VRFConsumerBaseV2
{
    VRFCoordinatorV2Interface COORDINATOR;
    //  Options to define ETF tokens, amount of tokens for etf, and fees
    ETFTokenOptions etfOptions;
    // data for chainlink services
    ChainLinkData chainLinkData;

    // mapping of token address to chainlink data feed
    mapping(address => AggregatorV3Interface) tokenIdToDataFeed;
    // map of whitelisted tokens per chainIdSelector
    mapping(uint64 => mapping(address => bool)) isWhiteListedToken;
    // whitelist of token addresses for the ETF
    mapping(uint64 => address[]) whitelistedTokens;
    // ChainSelectorId in the ETF
    mapping(uint64 => bool) chainSelectorIdInETF;
    // All the blockchain that have assets wrapped in the ETF
    uint64[] chainSelectorIds;
    // mapping of token address to  quantity of token that must be wrapped per etf
    mapping(uint64 => mapping(address => uint256)) tokenQuantities;
    // number of tokens that must be wrapped per etf
    uint256 tokensToWrapQuantity;
    // number of bundles
    uint256 public bundleCount = 0;
    // check if a bundle is opened
    mapping(uint256 => bool) openedBundle;
    // list of all addresses with positions in a bundle
    mapping(uint256 => address[]) bundleIdToAddress;
    // mapping in each bundle how many of each tokens each address has sent
    mapping(uint256 => mapping(address => bool)) addressInBundleId;
    // mapping bundleId to mapping of index to chainIdSelector
    mapping(uint256 => mapping(uint256 => uint64)) bundleIdToChainIdSelector;
    // map from bundleId to ETFId(TokenId)
    mapping(uint256 => uint256) public bundleIdToETFId;
    // messages from other chains through the CCIP
    mapping(uint256 => MessageDesposit[]) messages;

    constructor(
        string memory _name,
        string memory _symbol,
        TokenAmounts[] memory _whitelistedTokenAmounts,
        ETFTokenOptions memory _etfOptions,
        ChainLinkData memory _chainLinkData
    )
        ERC721A(_name, _symbol)
        TokenStore(_etfOptions.nativeTokenWrapper)
        CCIPReceiver(_chainLinkData.router)
        VRFConsumerBaseV2(_chainLinkData.vrfCoordinator)
    {
        COORDINATOR = VRFCoordinatorV2Interface(_chainLinkData.vrfCoordinator);
        _setupOwner(msg.sender);
        _setOperatorRestriction(true);

        bool containNativeTokenAmount = false;
        for (uint256 i = 0; i < _whitelistedTokenAmounts.length; i += 1) {
            if (_whitelistedTokenAmounts[i].assetContract == NATIVE_TOKEN) {
                containNativeTokenAmount = true;
            }
            uint64 chainIdSelector = _whitelistedTokenAmounts[i]
                .chainIdSelector;
            if (!chainSelectorIdInETF[chainIdSelector]) {
                chainSelectorIds.push(chainIdSelector);
                chainSelectorIdInETF[chainIdSelector] = true;
            }

            isWhiteListedToken[chainIdSelector][
                _whitelistedTokenAmounts[i].assetContract
            ] = true;

            tokenQuantities[chainIdSelector][
                _whitelistedTokenAmounts[i].assetContract
            ] = _whitelistedTokenAmounts[i].amount;
            whitelistedTokens[chainIdSelector].push(
                _whitelistedTokenAmounts[i].assetContract
            );

            tokenIdToDataFeed[
                _whitelistedTokenAmounts[i].assetContract
            ] = AggregatorV3Interface(
                _whitelistedTokenAmounts[i].oracleAddress
            );
        }
        etfOptions = _etfOptions;
        chainLinkData = _chainLinkData;
        tokensToWrapQuantity = _whitelistedTokenAmounts.length;
    }

    event EtherReceived(address indexed sender, uint256 value);

    function isETFBurned(uint256 tokenId) public view returns (bool) {
        // Ensure the token ID is valid.
        // require(tokenId < _currentIndex, "Token ID does not exist.");
        if (tokenId >= _currentIndex) {
            return false;
        }

        // Check the burned flag in the ownership struct of the token.
        return _ownerships[tokenId].burned;
    }

    function getBurnedCount() public view returns (uint256) {
        return _burnCounter;
    }

    function returnStateOfBundles(
        uint256 offset,
        uint256 items
    )
        public
        view
        returns (
            uint256[] memory bundleIds,
            address[] memory addresses,
            uint256[][] memory quantities,
            bool[] memory areMessagesIn,
            bool[] memory areETFBurned
        )
    {
        bundleIds = new uint256[](items);
        addresses = new address[](items);
        quantities = new uint256[][](items);
        // selectorsIds = new uint64[](items);
        areMessagesIn = new bool[](items);
        areETFBurned = new bool[](items);
        for (uint256 i = 0; i < items; i++) {
            uint256 currentIndex = i + offset;
            bundleIds[i] = currentIndex;

            uint256 qt = getTokenCountOfBundle(bundleIds[i]);
            uint256[] memory bundlequantities = new uint256[](qt);
            areMessagesIn[i] = messages[bundleIds[i]].length > 0;

            if (qt > 0) {
                addresses[i] = bundleIdToAddress[bundleIds[i]][0];
                // selectorsIds[i] = bundleIdToChainIdSelector[bundleIds[i]][0];
                for (uint256 j = 0; j < qt; j++) {
                    bundlequantities[j] = getTokenOfBundle(bundleIds[i], j)
                        .totalAmount;
                }
            }
            quantities[i] = bundlequantities;
            areETFBurned[i] = isETFBurned(bundleIdToETFId[bundleIds[i]]);
        }

        return (bundleIds, addresses, quantities, areMessagesIn, areETFBurned);
    }

    function validateTokensToWrap(
        ITokenBundle.Token[] memory tokensToWrap,
        uint64 chainSelectorId
    ) internal view {
        // check if the chainIdSelector is in the ETF
        require(chainSelectorIdInETF[chainSelectorId], "chain");

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

    // Receive function
    receive() external payable {
        emit EtherReceived(msg.sender, msg.value);
    }

    function nextTokenIdToMint() public view virtual returns (uint256) {
        return _currentIndex;
    }

    // append messages

    function _startTokenId() internal pure override returns (uint256) {
        return 1;
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        pure
        override(CCIPReceiver, ERC1155Receiver, ERC721A)
        returns (bool)
    {
        return CCIPReceiver.supportsInterface(interfaceId);
    }

    function _canSetContractURI()
        internal
        view
        virtual
        override
        returns (bool)
    {}

    function _canSetOwner() internal view virtual override returns (bool) {
        return false;
    }

    function _canSetOperatorRestriction()
        internal
        virtual
        override
        returns (bool)
    {
        return false;
    }

    event MessageReceived(
        bytes32 messageId,
        uint64 chainId,
        address sender,
        bytes data
    );

    function _ccipReceive(
        Client.Any2EVMMessage memory message
    ) internal virtual override {
        emit MessageReceived(
            message.messageId,
            message.sourceChainSelector,
            abi.decode(message.sender, (address)),
            message.data
        );
        DepositFundMessage memory depositFundMessage = abi.decode(
            message.data,
            (DepositFundMessage)
        );
        MessageDesposit memory messageDesposit = MessageDesposit({
            depositFundMessage: message.data,
            sender: abi.decode(message.sender, (address)),
            sourceChainSelector: message.sourceChainSelector
        });
        messages[depositFundMessage.bundleId].push(messageDesposit);
    }

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal virtual override {}
}
