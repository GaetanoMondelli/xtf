// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./ETFTokenContract.sol";
import "@thirdweb-dev/contracts/extension/Ownable.sol";
import "@thirdweb-dev/contracts/base/ERC721Multiwrap.sol";
import "@thirdweb-dev/contracts/extension/TokenStore.sol";
import "@thirdweb-dev/contracts/lib/CurrencyTransferLib.sol";
import "@thirdweb-dev/contracts/base/ERC721Base.sol";
import "@thirdweb-dev/contracts/extension/TokenStore.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import "hardhat/console.sol";

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

contract ETFv2 is Ownable, ERC721Multiwrap, CCIPReceiver {
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

    struct DepositFundMessage {
        uint256 bundleId;
        Token[] tokensToWrap;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        RoyaltyInfo memory _royalty,
        address _nativeTokenWrapper,
        address _etfTokenAddress,
        uint256 _etfTokenPerWrap,
        uint256 _percentageFee,
        TokenAmounts[] memory _whitelistedTokenAmounts,
        string memory _uriETFToken,
        uint64 _currentChainSelectorId,
        address _router
    )
        ERC721Multiwrap(
            msg.sender,
            _name,
            _symbol,
            _royalty.recipient,
            uint128(_royalty.bps),
            _nativeTokenWrapper
        )
        CCIPReceiver(_router)
    {
        _revokeRole(ASSET_ROLE, address(0));
        _revokeRole(MINTER_ROLE, msg.sender);
        _setupRole(MINTER_ROLE, address(0));
        _setupOwner(msg.sender);

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
            _setupRole(ASSET_ROLE, _whitelistedTokenAmounts[i].assetContract);
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

        // require(
        //     containNativeTokenAmount,
        //     "ETFContract: native currency must be listed in _whitelistedTokenAmounts"
        // );

        _setupRole(ASSET_ROLE, NATIVE_TOKEN);
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
        // check that the token sent are whitelisted
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

        // set to the bundle for each token the max
        // ( tokenQuantities[assetContract] - currentTokenQuantity, _tokensToWrap[i].totalAmount)
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
                        tokenQuantities[currentChainSelectorId][
                            getTokenOfBundle(_bundleId, j).assetContract
                        ]
                    ) {
                        _tokensToWrap[i].totalAmount =
                            tokenQuantities[currentChainSelectorId][
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
                    bundleIdToAddressToTokenAmount[currentChainSelectorId][
                        _bundleId
                    ][msg.sender][j] += _tokensToWrap[i].totalAmount;
                }
            }
            // if the token is not already in the bundle, add it
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

                bundleIdToAddressToTokenAmount[currentChainSelectorId][
                    _bundleId
                ][msg.sender][
                    getTokenCountOfBundle(_bundleId) - 1
                ] += _tokensToWrap[i].totalAmount;
            }
        }

        // transfer the tokens to the contract

        _transferTokenBatch(msg.sender, address(this), _tokensToWrap);

        // check if the bundle can be closed

        canBeClosed = true;

        // if leght of bundle is not equal to tokensToWrapQuantity, canBeClosed = false
        if (getTokenCountOfBundle(_bundleId) != tokensToWrapQuantity) {
            canBeClosed = false;
        }

        for (uint256 c = 0; c < chainSelectorIds.length; c++) {
            uint64 chainSelectorId = chainSelectorIds[c];
            for (uint256 i = 0; i < getTokenCountOfBundle(_bundleId); i += 1) {
                if (
                    getTokenOfBundle(_bundleId, i).totalAmount <
                    tokenQuantities[chainSelectorId][
                        getTokenOfBundle(_bundleId, i).assetContract
                    ]
                ) {
                    canBeClosed = false;
                }
            }
        }

        if (canBeClosed) {
            console.log("canBeClosed: %s", canBeClosed);

            uint256 tokenId = nextTokenIdToMint();

            bundleIdToETFId[_bundleId] = tokenId;

            _safeMint(address(this), 1);

            uint256 fee = (etfTokenPerWrap * percentageFee) / 100;

            uint256 remainingAmount = etfTokenPerWrap - fee;

            // ETFToken(etfTokenAddress).mint(msg.sender, etfTokenPerWrap - fee);
            // calculate the total value of the bundle
            uint256 totalValue = 0;
            for (uint256 i = 0; i < getTokenCountOfBundle(_bundleId); i += 1) {
                (, /* uint80 roundID */ int answer, , , ) = tokenIdToDataFeed[
                    getTokenOfBundle(_bundleId, i).assetContract
                ].latestRoundData();

                totalValue +=
                    uint256(answer) *
                    getTokenOfBundle(_bundleId, i).totalAmount;
            }

            require(
                totalValue > 0,
                "ETFContract: totalValue of the bundle must be greater than 0"
            );

            //  different account have contributed to the bundle in proportion to the value of the tokens they sent, they can have different amount of tokens
            // for each address, calculate the amount of tokens to send
            //  populate the addressToAmount mapping
            // first let's iterate over bundleIdToAddress

            for (uint256 c = 0; c < chainSelectorIds.length; c++) {
                uint64 chainSelectorId = chainSelectorIds[c];

                for (
                    uint256 i = 0;
                    i < bundleIdToAddress[_bundleId].length;
                    i += 1
                ) {
                    // calculate the amount of tokens to send to the address
                    address addressToSend = bundleIdToAddress[_bundleId][i];
                    uint256 amountToSend = 0;
                    mapping(uint256 => uint)
                        storage tokenIdToAmount = bundleIdToAddressToTokenAmount[
                            chainSelectorId
                        ][_bundleId][addressToSend];

                    for (
                        uint256 j = 0;
                        j < getTokenCountOfBundle(_bundleId);
                        j += 1
                    ) {
                        address assetContract = getTokenOfBundle(_bundleId, j)
                            .assetContract;

                        (, int answer, , , ) = tokenIdToDataFeed[assetContract]
                            .latestRoundData();

                        amountToSend +=
                            (remainingAmount *
                                (uint256(answer) * tokenIdToAmount[j])) /
                            totalValue;
                    }
                    addressToAmount[addressToSend] += amountToSend;
                }
            }
            // transfer the tokens to each address

            for (
                uint256 i = 0;
                i < bundleIdToAddress[_bundleId].length;
                i += 1
            ) {
                if (addressToAmount[bundleIdToAddress[_bundleId][i]] > 0) {
                    ETFToken(etfTokenAddress).mint(
                        bundleIdToAddress[_bundleId][i],
                        addressToAmount[bundleIdToAddress[_bundleId][i]]
                    );
                }
            }

            ETFToken(etfTokenAddress).mint(owner(), fee);

            emit TokensWrapped(
                msg.sender,
                address(this),
                tokenId,
                _tokensToWrap
            );
        }
    }

    // mint an entire etf
    function mint(
        address _to,
        Token[] calldata _tokensToWrap
    ) external payable returns (uint256 tokenId) {
        require(
            chainSelectorIds.length == 1 &&
                chainSelectorIds[0] == currentChainSelectorId,
            "ETFContract: chainSelectorIds must be equal to 1"
        );

        uint256 nativeCurrencyIndex = _tokensToWrap.length;

        // check length of _tokenToWrap ot be maxTokenTypeQuantity
        require(
            _tokensToWrap.length == tokensToWrapQuantity,
            "ETFContract: length of _tokensToWrap must be equal to tokensToWrapQuantity"
        );

        // check each assetContract is whitelisted and quantity is equal to maxTokenQuantity
        for (uint256 i = 0; i < _tokensToWrap.length; i += 1) {
            // check if native currency is listed in _tokensToWrap
            if (_tokensToWrap[i].assetContract == NATIVE_TOKEN) {
                nativeCurrencyIndex = i;
            }

            // check each assetContract is whitelisted
            require(
                hasRole(ASSET_ROLE, _tokensToWrap[i].assetContract),
                "ETFContract: assetContract is not whitelisted"
            );
            // check quantity is equal to tokenQuantities[assetContract]
            require(
                _tokensToWrap[i].totalAmount ==
                    tokenQuantities[currentChainSelectorId][
                        _tokensToWrap[i].assetContract
                    ],
                "ETFContract: quantity must be equal to the maxTokenQuantity"
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

        // require isNativeCurrencyIncluded to be true
        require(
            nativeCurrencyIndex != _tokensToWrap.length,
            "ETFContract: native currency is not included in token list"
        );

        uint256 etfId = _wrap(
            _tokensToWrap,
            uriETFToken,
            address(this),
            msg.sender
        );
        console.log("etfId: %s", etfId, address(this), msg.sender);

        uint256 fee = (etfTokenPerWrap * percentageFee) / 100;

        ETFToken(etfTokenAddress).mint(_to, etfTokenPerWrap - fee);

        ETFToken(etfTokenAddress).mint(owner(), fee);

        return etfId;
    }

    function depositFundsFromRemoteChain(
        uint256 _bundleId,
        Token[] memory _tokensWrapped,
        address _sender,
        uint64 _chainIdSelector
    ) internal returns (bool canBeClosed) {
        // check if the bundleId is not already used
        require(
            bundleIdToETFId[_bundleId] == 0,
            "ETFContract: bundleId was already closed for an ETF"
        );
        // check that the token sent are whitelisted
        for (uint256 i = 0; i < _tokensWrapped.length; i += 1) {
            // check each assetContract is whitelisted
            require(
                hasRole(ASSET_ROLE, _tokensWrapped[i].assetContract),
                "ETFContract: assetContract is not whitelisted"
            );

            // check each assetContract is not duplicated
            for (uint256 j = i + 1; j < _tokensWrapped.length; j += 1) {
                require(
                    _tokensWrapped[i].assetContract !=
                        _tokensWrapped[j].assetContract,
                    "ETFContract: assetContract is duplicated"
                );
            }
        }

        // set to the bundle for each token the max ( tokenQuantities[assetContract] - currentTokenQuantity, _tokensToWrap[i].totalAmount)
        if (!addressInBundleId[_bundleId][_sender]) {
            bundleIdToAddress[_bundleId].push(_sender);
        }
        addressInBundleId[_bundleId][_sender] = true;

        for (uint256 i = 0; i < _tokensWrapped.length; i += 1) {
            // check if the token is already in the bundle
            bool tokenAlreadyInBundle = false;

            for (uint256 j = 0; j < getTokenCountOfBundle(_bundleId); j += 1) {
                if (
                    getTokenOfBundle(_bundleId, j).assetContract ==
                    _tokensWrapped[i].assetContract
                ) {
                    tokenAlreadyInBundle = true;

                    // check if the token quantity + current quantity is not greater than the quantity required
                    if (
                        getTokenOfBundle(_bundleId, j).totalAmount +
                            _tokensWrapped[i].totalAmount >
                        tokenQuantities[_chainIdSelector][
                            getTokenOfBundle(_bundleId, j).assetContract
                        ]
                    ) {
                        _tokensWrapped[i].totalAmount =
                            tokenQuantities[_chainIdSelector][
                                getTokenOfBundle(_bundleId, j).assetContract
                            ] -
                            getTokenOfBundle(_bundleId, j).totalAmount;
                    }

                    // update the token quantity
                    _updateTokenInBundle(
                        Token(
                            _tokensWrapped[i].assetContract,
                            _tokensWrapped[i].tokenType,
                            _tokensWrapped[i].tokenId,
                            getTokenOfBundle(_bundleId, j).totalAmount +
                                _tokensWrapped[i].totalAmount
                        ),
                        _bundleId,
                        j
                    );
                    // update the bundleIdToAddressToTokenAmount
                    bundleIdToAddressToTokenAmount[_chainIdSelector][_bundleId][
                        _sender
                    ][j] += _tokensWrapped[i].totalAmount;
                }
            }

            // if the token is not already in the bundle, add it
            if (!tokenAlreadyInBundle) {
                _addTokenInBundle(
                    Token(
                        _tokensWrapped[i].assetContract,
                        _tokensWrapped[i].tokenType,
                        _tokensWrapped[i].tokenId,
                        _tokensWrapped[i].totalAmount
                    ),
                    _bundleId
                );

                bundleIdToAddressToTokenAmount[_chainIdSelector][_bundleId][
                    _sender
                ][getTokenCountOfBundle(_bundleId) - 1] += _tokensWrapped[i]
                    .totalAmount;
            }
        }
    }

    function _wrap(
        Token[] calldata _tokensToWrap,
        string memory _uriForWrappedToken,
        address _recipient,
        address _sender
    ) internal onlyRoleWithSwitch(MINTER_ROLE) returns (uint256 tokenId) {
        if (!hasRole(ASSET_ROLE, address(0))) {
            for (uint256 i = 0; i < _tokensToWrap.length; i += 1) {
                _checkRole(ASSET_ROLE, _tokensToWrap[i].assetContract);
            }
        }

        tokenId = nextTokenIdToMint();

        _storeTokens(_sender, _tokensToWrap, _uriForWrappedToken, tokenId);

        _safeMint(_recipient, 1);

        emit TokensWrapped(_sender, _recipient, tokenId, _tokensToWrap);
    }

    function _unwrap(
        uint256 _tokenId,
        address _recipient
    ) public virtual onlyRoleWithSwitch(UNWRAP_ROLE) {
        require(_tokenId < nextTokenIdToMint(), "wrapped NFT DNE.");
        // require(isApprovedOrOwner(msg.sender, _tokenId), "caller not approved for unwrapping.");

        _burn(_tokenId);
        _releaseTokens(_recipient, _tokenId);

        emit TokensUnwrapped(msg.sender, _recipient, _tokenId);
    }

    // disable the default wrap function
    function wrap(
        Token[] calldata _tokensToWrap,
        string calldata _uriForWrappedToken,
        address _recipient
    ) public payable override returns (uint256 tokenId) {
        require(
            disableMint == false,
            "ETFContract: wrap from eoa is not allowed"
        );

        return super.wrap(_tokensToWrap, _uriForWrappedToken, _recipient);
    }

    // disable the default wrap function
    function unwrap(
        uint256 _tokenId,
        address _recipient
    ) public virtual override onlyRoleWithSwitch(UNWRAP_ROLE) {
        require(
            disableMint == false,
            "ETFContract: unwrap from eoa is not allowed"
        );
        return super.unwrap(_tokenId, _recipient);
    }

    // reedem ETF function
    function reedemETF() public returns (uint256 tokenId) {
        require(
            ETFToken(etfTokenAddress).balanceOf(msg.sender) >= etfTokenPerWrap,
            "ETFContract: msg.sender does not have enough ETF Tokens"
        );

        // burn the ETF Token
        ETFToken(etfTokenAddress).burn(msg.sender, etfTokenPerWrap);
        // transfer the ETF to msg.sender
        _unwrap(lastETFReedemed, msg.sender);

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
        returns (uint256[] memory quantities, address[] memory addresses)
    {
        // get the number of tokens in the bundle
        uint256 tokenCount = getTokenCountOfBundle(_bundleId);
        // store the count of each token in the bundle and store in an array
        quantities = new uint256[](tokenCount);
        addresses = new address[](tokenCount);
        for (uint256 i = 0; i < tokenCount; i += 1) {
            quantities[i] = getTokenOfBundle(_bundleId, i).totalAmount;
            addresses[i] = getTokenOfBundle(_bundleId, i).assetContract;
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

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        pure
        virtual
        override(ERC721Multiwrap, CCIPReceiver)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
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

        // check if the bundleId is not already used
        require(
            bundleIdToETFId[depositFundMessage.bundleId] == 0,
            "ETFContract: bundleId was already closed for an ETF"
        );

        console.log("here2222");
        // check that the token sent are whitelisted
        for (
            uint256 i = 0;
            i < depositFundMessage.tokensToWrap.length;
            i += 1
        ) {
            // check each assetContract is whitelisted
            require(
                hasRole(
                    ASSET_ROLE,
                    depositFundMessage.tokensToWrap[i].assetContract
                ),
                "ETFContract: assetContract is not whitelisted"
            );

            // check each assetContract is not duplicated
            for (
                uint256 j = i + 1;
                j < depositFundMessage.tokensToWrap.length;
                j += 1
            ) {
                require(
                    depositFundMessage.tokensToWrap[i].assetContract !=
                        depositFundMessage.tokensToWrap[j].assetContract,
                    "ETFContract: assetContract is duplicated"
                );
            }
        }

        // set to the bundle for each token the max

        if (
            !addressInBundleId[depositFundMessage.bundleId][
                address(bytes20(message.sender))
            ]
        ) {
            bundleIdToAddress[depositFundMessage.bundleId].push(
                address(bytes20(message.sender))
            );
        }

        addressInBundleId[depositFundMessage.bundleId][
            address(bytes20(message.sender))
        ] = true;

        for (
            uint256 i = 0;
            i < depositFundMessage.tokensToWrap.length;
            i += 1
        ) {
            // check if the token is already in the bundle
            bool tokenAlreadyInBundle = false;

            for (
                uint256 j = 0;
                j < getTokenCountOfBundle(depositFundMessage.bundleId);
                j += 1
            ) {
                if (
                    getTokenOfBundle(depositFundMessage.bundleId, j)
                        .assetContract ==
                    depositFundMessage.tokensToWrap[i].assetContract
                ) {
                    tokenAlreadyInBundle = true;

                    // check if the token quantity + current quantity is not greater than the quantity required
                    if (
                        getTokenOfBundle(depositFundMessage.bundleId, j)
                            .totalAmount +
                            depositFundMessage.tokensToWrap[i].totalAmount >
                        tokenQuantities[message.sourceChainSelector][
                            getTokenOfBundle(depositFundMessage.bundleId, j)
                                .assetContract
                        ]
                    ) {
                        depositFundMessage.tokensToWrap[i].totalAmount =
                            tokenQuantities[message.sourceChainSelector][
                                getTokenOfBundle(depositFundMessage.bundleId, j)
                                    .assetContract
                            ] -
                            getTokenOfBundle(depositFundMessage.bundleId, j)
                                .totalAmount;
                    }

                    // update the token quantity
                    _updateTokenInBundle(
                        Token(
                            depositFundMessage.tokensToWrap[i].assetContract,
                            depositFundMessage.tokensToWrap[i].tokenType,
                            depositFundMessage.tokensToWrap[i].tokenId,
                            getTokenOfBundle(depositFundMessage.bundleId, j)
                                .totalAmount +
                                depositFundMessage.tokensToWrap[i].totalAmount
                        ),
                        depositFundMessage.bundleId,
                        j
                    );
                    // update the bundleIdToAddressToTokenAmount
                    bundleIdToAddressToTokenAmount[message.sourceChainSelector][
                        depositFundMessage.bundleId
                    ][address(bytes20(message.sender))][j] += depositFundMessage
                        .tokensToWrap[i]
                        .totalAmount;
                }
            }

            // if the token is not already in the bundle, add it
            if (!tokenAlreadyInBundle) {
                _addTokenInBundle(
                    Token(
                        depositFundMessage.tokensToWrap[i].assetContract,
                        depositFundMessage.tokensToWrap[i].tokenType,
                        depositFundMessage.tokensToWrap[i].tokenId,
                        depositFundMessage.tokensToWrap[i].totalAmount
                    ),
                    depositFundMessage.bundleId
                );

                bundleIdToAddressToTokenAmount[message.sourceChainSelector][
                    depositFundMessage.bundleId
                ][address(bytes20(message.sender))][
                    getTokenCountOfBundle(depositFundMessage.bundleId) - 1
                ] += depositFundMessage.tokensToWrap[i].totalAmount;
            }

            // transfer the tokens to the contract
            // _transferTokenBatch(
            //     address(bytes20(message.sender)),
            //     address(this),
            //     depositFundMessage.tokensToWrap
            // );

            // check if the bundle can be closed

            bool canBeClosed = true;

            // if leght of bundle is not equal to tokensToWrapQuantity, canBeClosed = false
            if (
                getTokenCountOfBundle(depositFundMessage.bundleId) !=
                tokensToWrapQuantity
            ) {
                canBeClosed = false;
            }

            for (uint256 c = 0; c < chainSelectorIds.length; c++) {
                uint64 chainSelectorId = chainSelectorIds[c];
                for (
                    i = 0;
                    i < getTokenCountOfBundle(depositFundMessage.bundleId);
                    i += 1
                ) {
                    if (
                        getTokenOfBundle(depositFundMessage.bundleId, i)
                            .totalAmount <
                        tokenQuantities[chainSelectorId][
                            getTokenOfBundle(depositFundMessage.bundleId, i)
                                .assetContract
                        ]
                    ) {
                        canBeClosed = false;
                    }
                }
            }

            if (canBeClosed) {
                console.log("canBeClosed: %s", canBeClosed);

                uint256 tokenId = nextTokenIdToMint();

                bundleIdToETFId[depositFundMessage.bundleId] = tokenId;

                _safeMint(address(this), 1);

                uint256 fee = (etfTokenPerWrap * percentageFee) / 100;

                uint256 remainingAmount = etfTokenPerWrap - fee;

                // ETFToken(etfTokenAddress).mint(msg.sender, etfTokenPerWrap - fee);
                // calculate the total value of the bundle
                uint256 totalValue = 0;
                for (
                    i = 0;
                    i < getTokenCountOfBundle(depositFundMessage.bundleId);
                    i += 1
                ) {
                    (
                        ,
                        /* uint80 roundID */ int answer,
                        ,
                        ,

                    ) = tokenIdToDataFeed[
                            getTokenOfBundle(depositFundMessage.bundleId, i)
                                .assetContract
                        ].latestRoundData();

                    totalValue +=
                        uint256(answer) *
                        getTokenOfBundle(depositFundMessage.bundleId, i)
                            .totalAmount;
                }

                require(
                    totalValue > 0,
                    "ETFContract: totalValue of the bundle must be greater than 0"
                );

                //  different account have contributed to the bundle in proportion to the value of the tokens they sent, they can have different amount of tokens
                // for each address, calculate the amount of tokens to send
                //  populate the addressToAmount mapping
                // first let's iterate over bundleIdToAddress

                for (uint256 c = 0; c < chainSelectorIds.length; c++) {
                    uint64 chainSelectorId = chainSelectorIds[c];

                    for (
                        i = 0;
                        i <
                        bundleIdToAddress[depositFundMessage.bundleId].length;
                        i += 1
                    ) {
                        // calculate the amount of tokens to send to the address
                        address addressToSend = bundleIdToAddress[
                            depositFundMessage.bundleId
                        ][i];
                        uint256 amountToSend = 0;
                        mapping(uint256 => uint)
                            storage tokenIdToAmount = bundleIdToAddressToTokenAmount[
                                chainSelectorId
                            ][depositFundMessage.bundleId][addressToSend];

                        for (
                            uint256 j = 0;
                            j <
                            getTokenCountOfBundle(depositFundMessage.bundleId);
                            j += 1
                        ) {
                            address assetContract = getTokenOfBundle(
                                depositFundMessage.bundleId,
                                j
                            ).assetContract;

                            (, int answer, , , ) = tokenIdToDataFeed[
                                assetContract
                            ].latestRoundData();

                            amountToSend +=
                                (remainingAmount *
                                    (uint256(answer) * tokenIdToAmount[j])) /
                                totalValue;
                        }
                        addressToAmount[addressToSend] += amountToSend;
                    }
                }

                // transfer the tokens to each address

                for (
                    i = 0;
                    i < bundleIdToAddress[depositFundMessage.bundleId].length;
                    i += 1
                ) {
                    if (
                        addressToAmount[
                            bundleIdToAddress[depositFundMessage.bundleId][i]
                        ] > 0
                    ) {
                        ETFToken(etfTokenAddress).mint(
                            bundleIdToAddress[depositFundMessage.bundleId][i],
                            addressToAmount[
                                bundleIdToAddress[depositFundMessage.bundleId][
                                    i
                                ]
                            ]
                        );
                    }
                }

                ETFToken(etfTokenAddress).mint(owner(), fee);

                emit TokensWrapped(
                    address(bytes20(message.sender)),
                    address(this),
                    tokenId,
                    depositFundMessage.tokensToWrap
                );
            }
        }
    }
}
