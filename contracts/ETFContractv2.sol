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
import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import {TokenAmounts, ReedeemETFMessage, NATIVE_TOKEN, DepositFundMessage, ETFTokenOptions, ChainLinkData, lockTime, PayFeesIn, REQUEST_CONFIRMATIONS, CALLBACK_GAS_LIMIT, NUM_WORDS} from "./ETFContractTypes.sol";

contract ETFv2 is
    TokenStore,
    ERC721A,
    ContractMetadata,
    Ownable,
    DefaultOperatorFilterer,
    CCIPReceiver,
    VRFConsumerBaseV2
{
    VRFCoordinatorV2Interface immutable COORDINATOR;
    ETFTokenOptions etfOptions;
    // data for chainlink services
    ChainLinkData chainLinkData;
    // number of bundles
    uint256 public bundleCount = 0;
    // last ETF reedemed
    uint256 public lastETFReedemed = 0;
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
    mapping(uint256 => mapping(address => uint256)) public addressToAmount;
    // mapping bundleId to mapping of index to chainIdSelector
    mapping(uint256 => mapping(uint256 => uint64))
        public bundleIdToChainIdSelector;
    // mapping of bundleId to mapping requestId
    mapping(uint256 => uint256) public requestIdToBundleId;
    mapping(uint256 => bool) public openedBundle;
    mapping(uint256 => uint) public tokenIdToExpirationTime;

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
        _setupOwner(msg.sender);
        _setOperatorRestriction(true);
        chainLinkData = _chainLinkData;

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
        COORDINATOR = VRFCoordinatorV2Interface(_chainLinkData.vrfCoordinator);

        // uriETFToken = _etfOptions.uriETFToken;
        // etfTokenAddress = _etfOptions.etfTokenAddress;
        // etfTokenPerWrap = _etfOptions._etfTokenPerWrap;
        // percentageFee = _etfOptions._percentageFee;

        etfOptions = _etfOptions;

        tokensToWrapQuantity = _whitelistedTokenAmounts.length;
    }

    // Receive function
    receive() external payable {
        emit EtherReceived(msg.sender, msg.value);
    }

    function depositFunds(
        uint256 _bundleId,
        Token[] memory _tokensToWrap
    ) external payable returns (bool canBeClosed) {
        // check if the bundleId is not already used
        require(bundleIdToETFId[_bundleId] == 0, "bundle already closed");

        validateTokensToWrap(
            _tokensToWrap,
            chainLinkData.currentChainSelectorId
        );
        updateBundleCount(_bundleId);
        addAddressToBundle(_bundleId, msg.sender);

        _tokensToWrap = updateTokenToWrapQuantity2(
            _bundleId,
            _tokensToWrap,
            chainLinkData.currentChainSelectorId,
            msg.sender
        );

        _transferTokenBatch(msg.sender, address(this), _tokensToWrap);

        canBeClosed = checkIfBundleCanBeClosed(_bundleId);

        if (canBeClosed) {
            closeBundle(_bundleId, address(this));
        }
    }

    // reedem ETF function
    function reedemETF(uint256 bundleId) public returns (uint256 etfId) {
        require(
            etfOptions.etfTokenPerWrap <=
                IERC20(etfOptions.etfTokenAddress).balanceOf(msg.sender),
            "not enough ETFs"
        );
        etfId = bundleIdToETFId[bundleId];
        require(tokenIdToExpirationTime[etfId] < block.timestamp, "locked");

        IETFToken(etfOptions.etfTokenAddress).burn(
            msg.sender,
            etfOptions.etfTokenPerWrap
        );

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
        uint256 index = 0;

        for (uint256 c = 0; c < chainSelectorIds.length; c++) {
            uint64 chainSelectorId = chainSelectorIds[c];
            for (
                uint256 i = 0;
                i < whitelistedTokens[chainSelectorId].length;
                i += 1
            ) {
                quantities[index] = tokenQuantities[chainSelectorId][
                    whitelistedTokens[chainSelectorId][i]
                ];
                addresses[index] = whitelistedTokens[chainSelectorId][i];
                selectorsIds[index] = chainSelectorId;
                index += 1;
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

    function validateTokensToWrap(
        Token[] memory tokensToWrap,
        uint64 chainSelectorId
    ) internal view {
        for (uint256 i = 0; i < tokensToWrap.length; i += 1) {
            // check each assetContract is whitelisted
            require(
                // hasRole(ASSET_ROLE, tokensToWrap[i].assetContract),
                isWhiteListedToken[chainSelectorId][
                    tokensToWrap[i].assetContract
                ],
                "asset not listed"
            );

            // check each assetContract is not duplicated
            for (uint256 j = i + 1; j < tokensToWrap.length; j += 1) {
                require(
                    tokensToWrap[i].assetContract !=
                        tokensToWrap[j].assetContract,
                    "asset dup"
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

    function updateTokenToWrapQuantity2(
        uint256 bundleId,
        ITokenBundle.Token[] memory tokensToWrap,
        uint64 chainIdSelector,
        address depositAddress
    ) internal returns (ITokenBundle.Token[] memory) {
        for (uint256 i = 0; i < tokensToWrap.length; i += 1) {
            uint256 tokenIndex;

            for (
                tokenIndex = 0;
                tokenIndex < getTokenCountOfBundle(bundleId);
                tokenIndex += 1
            ) {
                if (
                    getTokenOfBundle(bundleId, tokenIndex).assetContract ==
                    tokensToWrap[i].assetContract
                ) {
                    if (
                        getTokenOfBundle(bundleId, tokenIndex).totalAmount +
                            tokensToWrap[i].totalAmount >
                        tokenQuantities[chainIdSelector][
                            getTokenOfBundle(bundleId, tokenIndex).assetContract
                        ]
                    ) {
                        tokensToWrap[i].totalAmount = tokenQuantities[
                            chainIdSelector
                        ][getTokenOfBundle(bundleId, tokenIndex).assetContract];
                    }

                    _updateTokenInBundle(
                        Token(
                            tokensToWrap[i].assetContract,
                            tokensToWrap[i].tokenType,
                            tokensToWrap[i].tokenId,
                            getTokenOfBundle(bundleId, tokenIndex).totalAmount +
                                tokensToWrap[i].totalAmount
                        ),
                        bundleId,
                        tokenIndex
                    );
                    bundleIdToAddressToTokenAmount[chainIdSelector][bundleId][
                        depositAddress
                    ][tokenIndex] += tokensToWrap[i].totalAmount;
                    continue;
                }
            }
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

        return tokensToWrap;
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

        DepositFundMessage memory depositFundMessage = abi.decode(
            message.data,
            (DepositFundMessage)
        );

        // check if the chainIdSelector is in the ETF
        require(
            chainSelectorIdInETF[message.sourceChainSelector],
            "chainSelId is not in the ETF"
        );

        // check if the bundleId is not already closed
        require(
            bundleIdToETFId[depositFundMessage.bundleId] == 0,
            "already closed"
        );

        validateTokensToWrap(
            depositFundMessage.tokensToWrap,
            message.sourceChainSelector
        );
        updateBundleCount(depositFundMessage.bundleId);
        addAddressToBundle(
            depositFundMessage.bundleId,
            address(bytes20(message.sender))
        );

        updateTokenToWrapQuantity2(
            depositFundMessage.bundleId,
            depositFundMessage.tokensToWrap,
            message.sourceChainSelector,
            address(bytes20(message.sender))
        );

        bool canBeClosed = checkIfBundleCanBeClosed(
            depositFundMessage.bundleId
        );

        if (canBeClosed) {
            closeBundle(depositFundMessage.bundleId, address(this));
        }
    }

    function closeBundle(
        uint256 bundleId,
        address to
    ) internal returns (uint256 tokenId) {
        tokenId = nextTokenIdToMint();

        bundleIdToETFId[bundleId] = tokenId;

        _safeMint(to, 1);

        tokenIdToExpirationTime[tokenId] = block.timestamp + lockTime;

        uint256 fee = (etfOptions.etfTokenPerWrap * etfOptions.percentageFee) /
            100;

        uint256 remainingAmount = etfOptions.etfTokenPerWrap - fee;

        // calculate the total value of the bundle
        uint256 totalValue = 0;
        for (uint256 i = 0; i < getTokenCountOfBundle(bundleId); i += 1) {
            //  TO-DO: NEED TO SCALE THE PRICE TO THE TOKEN DECIMALS
            // uint256 priceAggrDecimals = tokenIdToDataFeed[
            //     getTokenOfBundle(bundleId, i).assetContract
            // ].decimals();
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

        require(totalValue > 0, "totalValue<=0");

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
                addressToAmount[bundleId][addressToSend] += amountToSend;
            }
        }

        // transfer the tokens to each address

        for (uint256 i = 0; i < bundleIdToAddress[bundleId].length; i += 1) {
            if (addressToAmount[bundleId][bundleIdToAddress[bundleId][i]] > 0) {
                IETFToken(etfOptions.etfTokenAddress).mint(
                    bundleIdToAddress[bundleId][i],
                    addressToAmount[bundleId][bundleIdToAddress[bundleId][i]]
                );
            }
        }

        requestIdToBundleId[
            COORDINATOR.requestRandomWords(
                chainLinkData.keyHash,
                chainLinkData.subscriptionId,
                REQUEST_CONFIRMATIONS,
                CALLBACK_GAS_LIMIT,
                NUM_WORDS
            )
        ] = bundleId;

        IETFToken(etfOptions.etfTokenAddress).mint(owner(), fee);
    }

    function getAllAddressesForBundleId(
        uint256 bundleId
    ) public view returns (address[] memory) {
        return bundleIdToAddress[bundleId];
    }

    function sendReedeemMessage(
        uint256 bundleId,
        uint64 destinationChainSelector,
        PayFeesIn payFeesIn
    ) public returns (bytes32 messageId) {
        require(
            isETFBurned(bundleIdToETFId[bundleId]),
            "bundleId not reedemed"
        );

        ReedeemETFMessage memory data = ReedeemETFMessage({bundleId: bundleId});
        messageId = send(destinationChainSelector, payFeesIn, data);
    }

    function send(
        uint64 destinationChainSelector,
        PayFeesIn payFeesIn,
        ReedeemETFMessage memory data
    ) internal returns (bytes32 messageId) {
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(address(this)),
            data: abi.encode(data),
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: "",
            feeToken: payFeesIn == PayFeesIn.LINK
                ? chainLinkData.link
                : address(0)
        });

        uint256 fee = IRouterClient(chainLinkData.router).getFee(
            destinationChainSelector,
            message
        );

        if (payFeesIn == PayFeesIn.LINK) {
            // LinkTokenInterface(i_link).approve(i_router, fee);
            messageId = IRouterClient(chainLinkData.router).ccipSend(
                destinationChainSelector,
                message
            );
        } else {
            messageId = IRouterClient(chainLinkData.router).ccipSend{
                value: fee
            }(destinationChainSelector, message);
        }
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

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal virtual override {
        // TO-DO: the winning probability should be based on the amount of ETFs that the user has deposited
        // let's transform the randomWord into a number between 0 and address[bundleId].length
        address winner = bundleIdToAddress[requestIdToBundleId[requestId]][
            randomWords[0] %
                bundleIdToAddress[requestIdToBundleId[requestId]].length
        ];
        approve(winner, bundleIdToETFId[requestIdToBundleId[requestId]]);
        transferFrom(
            address(this),
            winner,
            bundleIdToETFId[requestIdToBundleId[requestId]]
        );
    }
}
