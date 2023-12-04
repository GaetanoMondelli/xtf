// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LinkTokenInterface} from "./LinkTokenInterface.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {MessageDesposit, ReedeemETFMessage, NATIVE_TOKEN, DepositFundMessage, ETFTokenOptions, ChainLinkData, lockTime, PayFeesIn, REQUEST_CONFIRMATIONS, CALLBACK_GAS_LIMIT, NUM_WORDS} from "./ETFContractTypes.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@thirdweb-dev/contracts/base/ERC721Multiwrap.sol";
import "@thirdweb-dev/contracts/extension/TokenStore.sol";
import "@thirdweb-dev/contracts/lib/CurrencyTransferLib.sol";
import "@thirdweb-dev/contracts/base/ERC721Base.sol";
import "@thirdweb-dev/contracts/extension/TokenStore.sol";

// TO-DO: Need to use the structure from the ETFContractTypes.sol */
/**
 *  @notice A generic interface to describe any ERC20, ERC721 or ERC1155 token.
 *
 *  @param assetContract    The contract address of the asset.
 *  @param amount           Amount of the asset required.
 */
struct TokenAmounts {
    address assetContract;
    uint256 amount;
}

contract SidechainDeposit is
    Ownable,
    TokenStore,
    PermissionsEnumerable,
    CCIPReceiver
{
    error NotEnoughBalance(uint256 currentBalance, uint256 calculatedFees);
    bytes32 private constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 private constant UNWRAP_ROLE = keccak256("UNWRAP_ROLE");
    bytes32 private constant ASSET_ROLE = keccak256("ASSET_ROLE");
    uint256 tokensToWrapQuantity;
    address immutable primaryEtfContract;
    address immutable i_link;
    // address immutable i_router;
    address[] public whitelistedTokens;
    uint64 public primaryChainSelectorId;
    uint64 immutable chainSelectorId;
    mapping(address => uint256) public tokenQuantities;
    mapping(uint256 => mapping(address => bool)) public addressInBundleId;
    mapping(uint256 => address[]) public bundleIdToAddress;
    mapping(uint256 => mapping(address => mapping(uint256 => uint256)))
        public bundleIdToAddressToTokenAmount;
    mapping(uint256 => address) public burner;
    mapping(uint256 => MessageDesposit[]) messages;
    uint64 public currentChainSelectorId;
    mapping(uint256 => bool) openedBundle;
    mapping(uint256 => uint256) bundleIdToETFId;
    uint256 public bundleCount = 0;
    uint256 private _burnCounter = 0;

    event MessageSent(bytes32 messageId);

    constructor(
        uint64 _primaryChainSelectorId,
        uint64 _chainSelectorId,
        address _primaryEtfContract,
        address _router,
        address _link,
        address _nativeTokenWrapper,
        TokenAmounts[] memory _whitelistedTokenAmounts
    ) TokenStore(_nativeTokenWrapper) CCIPReceiver(_router) {
        i_link = _link;
        LinkTokenInterface(i_link).approve(i_router, type(uint256).max);
        _setupRole(MINTER_ROLE, address(0));
        _setupOwner(msg.sender);

        for (uint256 i = 0; i < _whitelistedTokenAmounts.length; i += 1) {
            _setupRole(ASSET_ROLE, _whitelistedTokenAmounts[i].assetContract);
            tokenQuantities[
                _whitelistedTokenAmounts[i].assetContract
            ] = _whitelistedTokenAmounts[i].amount;
            whitelistedTokens.push(_whitelistedTokenAmounts[i].assetContract);
        }

        _setupRole(ASSET_ROLE, NATIVE_TOKEN);
        primaryChainSelectorId = _primaryChainSelectorId;
        primaryEtfContract = _primaryEtfContract;
        chainSelectorId = _chainSelectorId;
        currentChainSelectorId = _chainSelectorId;
        tokensToWrapQuantity = _whitelistedTokenAmounts.length;
    }

    receive() external payable {
        emit EtherReceived(msg.sender, msg.value);
    }

    function depositFundsAndNotify(
        uint256 _bundleId,
        Token[] memory _tokensToWrap,
        PayFeesIn _payFeesIn,
        bool debug
    ) external payable returns (bytes32 messageId) {
        require(
            burner[_bundleId] == address(0),
            "ETFContract: bundleId is already burned"
        );
        for (uint256 i = 0; i < _tokensToWrap.length; i += 1) {
            // check each assetContract is whitelisted
            require(
                hasRole(ASSET_ROLE, _tokensToWrap[i].assetContract),
                "ETFContract: assetContract is not whitelisted"
            );

            // check each assetContract is not duplicated
            for (uint256 j = i + 1; j < _tokensToWrap.length; j += 1) {
                require(
                    _tokensToWrap[i].assetContract !=
                        _tokensToWrap[j].assetContract,
                    "ETFContract: assetContract is duplicated"
                );
            }
        }

        if (!addressInBundleId[_bundleId][msg.sender]) {
            bundleIdToAddress[_bundleId].push(msg.sender);
        }
        addressInBundleId[_bundleId][msg.sender] = true;

        for (uint256 i = 0; i < _tokensToWrap.length; i += 1) {
            // check if the token is already in the bundle
            bool tokenAlreadyInBundle = false;

            for (uint256 j = 0; j < getTokenCountOfBundle(_bundleId); j += 1) {
                if (
                    getTokenOfBundle(_bundleId, j).assetContract ==
                    _tokensToWrap[i].assetContract
                ) {
                    tokenAlreadyInBundle = true;
                    if (
                        getTokenOfBundle(_bundleId, j).totalAmount +
                            _tokensToWrap[i].totalAmount >
                        tokenQuantities[
                            getTokenOfBundle(_bundleId, j).assetContract
                        ]
                    ) {
                        _tokensToWrap[i].totalAmount =
                            tokenQuantities[
                                getTokenOfBundle(_bundleId, j).assetContract
                            ] -
                            getTokenOfBundle(_bundleId, j).totalAmount;
                    }

                    _updateTokenInBundle(
                        Token(
                            _tokensToWrap[i].assetContract,
                            _tokensToWrap[i].tokenType,
                            _tokensToWrap[i].tokenId,
                            getTokenOfBundle(_bundleId, j).totalAmount +
                                _tokensToWrap[i].totalAmount
                        ),
                        _bundleId,
                        j
                    );
                    // update the bundleIdToAddressToTokenAmount
                    bundleIdToAddressToTokenAmount[_bundleId][msg.sender][
                        j
                    ] += _tokensToWrap[i].totalAmount;
                }
            }

            if (!tokenAlreadyInBundle) {
                _addTokenInBundle(
                    Token(
                        _tokensToWrap[i].assetContract,
                        _tokensToWrap[i].tokenType,
                        _tokensToWrap[i].tokenId,
                        _tokensToWrap[i].totalAmount
                    ),
                    _bundleId
                );

                bundleIdToAddressToTokenAmount[_bundleId][msg.sender][
                    getTokenCountOfBundle(_bundleId) - 1
                ] += _tokensToWrap[i].totalAmount;
            }
        }

        _transferTokenBatch(msg.sender, address(this), _tokensToWrap);
        updateBundleCount(_bundleId);

        DepositFundMessage memory message = DepositFundMessage({
            userSender: msg.sender,
            bundleId: _bundleId,
            tokensToWrap: _tokensToWrap
        });
        if (debug) {
            return bytes32(0);
        } else
            return
                send(
                    primaryChainSelectorId,
                    primaryEtfContract,
                    message,
                    _payFeesIn
                );
    }

    function send(
        uint64 destinationChainSelector,
        address receiver,
        DepositFundMessage memory data,
        PayFeesIn payFeesIn
    ) internal returns (bytes32 messageId) {
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(receiver),
            data: abi.encode(data),
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: CALLBACK_GAS_LIMIT, strict: false})
            ),
            feeToken: payFeesIn == PayFeesIn.LINK ? i_link : address(0)
        });

        uint256 fee = IRouterClient(i_router).getFee(
            destinationChainSelector,
            message
        );

        if (payFeesIn == PayFeesIn.LINK) {
            if (fee > IERC20(i_link).balanceOf(address(this)))
                revert NotEnoughBalance(
                    IERC20(i_link).balanceOf(address(this)),
                    fee
                );
            LinkTokenInterface(i_link).approve(i_router, fee);
            messageId = IRouterClient(i_router).ccipSend(
                destinationChainSelector,
                message
            );
        } else {
            if (fee > address(this).balance)
                revert NotEnoughBalance(address(this).balance, fee);

            messageId = IRouterClient(i_router).ccipSend{value: fee}(
                destinationChainSelector,
                message
            );
        }

        messages[data.bundleId].push(
            MessageDesposit({
                depositFundMessage: abi.encode(data),
                messageId: messageId,
                sender: msg.sender,
                sourceChainSelector: chainSelectorId
            })
        );
        emit MessageSent(messageId);
    }

    function _canSetOwner() internal view virtual override returns (bool) {
        return hasRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    event EtherReceived(address indexed sender, uint256 value);

    function supportsInterface(
        bytes4 interfaceId
    ) public pure override(CCIPReceiver, ERC1155Receiver) returns (bool) {}

    function getBundleInfo(
        uint256 bundleId
    )
        public
        view
        returns (
            address[] memory bundle_addresses,
            uint256[] memory bundle_quantities
        )
    {
        uint256 count = getTokenCountOfBundle(bundleId);
        bundle_addresses = new address[](count);
        bundle_quantities = new uint256[](count);
        for (uint256 i = 0; i < count; i += 1) {
            bundle_addresses[i] = getTokenOfBundle(bundleId, i).assetContract;
            bundle_quantities[i] = getTokenOfBundle(bundleId, i).totalAmount;
        }
    }

    function _ccipReceive(
        Client.Any2EVMMessage memory message
    ) internal virtual override {
        ReedeemETFMessage memory reedeemMessage = abi.decode(
            message.data,
            (ReedeemETFMessage)
        );

        require(
            burner[reedeemMessage.bundleId] == address(0),
            "ETFContract: bundleId is already burned"
        );
        _burnCounter += 1;
        // console.log("reedeemMessage.receiver", reedeemMessage.receiver);
        _releaseTokens(reedeemMessage.receiver, reedeemMessage.bundleId);
        burner[reedeemMessage.bundleId] = reedeemMessage.receiver;
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
            areETFBurned[i] = isETFBurned(bundleIds[i]);
        }

        return (bundleIds, addresses, quantities, areMessagesIn, areETFBurned);
    }

    function isETFBurned(uint256 tokenId) public view returns (bool) {
        return burner[tokenId] != address(0);
    }

    function updateBundleCount(uint256 _bundleId) internal {
        // require(bundleIdToETFId[_bundleId] == 0, "cl");
        if (!openedBundle[_bundleId]) {
            bundleCount += 1;
            openedBundle[_bundleId] = true;
        }
    }

    function getBurnedCount() public view returns (uint256) {
        return _burnCounter;
    }

    //  get all required tokens for a bundle
    function getRequiredAssets()
        public
        view
        returns (uint256[] memory quantities, address[] memory addresses)
    {
        // store the count of each token in the bundle and store in an array
        quantities = new uint256[](tokensToWrapQuantity);
        addresses = new address[](tokensToWrapQuantity);
        uint256 index = 0;

        for (uint256 i = 0; i < tokensToWrapQuantity; i += 1) {
            addresses[index] = whitelistedTokens[i];
            quantities[index] = tokenQuantities[whitelistedTokens[i]];
            index += 1;
        }
    }

    function getTokensBundle(
        uint256 _bundleId
    )
        public
        view
        returns (
            uint256[] memory quantities,
            address[] memory addresses,
            MessageDesposit[] memory bundleMessages
        )
    {
        // get the number of tokens in the bundle
        bundleMessages = messages[_bundleId];
        uint256 tokenCount = getTokenCountOfBundle(_bundleId);
        // store the count of each token in the bundle and store in an array
        quantities = new uint256[](tokenCount);
        addresses = new address[](tokenCount);
        for (uint256 i = 0; i < tokenCount; i += 1) {
            quantities[i] = getTokenOfBundle(_bundleId, i).totalAmount;
            addresses[i] = getTokenOfBundle(_bundleId, i).assetContract;
        }
    }

    function getAddressQuantityPerBundle(
        uint256 _bundleId,
        address _address
    )
        public
        view
        returns (
            uint256[] memory quantities,
            address[] memory contractAddresses
        )
    {
        // get the number of tokens in the bundle
        uint256 tokenCount = getTokenCountOfBundle(_bundleId);
        // store the count of each token in the bundle and store in an array
        quantities = new uint256[](tokenCount);
        contractAddresses = new address[](tokenCount);
        for (uint256 i = 0; i < tokenCount; i += 1) {
            address assetContract = getTokenOfBundle(_bundleId, i)
                .assetContract;
            quantities[i] = bundleIdToAddressToTokenAmount[_bundleId][_address][
                i
            ];
            contractAddresses[i] = assetContract;
        }
    }
}
