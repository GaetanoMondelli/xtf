// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LinkTokenInterface} from "./LinkTokenInterface.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
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

contract SidechainDeposit is Ownable, TokenStore, PermissionsEnumerable {
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
    address immutable i_router;
    address immutable i_link;
    address[] public whitelistedTokens;
    mapping(address => uint256) public tokenQuantities;
    mapping(uint256 => mapping(address => bool)) public addressInBundleId;
    mapping(uint256 => address[]) public bundleIdToAddress;
    mapping(uint256 => mapping(address => mapping(uint256 => uint256)))
        public bundleIdToAddressToTokenAmount;

    event MessageSent(bytes32 messageId);

    constructor(
        address _primaryEtfContract,
        address router,
        address link,
        address _nativeTokenWrapper,
        TokenAmounts[] memory _whitelistedTokenAmounts
    ) TokenStore(_nativeTokenWrapper) {
        i_router = router;
        i_link = link;
        LinkTokenInterface(i_link).approve(i_router, type(uint256).max);
        // _revokeRole(ASSET_ROLE, address(0));
        // remove the msg.sender from the MINTER_ROLE and add the 0 address to the MINTER_ROLE
        //  for disable MINTER_ROLE
        // _revokeRole(MINTER_ROLE, msg.sender);
        _setupRole(MINTER_ROLE, address(0));
        _setupOwner(msg.sender);

        for (uint256 i = 0; i < _whitelistedTokenAmounts.length; i += 1) {
            _setupRole(ASSET_ROLE, _whitelistedTokenAmounts[i].assetContract);
            tokenQuantities[
                _whitelistedTokenAmounts[i].assetContract
            ] = _whitelistedTokenAmounts[i].amount;
            // push the token address to the whitelistedTokens array
            whitelistedTokens.push(_whitelistedTokenAmounts[i].assetContract);
        }

        _setupRole(ASSET_ROLE, NATIVE_TOKEN);
        primaryEtfContract = _primaryEtfContract;
    }

    receive() external payable {
        emit EtherReceived(msg.sender, msg.value);
    }

    function depositFundsAndNotify(
        uint256 _bundleId,
        Token[] memory _tokensToWrap
    ) external payable returns (bytes32 messageId) {
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

                    // check if the token quantity + current quantity is not greater than the quantity required
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

                    // update the token quantity
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
        return send(1, primaryEtfContract, abi.encode(_tokensToWrap), PayFeesIn.Native);
    }

    function send(
        uint64 destinationChainSelector,
        address receiver,
        bytes memory data,
        PayFeesIn payFeesIn
    ) public returns (bytes32 messageId) {
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(receiver),
            data: data,
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: "",
            feeToken: payFeesIn == PayFeesIn.LINK ? i_link : address(0)
        });

        uint256 fee = IRouterClient(i_router).getFee(
            destinationChainSelector,
            message
        );

        if (payFeesIn == PayFeesIn.LINK) {
            // LinkTokenInterface(i_link).approve(i_router, fee);
            messageId = IRouterClient(i_router).ccipSend(
                destinationChainSelector,
                message
            );
        } else {
            messageId = IRouterClient(i_router).ccipSend{value: fee}(
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
}
