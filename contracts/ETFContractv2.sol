// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import {ETFBase} from "./ETFContractBase.sol";
import {TokenAmounts, ReedeemETFMessage, NATIVE_TOKEN, MessageDesposit, DepositFundMessage, ETFTokenOptions, ChainLinkData, lockTime, PayFeesIn, REQUEST_CONFIRMATIONS, CALLBACK_GAS_LIMIT, NUM_WORDS} from "./ETFContractTypes.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import {TokenBundle, ITokenBundle} from "@thirdweb-dev/contracts/extension/TokenBundle.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {IETFToken} from "./ETFTokenContract.sol";
import {IERC20Metadata, IERC20} from "@thirdweb-dev/contracts/base/ERC20Base.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";

contract ETFv2 is ETFBase {
    // current chjainIdSelector
    uint64 public currentChainSelectorId;
    mapping(uint64 => mapping(uint256 => mapping(address => mapping(uint256 => uint256)))) bundleIdToAddressToTokenAmount;
    // mapping of token address to price
    mapping(uint256 => mapping(address => uint256)) addressToAmount;
    // mapping of bundleId to mapping requestId
    mapping(uint256 => uint256) public requestIdToBundleId;
    mapping(uint256 => uint) public tokenIdToExpirationTime;
    mapping(uint256 => address) public burner;
    mapping(uint64 => address) public chainSelectorIdToSidechainAddress;

    constructor(
        string memory _name,
        string memory _symbol,
        TokenAmounts[] memory _whitelistedTokenAmounts,
        ETFTokenOptions memory _etfOptions,
        ChainLinkData memory _chainLinkData
    )
        ETFBase(
            _name,
            _symbol,
            _whitelistedTokenAmounts,
            _etfOptions,
            _chainLinkData
        )
    {
        currentChainSelectorId = chainLinkData.currentChainSelectorId;
    }

    function validateTokensUpdateBundle(
        uint256 _bundleId,
        Token[] memory _tokensToWrap,
        uint64 chainSelectorId,
        address depositAddress
    ) internal returns (bool canBeClosed) {
        // validateTokensToWrap(_tokensToWrap, chainSelectorId);
        updateBundleCount(_bundleId);
        addAddressToBundle(_bundleId, depositAddress);

        _tokensToWrap = updateTokenToWrapQuantity(
            _bundleId,
            _tokensToWrap,
            chainSelectorId,
            depositAddress
        );

        canBeClosed = checkIfBundleCanBeClosed(_bundleId);
    }

    function depositFunds(
        uint256 _bundleId,
        Token[] memory _tokensToWrap
    ) external payable returns (bool canBeClosed) {
        // check if the bundleId is not already used
        require(bundleIdToETFId[_bundleId] == 0, "cls");

        canBeClosed = validateTokensUpdateBundle(
            _bundleId,
            _tokensToWrap,
            chainLinkData.currentChainSelectorId,
            msg.sender
        );

        _transferTokenBatch(msg.sender, address(this), _tokensToWrap);

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
        require(tokenIdToExpirationTime[etfId] < block.timestamp, "lkd");

        IETFToken(etfOptions.etfTokenAddress).burn(
            msg.sender,
            etfOptions.etfTokenPerWrap
        );

        for (uint256 i = 0; i < getTokenCountOfBundle(bundleId); i += 1) {
            if (
                bundleIdToChainIdSelector[bundleId][i] ==
                chainLinkData.currentChainSelectorId
            ) {
                continue;
            }
            _updateTokenInBundle(
                Token(
                    getTokenOfBundle(bundleId, i).assetContract,
                    getTokenOfBundle(bundleId, i).tokenType,
                    getTokenOfBundle(bundleId, i).tokenId,
                    0
                ),
                bundleId,
                i
            );
        }

        _releaseTokens(msg.sender, bundleId);
        _burn(etfId);
        burner[bundleId] = msg.sender;
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

    function addAddressToBundle(uint256 bundleId, address _address) internal {
        if (!addressInBundleId[bundleId][_address]) {
            bundleIdToAddress[bundleId].push(_address);
        }
        addressInBundleId[bundleId][_address] = true;
    }

    function updateBundleCount(uint256 _bundleId) internal {
        require(bundleIdToETFId[_bundleId] == 0, "cls");
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

    event DepositFundMessageReceived(
        uint256 messageId,
        address sender,
        uint64 chainId
    );

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

        require(totalValue > 0, "val<=0");

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
        require(isETFBurned(bundleIdToETFId[bundleId]), "notRdmd");

        // TO-DO: check if the destinationChainSelector is in the chainSelectorIds
        // require(
        //     chainSelectorIdInETF[destinationChainSelector],
        //     "chain err"
        // );

        ReedeemETFMessage memory data = ReedeemETFMessage({
            bundleId: bundleId,
            receiver: burner[bundleId]
        });
        messageId = send(destinationChainSelector, payFeesIn, data);
    }

    function send(
        uint64 destinationChainSelector,
        PayFeesIn payFeesIn,
        ReedeemETFMessage memory data
    ) internal returns (bytes32 messageId) {
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(
                chainSelectorIdToSidechainAddress[destinationChainSelector]
            ),
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

    function updateBundleAfterReceive(uint256 bundleId) public {
        for (uint256 i; i < messages[bundleId].length; i++) {
            MessageDesposit memory message = messages[bundleId][i];
            DepositFundMessage memory depositFundMessage = abi.decode(
                message.depositFundMessage,
                (DepositFundMessage)
            );
            bool canBeClosed = validateTokensUpdateBundle(
                depositFundMessage.bundleId,
                depositFundMessage.tokensToWrap,
                message.sourceChainSelector,
                address(bytes20(message.sender))
            );

            // remove all the message from the array
            delete messages[bundleId][i];

            if (canBeClosed) {
                closeBundle(depositFundMessage.bundleId, address(this));
            }
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
            address[] memory contractAddresses,
            MessageDesposit[] memory bundleMessages
        )
    {
        // get the number of tokens in the bundle
        uint256 tokenCount = getTokenCountOfBundle(_bundleId);
        // store the count of each token in the bundle and store in an array
        quantities = new uint256[](tokenCount);
        contractAddresses = new address[](tokenCount);
        bundleMessages = messages[_bundleId];
        for (uint256 i = 0; i < tokenCount; i += 1) {
            address assetContract = getTokenOfBundle(_bundleId, i)
                .assetContract;
            quantities[i] = bundleIdToAddressToTokenAmount[
                bundleIdToChainIdSelector[_bundleId][i]
            ][_bundleId][_address][i];
            contractAddresses[i] = assetContract;
        }
    }

    function setSideChainAddress(
        uint64 chainSelectorId,
        address sideChainAddress
    ) external onlyOwner {
        chainSelectorIdToSidechainAddress[chainSelectorId] = sideChainAddress;
    }

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal virtual override {
        // TO-DO: the winning probability should be based on the amount of ETFs that the user has deposited
        // let's transform the randomWord into a number between 0 and address[bundleId].length

        // uint256 totalContributions = 0;
        // for (
        //     uint256 i = 0;
        //     i < bundleIdToAddress[requestIdToBundleId[requestId]].length;
        //     i++
        // ) {
        //     totalContributions += addressToAmount[
        //         requestIdToBundleId[requestId]
        //     ][bundleIdToAddress[requestIdToBundleId[requestId]][i]];
        // }

        // uint256 randomIndex = randomWords[0] % totalContributions;
        // uint256 runningSum = 0;
        // address winner;

        // for (
        //     uint256 i = 0;
        //     i < bundleIdToAddress[requestIdToBundleId[requestId]].length;
        //     i++
        // ) {
        //     runningSum += addressToAmount[requestIdToBundleId[requestId]][
        //         bundleIdToAddress[requestIdToBundleId[requestId]][i]
        //     ];
        //     if (randomIndex < runningSum) {
        //         winner = bundleIdToAddress[requestIdToBundleId[requestId]][i];
        //         break;
        //     }
        // }

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
