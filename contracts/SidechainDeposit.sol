// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LinkTokenInterface} from "./LinkTokenInterface.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@thirdweb-dev/contracts/base/ERC721Multiwrap.sol";
import "@thirdweb-dev/contracts/extension/TokenStore.sol";
import "@thirdweb-dev/contracts/lib/CurrencyTransferLib.sol";
import "@thirdweb-dev/contracts/base/ERC721Base.sol";
import "@thirdweb-dev/contracts/extension/TokenStore.sol";
import "hardhat/console.sol";

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

struct ReedeemETFMessage {
    uint256 bundleId;
    address receiver;
}

contract SidechainDeposit is
    Ownable,
    TokenStore,
    PermissionsEnumerable,
    CCIPReceiver
{
    enum PayFeesIn {
        Native,
        LINK
    }
    address public constant NATIVE_TOKEN =
        0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    bytes32 private constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 private constant UNWRAP_ROLE = keccak256("UNWRAP_ROLE");
    bytes32 private constant ASSET_ROLE = keccak256("ASSET_ROLE");
    address immutable primaryEtfContract;
    address immutable i_link;
    address router;
    address[] public whitelistedTokens;
    uint64 public primaryChainSelectorId;
    uint64 immutable chainSelectorId;
    mapping(address => uint256) public tokenQuantities;
    mapping(uint256 => mapping(address => bool)) public addressInBundleId;
    mapping(uint256 => address[]) public bundleIdToAddress;
    mapping(uint256 => mapping(address => mapping(uint256 => uint256)))
        public bundleIdToAddressToTokenAmount;
    mapping(uint256 => address) public burner;

    event MessageSent(bytes32 messageId);

    struct DepositFundMessage {
        uint256 bundleId;
        Token[] tokensToWrap;
    }

    constructor(
        uint64 _primaryChainSelectorId,
        uint64 _chainSelectorId,
        address _primaryEtfContract,
        address _router,
        address _link,
        address _nativeTokenWrapper,
        TokenAmounts[] memory _whitelistedTokenAmounts
    ) TokenStore(_nativeTokenWrapper) CCIPReceiver(router) {
        router = _router;
        i_link = _link;
        LinkTokenInterface(i_link).approve(router, type(uint256).max);
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
    }

    receive() external payable {
        emit EtherReceived(msg.sender, msg.value);
    }

    function depositFundsAndNotify(
        uint256 _bundleId,
        Token[] memory _tokensToWrap
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
        DepositFundMessage memory message = DepositFundMessage({
            bundleId: _bundleId,
            tokensToWrap: _tokensToWrap
        });
        return
            send(
                primaryChainSelectorId,
                primaryEtfContract,
                message,
                PayFeesIn.Native
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
            extraArgs: "",
            feeToken: payFeesIn == PayFeesIn.LINK ? i_link : address(0)
        });

        uint256 fee = IRouterClient(router).getFee(
            destinationChainSelector,
            message
        );

        if (payFeesIn == PayFeesIn.LINK) {
            // LinkTokenInterface(i_link).approve(router, fee);
            messageId = IRouterClient(router).ccipSend(
                destinationChainSelector,
                message
            );
        } else {
            messageId = IRouterClient(router).ccipSend{value: fee}(
                destinationChainSelector,
                message
            );
        }

        emit MessageSent(messageId);
    }

    function _canSetOwner() internal view virtual override returns (bool) {
        return hasRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    event EtherReceived(address indexed sender, uint256 value);

    function supportsInterface(
        bytes4 interfaceId
    ) public pure override(CCIPReceiver, ERC1155Receiver) returns (bool) {}

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
        _releaseTokens(reedeemMessage.receiver, reedeemMessage.bundleId);
        burner[reedeemMessage.bundleId] = msg.sender;
    }
}