// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import {IETFToken} from "./ETFTokenContract.sol";
import {Ownable} from "@thirdweb-dev/contracts/extension/Ownable.sol";
import {ITokenBundle} from "@thirdweb-dev/contracts/extension/interface/ITokenBundle.sol";
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

// import ERC721Multiwrap

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

contract ETFv2 is
    TokenStore,
    ERC721A,
    ContractMetadata,
    Ownable,
    DefaultOperatorFilterer,
    CCIPReceiver
{
    /*//////////////////////////////////////////////////////////////
                    Permission control roles
    //////////////////////////////////////////////////////////////*/

    /// @dev Only MINTER_ROLE holders can wrap tokens, when wrapping is restricted.
    bytes32 private constant MINTER_ROLE = keccak256("MINTER_ROLE");
    /// @dev Only UNWRAP_ROLE holders can unwrap tokens, when unwrapping is restricted.
    bytes32 private constant UNWRAP_ROLE = keccak256("UNWRAP_ROLE");
    /// @dev Only assets with ASSET_ROLE can be wrapped, when wrapping is restricted to particular assets.
    bytes32 private constant ASSET_ROLE = keccak256("ASSET_ROLE");
    /// @dev The address interpreted as native token of the chain.
    /// @dev Only transfers to or from TRANSFER_ROLE holders are valid, when transfers are restricted.
    bytes32 public constant TRANSFER_ROLE = keccak256("TRANSFER_ROLE");
    address public constant NATIVE_TOKEN =
        0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    // router for different chain assets
    address public router;
    // uri for the ETF Token
    string public uriETFToken;
    // check state to prevent users to invoke wrap function directly
    bool private disableMint;
    // address of ETF Token
    address public etfTokenAddress;
    // number of ETF Token that are minted per wrap
    uint256 public etfTokenPerWrap;
    // Percentage fee for the ETF
    uint256 public percentageFee;
    // last ETF reedemed
    uint256 public lastETFReedemed;
    // current chain selector id
    uint64 public currentChainSelectorId;
    // All the blockchain that have assets wrapped in the ETF
    uint64[] public chainSelectorIds;
    // ChainSelectorId in the ETF
    mapping(uint64 => bool) public chainSelectorIdInETF;
    // map of whitelisted tokens per chainIdSelector
    mapping(uint64 => mapping(address => bool)) public isWhiteListedToken;
    // whitelist of token addresses for the ETF
    mapping(uint64 => address[]) public whitelistedTokens;
    // number of tokens that must be wrapped per etf
    uint256 public tokensToWrapQuantity;
    // mapping of token address to  quantity of token that must be wrapped per etf
    mapping(uint64 => mapping(address => uint256)) public tokenQuantities;
    // map from bundleId to ETFId(TokenId)
    mapping(uint256 => uint256) public bundleIdToETFId;
    // mapping in each bundle how many of each tokens each address has sent
    mapping(uint256 => mapping(address => bool)) public addressInBundleId;
    mapping(uint256 => address[]) public bundleIdToAddress;
    mapping(uint64 => mapping(uint256 => mapping(address => mapping(uint256 => uint256))))
        public bundleIdToAddressToTokenAmount;
    mapping(address => AggregatorV3Interface) tokenIdToDataFeed;
    // mapping of token address to price
    mapping(address => uint256) public addressToAmount;
    // mapping bundleId to mapping of index to chainIdSelector
    mapping(uint256 => mapping(uint256 => uint64))
        public bundleIdToChainIdSelector;

    uint256 public bundleCount = 0;
    mapping(uint256 => bool) public openedBundle;

    struct DepositFundMessage {
        uint256 bundleId;
        ITokenBundle.Token[] tokensToWrap;
    }

    // mappint of etf token id to expiration time for the lock
    mapping(uint256 => uint) public tokenIdToExpirationTime;

    uint lockTime = 1 minutes;

    constructor(
        string memory _name,
        string memory _symbol,
        address _nativeTokenWrapper,
        address _etfTokenAddress,
        uint256 _etfTokenPerWrap,
        uint256 _percentageFee,
        TokenAmounts[] memory _whitelistedTokenAmounts,
        string memory _uriETFToken,
        uint64 _currentChainSelectorId,
        address _router
    )
        ERC721A(_name, _symbol)
        TokenStore(_nativeTokenWrapper)
        CCIPReceiver(_router)
    {
        _setupOwner(msg.sender);
        _setOperatorRestriction(true);

        // _revokeRole(ASSET_ROLE, address(0));
        // _setupRole(MINTER_ROLE, address(0));

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

        uriETFToken = _uriETFToken;
        etfTokenAddress = _etfTokenAddress;
        tokensToWrapQuantity = _whitelistedTokenAmounts.length;
        etfTokenPerWrap = _etfTokenPerWrap;
        percentageFee = _percentageFee;
        disableMint = true;
        lastETFReedemed = 0;
        router = _router;
        currentChainSelectorId = _currentChainSelectorId;
    }

    // Receive function
    receive() external payable {
        emit EtherReceived(msg.sender, msg.value);
    }

    // depositFunds function receive a list of Tokens and put them in an unclosed
    function depositFunds(
        uint256 _bundleId,
        Token[] memory _tokensToWrap
    ) external payable returns (bool canBeClosed) {
        // check if the bundleId is not already used
        require(
            bundleIdToETFId[_bundleId] == 0,
            "ETFContract: bundleId was already closed for an ETF"
        );

        validateTokensToWrap(_tokensToWrap, currentChainSelectorId);
        updateBundleCount(_bundleId);
        addAddressToBundle(_bundleId, msg.sender);

        updateTokenToWrapQuantity(
            _bundleId,
            _tokensToWrap,
            currentChainSelectorId,
            msg.sender
        );

        _transferTokenBatch(msg.sender, address(this), _tokensToWrap);

        canBeClosed = checkIfBundleCanBeClosed(_bundleId);

        if (canBeClosed) {
            closeBundle(_bundleId);
        }
    }

    // reedem ETF function
    function reedemETF(uint256 bundleId) public returns (uint256 etfId) {
        require(
            IERC20(etfTokenAddress).balanceOf(msg.sender) >= etfTokenPerWrap,
            "ETFContract: msg.sender does not have enough ETF Tokens"
        );
        etfId = bundleIdToETFId[bundleId];
        require(
            tokenIdToExpirationTime[etfId] < block.timestamp,
            "ETFContract: ETF Token is still locked"
        );

        IETFToken(etfTokenAddress).burn(msg.sender, etfTokenPerWrap);

        _releaseTokens(msg.sender, bundleId);
        _burn(etfId);

        lastETFReedemed += 1;
        return lastETFReedemed - 1;
    }

    //  get all required tokens for a bundle
    function getRequiredAssets()
        public
        view
        returns (
            uint256[] memory quantities,
            address[] memory addresses,
            uint64[] memory selectorsIds
        )
    {
        // store the count of each token in the bundle and store in an array
        quantities = new uint256[](tokensToWrapQuantity);
        addresses = new address[](tokensToWrapQuantity);
        selectorsIds = new uint64[](tokensToWrapQuantity);
        for (uint256 c = 0; c < chainSelectorIds.length; c++) {
            uint64 chainSelectorId = chainSelectorIds[c];
            for (uint256 i = 0; i < tokensToWrapQuantity; i += 1) {
                quantities[i] = tokenQuantities[chainSelectorId][
                    whitelistedTokens[chainSelectorId][i]
                ];
                addresses[i] = whitelistedTokens[chainSelectorId][i];
                selectorsIds[i] = chainSelectorId;
            }
        }
    }

    // get the number of tokens in a bundle
    function getTokensBundle(
        uint256 _bundleId
    )
        public
        view
        returns (
            uint256[] memory quantities,
            address[] memory addresses,
            uint64[] memory selectorIds
        )
    {
        // get the number of tokens in the bundle
        uint256 tokenCount = getTokenCountOfBundle(_bundleId);
        // store the count of each token in the bundle and store in an array
        quantities = new uint256[](tokenCount);
        addresses = new address[](tokenCount);
        selectorIds = new uint64[](tokenCount);
        for (uint256 i = 0; i < tokenCount; i += 1) {
            quantities[i] = getTokenOfBundle(_bundleId, i).totalAmount;
            addresses[i] = getTokenOfBundle(_bundleId, i).assetContract;
            selectorIds[i] = bundleIdToChainIdSelector[_bundleId][i];
        }
    }

    // Event to log the received Ether
    event EtherReceived(address indexed sender, uint256 value);
    event MessageReceived(
        bytes32 messageId,
        uint64 chainId,
        address sender,
        bytes data
    );

    function validateTokensToWrap(Token[] memory tokensToWrap, uint64 chainSelectorId) internal view {
        for (uint256 i = 0; i < tokensToWrap.length; i += 1) {
            // check each assetContract is whitelisted
            require(
                // hasRole(ASSET_ROLE, tokensToWrap[i].assetContract),
                isWhiteListedToken[chainSelectorId][
                    tokensToWrap[i].assetContract
                ],
                "ETFContract: assetContract is not whitelisted"
            );

            // check each assetContract is not duplicated
            for (uint256 j = i + 1; j < tokensToWrap.length; j += 1) {
                require(
                    tokensToWrap[i].assetContract !=
                        tokensToWrap[j].assetContract,
                    "ETFContract: assetContract is duplicated"
                );
            }
        }
    }

    function addAddressToBundle(uint256 bundleId, address _address) internal {
        if (!addressInBundleId[bundleId][_address]) {
            bundleIdToAddress[bundleId].push(_address);
        }
        addressInBundleId[bundleId][_address] = true;
    }

    function updateBundleCount(uint256 _bundleId) internal {
        if (!openedBundle[_bundleId]) {
            bundleCount += 1;
            openedBundle[_bundleId] = true;
        }
    }

    function updateTokenToWrapQuantity(
        uint256 bundleId,
        ITokenBundle.Token[] memory tokensToWrap,
        uint64 chainIdSelector,
        address depositAddress
    ) internal {
        for (uint256 i = 0; i < tokensToWrap.length; i += 1) {
            bool tokenAlreadyInBundle = false;

            for (uint256 j = 0; j < getTokenCountOfBundle(bundleId); j += 1) {
                if (
                    getTokenOfBundle(bundleId, j).assetContract ==
                    tokensToWrap[i].assetContract
                ) {
                    tokenAlreadyInBundle = true;

                    // check if the token quantity + current quantity is not greater than the quantity required
                    if (
                        getTokenOfBundle(bundleId, j).totalAmount +
                            tokensToWrap[i].totalAmount >
                        tokenQuantities[chainIdSelector][
                            getTokenOfBundle(bundleId, j).assetContract
                        ]
                    ) {
                        tokensToWrap[i].totalAmount =
                            tokenQuantities[chainIdSelector][
                                getTokenOfBundle(bundleId, j).assetContract
                            ] -
                            getTokenOfBundle(bundleId, j).totalAmount;
                    }

                    // update the token quantity
                    _updateTokenInBundle(
                        Token(
                            tokensToWrap[i].assetContract,
                            tokensToWrap[i].tokenType,
                            tokensToWrap[i].tokenId,
                            getTokenOfBundle(bundleId, j).totalAmount +
                                tokensToWrap[i].totalAmount
                        ),
                        bundleId,
                        j
                    );
                    // update the bundleIdToAddressToTokenAmount
                    bundleIdToAddressToTokenAmount[chainIdSelector][bundleId][
                        depositAddress
                    ][j] += tokensToWrap[i].totalAmount;
                }
            }

            // if the token is not already in the bundle, add it
            if (!tokenAlreadyInBundle) {
                _addTokenInBundle(
                    Token(
                        tokensToWrap[i].assetContract,
                        tokensToWrap[i].tokenType,
                        tokensToWrap[i].tokenId,
                        tokensToWrap[i].totalAmount
                    ),
                    bundleId
                );

                bundleIdToChainIdSelector[bundleId][
                    getTokenCountOfBundle(bundleId) - 1
                ] = chainIdSelector;

                bundleIdToAddressToTokenAmount[chainIdSelector][bundleId][
                    depositAddress
                ][getTokenCountOfBundle(bundleId) - 1] += tokensToWrap[i]
                    .totalAmount;
            }
        }
    }

    function checkIfBundleCanBeClosed(
        uint256 bundleId
    ) internal view returns (bool) {
        bool canBeClosed = true;
        if (getTokenCountOfBundle(bundleId) != tokensToWrapQuantity) {
            canBeClosed = false;
        }

        for (uint256 c = 0; c < chainSelectorIds.length; c++) {
            uint64 chainSelectorId = chainSelectorIds[c];
            for (uint256 i = 0; i < getTokenCountOfBundle(bundleId); i += 1) {
                if (
                    getTokenOfBundle(bundleId, i).totalAmount <
                    tokenQuantities[chainSelectorId][
                        getTokenOfBundle(bundleId, i).assetContract
                    ]
                ) {
                    canBeClosed = false;
                }
            }
        }
        return canBeClosed;
    }

    function _ccipReceive(
        Client.Any2EVMMessage memory message
    ) internal virtual override {
        emit MessageReceived(
            message.messageId,
            message.sourceChainSelector,
            address(bytes20(message.sender)),
            message.data
        );

        // decode data as DepositFundMessage

        DepositFundMessage memory depositFundMessage = abi.decode(
            message.data,
            (DepositFundMessage)
        );

        // check if the chainIdSelector is in the ETF
        require(
            chainSelectorIdInETF[message.sourceChainSelector],
            "ETFContract: chainIdSelector is not in the ETF"
        );

        // check if the bundleId is not already closed
        require(
            bundleIdToETFId[depositFundMessage.bundleId] == 0,
            "ETFContract: bundleId was already closed for an ETF"
        );

        validateTokensToWrap(depositFundMessage.tokensToWrap, message.sourceChainSelector);
        updateBundleCount(depositFundMessage.bundleId);
        addAddressToBundle(
            depositFundMessage.bundleId,
            address(bytes20(message.sender))
        );

        updateTokenToWrapQuantity(
            depositFundMessage.bundleId,
            depositFundMessage.tokensToWrap,
            message.sourceChainSelector,
            address(bytes20(message.sender))
        );

        bool canBeClosed = checkIfBundleCanBeClosed(
            depositFundMessage.bundleId
        );

        if (canBeClosed) {
            closeBundle(depositFundMessage.bundleId);
        }
    }

    function closeBundle(uint256 bundleId) internal returns (uint256 tokenId) {
        tokenId = nextTokenIdToMint();

        bundleIdToETFId[bundleId] = tokenId;

        _safeMint(address(this), 1);

        tokenIdToExpirationTime[tokenId] = block.timestamp + lockTime;

        uint256 fee = (etfTokenPerWrap * percentageFee) / 100;

        uint256 remainingAmount = etfTokenPerWrap - fee;

        // ETFToken(etfTokenAddress).mint(msg.sender, etfTokenPerWrap - fee);
        // calculate the total value of the bundle
        uint256 totalValue = 0;
        for (uint256 i = 0; i < getTokenCountOfBundle(bundleId); i += 1) {
            uint256 priceAggrDecimals = tokenIdToDataFeed[
                getTokenOfBundle(bundleId, i).assetContract
            ].decimals();
            uint256 tokenDecimals = 18;
            if (getTokenOfBundle(bundleId, i).assetContract != NATIVE_TOKEN) {
                tokenDecimals = IERC20Metadata(
                    getTokenOfBundle(bundleId, i).assetContract
                ).decimals();
            }

            (, /* uint80 roundID */ int answer, , , ) = tokenIdToDataFeed[
                getTokenOfBundle(bundleId, i).assetContract
            ].latestRoundData();

            totalValue +=
                uint256(answer) *
                // 10 ** (tokenDecimals - priceAggrDecimals) * // scale the price to the token decimals
                getTokenOfBundle(bundleId, i).totalAmount;
        }

        require(
            totalValue > 0,
            "ETFContract: totalValue of the bundle must be greater than 0"
        );

        //  different account have contributed to the bundle in proportion to the value of the tokens they sent,
        //  they can have different amount of tokens
        //  for each address, we calculate the amount of tokens to send
        //  populate the addressToAmount mapping
        // first let's iterate over bundleIdToAddress

        for (uint256 c = 0; c < chainSelectorIds.length; c++) {
            uint64 chainSelectorId = chainSelectorIds[c];

            for (
                uint256 i = 0;
                i < bundleIdToAddress[bundleId].length;
                i += 1
            ) {
                // calculate the amount of tokens to send to the address
                address addressToSend = bundleIdToAddress[bundleId][i];
                uint256 amountToSend = 0;
                mapping(uint256 => uint)
                    storage tokenIdToAmount = bundleIdToAddressToTokenAmount[
                        chainSelectorId
                    ][bundleId][addressToSend];

                for (
                    uint256 j = 0;
                    j < getTokenCountOfBundle(bundleId);
                    j += 1
                ) {
                    address assetContract = getTokenOfBundle(bundleId, j)
                        .assetContract;

                    (, int answer, , , ) = tokenIdToDataFeed[assetContract]
                        .latestRoundData();

                    amountToSend +=
                        (remainingAmount *
                            // 10 ** (tokenDecimals - priceAggrDecimals) * // scale the price to the token decimals
                            (uint256(answer) * tokenIdToAmount[j])) /
                        totalValue;
                }
                addressToAmount[addressToSend] += amountToSend;
            }
        }

        // transfer the tokens to each address

        for (uint256 i = 0; i < bundleIdToAddress[bundleId].length; i += 1) {
            if (addressToAmount[bundleIdToAddress[bundleId][i]] > 0) {
                IETFToken(etfTokenAddress).mint(
                    bundleIdToAddress[bundleId][i],
                    addressToAmount[bundleIdToAddress[bundleId][i]]
                );
            }
        }

        for (uint256 i = 0; i < bundleIdToAddress[bundleId].length; i += 1) {
            addressToAmount[bundleIdToAddress[bundleId][i]] = 0;
        }

        IETFToken(etfTokenAddress).mint(owner(), fee);
    }

    function getAllAddressesForBundleId(
        uint256 bundleId
    ) public view returns (address[] memory) {
        return bundleIdToAddress[bundleId];
    }

    // this could be too much to maintain if many addresses are in the bundle
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
            quantities[i] = bundleIdToAddressToTokenAmount[
                bundleIdToChainIdSelector[_bundleId][i]
            ][_bundleId][_address][i];
            contractAddresses[i] = assetContract;
        }
    }

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

    function _startTokenId() internal pure override returns (uint256) {
        return 1;
    }

    function nextTokenIdToMint() public view virtual returns (uint256) {
        return _currentIndex;
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
            uint64[] memory selectorsIds,
            bool[] memory areETFBurned
        )
    {
        bundleIds = new uint256[](items);
        addresses = new address[](items);
        quantities = new uint256[][](items);
        selectorsIds = new uint64[](items);
        areETFBurned = new bool[](items);
        for (uint256 i = 0; i < items; i++) {
            uint256 currentIndex = i + offset;
            bundleIds[i] = currentIndex;

            uint256 qt = getTokenCountOfBundle(bundleIds[i]);
            uint256[] memory bundlequantities = new uint256[](qt);
            if (qt > 0) {
                addresses[i] = bundleIdToAddress[bundleIds[i]][0];
                selectorsIds[i] = bundleIdToChainIdSelector[bundleIds[i]][0];
                for (uint256 j = 0; j < qt; j++) {
                    bundlequantities[j] = getTokenOfBundle(bundleIds[i], j)
                        .totalAmount;
                }
            }
            quantities[i] = bundlequantities;
            areETFBurned[i] = isETFBurned(bundleIdToETFId[bundleIds[i]]);
        }

        return (bundleIds, addresses, quantities, selectorsIds, areETFBurned);
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        pure
        override(CCIPReceiver, ERC1155Receiver, ERC721A)
        returns (bool)
    {}

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
        return true;
    }
}
