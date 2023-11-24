// // SPDX-License-Identifier: Apache-2.0
// pragma solidity ^0.8.0;

// import "./ETFTokenContract.sol";
// import "@thirdweb-dev/contracts/extension/Ownable.sol";
// import "@thirdweb-dev/contracts/base/ERC721Multiwrap.sol";
// import "@thirdweb-dev/contracts/extension/TokenStore.sol";
// import "@thirdweb-dev/contracts/lib/CurrencyTransferLib.sol";
// import "@thirdweb-dev/contracts/base/ERC721Base.sol";
// // import "hardhat/console.sol";

// // import ERC721Multiwrap

// /**
//  *  @notice A generic interface to describe any ERC20, ERC721 or ERC1155 token.
//  *
//  *  @param assetContract    The contract address of the asset.
//  *  @param amount           Amount of the asset required.
//  */
// struct TokenAmounts {
//     address assetContract;
//     uint256 amount;
// }

// contract ETF is Ownable, ERC721Multiwrap {
//     /*//////////////////////////////////////////////////////////////
//                     Permission control roles
//     //////////////////////////////////////////////////////////////*/

//     /// @dev Only MINTER_ROLE holders can wrap tokens, when wrapping is restricted.
//     bytes32 private constant MINTER_ROLE = keccak256("MINTER_ROLE");
//     /// @dev Only UNWRAP_ROLE holders can unwrap tokens, when unwrapping is restricted.
//     bytes32 private constant UNWRAP_ROLE = keccak256("UNWRAP_ROLE");
//     /// @dev Only assets with ASSET_ROLE can be wrapped, when wrapping is restricted to particular assets.
//     bytes32 private constant ASSET_ROLE = keccak256("ASSET_ROLE");
//     /// @dev The address interpreted as native token of the chain.
//     address public constant NATIVE_TOKEN =
//         0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

//     // whitelist of token addresses for the ETF
//     address[] public whitelistedTokens;
//     uint256 public tokensToWrapQuantity;
//     // mapping of token address to  quantity of token that must be wrapped per etf
//     mapping(address => uint256) public tokenQuantities;
//     string public uriETFToken;
//     // check state to prevent users to invoke wrap function directly
//     bool private disableMint;
//     // address of ETF Token
//     address public etfTokenAddress;
//     // number of ETF Token that are minted per wrap
//     uint256 public etfTokenPerWrap;
//     // Percentage fee for the ETF
//     uint256 public percentageFee;
//     // last ETF reedemed
//     uint256 public lastETFReedemed;

//     constructor(
//         string memory _name,
//         string memory _symbol,
//         address _royaltyRecipient,
//         uint128 _royaltyBps,
//         address _nativeTokenWrapper,
//         address _etfTokenAddress,
//         uint256 _etfTokenPerWrap,
//         uint256 _percentageFee,
//         TokenAmounts[] memory _whitelistedTokenAmounts,
//         string memory _uriETFToken
//     )
//         ERC721Multiwrap(
//             msg.sender,
//             _name,
//             _symbol,
//             _royaltyRecipient,
//             _royaltyBps,
//             _nativeTokenWrapper
//         )
//     {
//         // // set the MINTER_ROLE to the contact address
//         // _revokeRole(MINTER_ROLE, msg.sender);
//         // remove the 0 address from the ASSET_ROLE to enable whitelisting feature
//         _revokeRole(ASSET_ROLE, address(0));
//         // remove the msg.sender from the MINTER_ROLE and add the 0 address to the MINTER_ROLE
//         //  for disable MINTER_ROLE
//         _revokeRole(MINTER_ROLE, msg.sender);
//         _setupRole(MINTER_ROLE, address(0));
//         _setupOwner(msg.sender);
//         bool containNativeTokenAmount = false;
//         for (uint256 i = 0; i < _whitelistedTokenAmounts.length; i += 1) {
//             if (_whitelistedTokenAmounts[i].assetContract == NATIVE_TOKEN) {
//                 containNativeTokenAmount = true;
//             }
//             _setupRole(ASSET_ROLE, _whitelistedTokenAmounts[i].assetContract);
//             tokenQuantities[
//                 _whitelistedTokenAmounts[i].assetContract
//             ] = _whitelistedTokenAmounts[i].amount;
//             // push the token address to the whitelistedTokens array
//             whitelistedTokens.push(_whitelistedTokenAmounts[i].assetContract);
//         }
//         require(
//             containNativeTokenAmount,
//             "ETFContract: native currency must be listed in _whitelistedTokenAmounts"
//         );
//         _setupRole(ASSET_ROLE, NATIVE_TOKEN);
//         uriETFToken = _uriETFToken;
//         etfTokenAddress = _etfTokenAddress;
//         tokensToWrapQuantity = _whitelistedTokenAmounts.length;
//         etfTokenPerWrap = _etfTokenPerWrap;
//         percentageFee = _percentageFee;
//         disableMint = true;
//         lastETFReedemed = 0;
//     }

//     // Receive function
//     receive() external payable {
//         emit EtherReceived(msg.sender, msg.value);
//     }

//     // define the mint function
//     function mint(
//         address _to,
//         Token[] calldata _tokensToWrap
//     ) external payable returns (uint256 tokenId) {
//         uint256 nativeCurrencyIndex = _tokensToWrap.length;

//         // check length of _tokenToWrap ot be maxTokenTypeQuantity
//         require(
//             _tokensToWrap.length == tokensToWrapQuantity,
//             "ETFContract: length of _tokensToWrap must be equal to tokensToWrapQuantity"
//         );

//         // check each assetContract is whitelisted and quantity is equal to maxTokenQuantity
//         for (uint256 i = 0; i < _tokensToWrap.length; i += 1) {
//             // check if native currency is listed in _tokensToWrap
//             if (_tokensToWrap[i].assetContract == NATIVE_TOKEN) {
//                 nativeCurrencyIndex = i;
//             }

//             // check each assetContract is whitelisted
//             require(
//                 hasRole(ASSET_ROLE, _tokensToWrap[i].assetContract),
//                 "ETFContract: assetContract is not whitelisted"
//             );
//             // check quantity is equal to tokenQuantities[assetContract]
//             require(
//                 _tokensToWrap[i].totalAmount ==
//                     tokenQuantities[_tokensToWrap[i].assetContract],
//                 "ETFContract: quantity must be equal to the maxTokenQuantity"
//             );

//             // check each assetContract is not duplicated
//             for (uint256 j = i + 1; j < _tokensToWrap.length; j += 1) {
//                 require(
//                     _tokensToWrap[i].assetContract !=
//                         _tokensToWrap[j].assetContract,
//                     "ETFContract: assetContract is duplicated"
//                 );
//             }
//         }

//         // require isNativeCurrencyIncluded to be true
//         require(
//             nativeCurrencyIndex != _tokensToWrap.length,
//             "ETFContract: native currency is not included in token list"
//         );

//         uint256 etfId = _wrap(
//             _tokensToWrap,
//             uriETFToken,
//             address(this),
//             msg.sender
//         );
//         // console.log("etfId: %s", etfId, address(this), msg.sender);

//         uint256 fee = (etfTokenPerWrap * percentageFee) / 100;

//         ETFToken(etfTokenAddress).mint(_to, etfTokenPerWrap - fee);

//         ETFToken(etfTokenAddress).mint(owner(), fee);

//         return etfId;
//     }

//     function _wrap(
//         Token[] calldata _tokensToWrap,
//         string memory _uriForWrappedToken,
//         address _recipient,
//         address _sender
//     ) internal onlyRoleWithSwitch(MINTER_ROLE) returns (uint256 tokenId) {
//         if (!hasRole(ASSET_ROLE, address(0))) {
//             for (uint256 i = 0; i < _tokensToWrap.length; i += 1) {
//                 _checkRole(ASSET_ROLE, _tokensToWrap[i].assetContract);
//             }
//         }

//         tokenId = nextTokenIdToMint();

//         _storeTokens(_sender, _tokensToWrap, _uriForWrappedToken, tokenId);

//         _safeMint(_recipient, 1);

//         emit TokensWrapped(_sender, _recipient, tokenId, _tokensToWrap);
//     }

//     function _unwrap(
//         uint256 _tokenId,
//         address _recipient
//     ) public virtual onlyRoleWithSwitch(UNWRAP_ROLE) {
//         require(_tokenId < nextTokenIdToMint(), "wrapped NFT DNE.");
//         // require(isApprovedOrOwner(msg.sender, _tokenId), "caller not approved for unwrapping.");

//         _burn(_tokenId);
//         _releaseTokens(_recipient, _tokenId);

//         emit TokensUnwrapped(msg.sender, _recipient, _tokenId);
//     }

//     // disable the default wrap function
//     function wrap(
//         Token[] calldata _tokensToWrap,
//         string calldata _uriForWrappedToken,
//         address _recipient
//     ) public payable override returns (uint256 tokenId) {
//         require(
//             disableMint == false,
//             "ETFContract: wrap from eoa is not allowed"
//         );

//         return super.wrap(_tokensToWrap, _uriForWrappedToken, _recipient);
//     }

//     // disable the default wrap function
//     function unwrap(
//         uint256 _tokenId,
//         address _recipient
//     ) public virtual override onlyRoleWithSwitch(UNWRAP_ROLE) {
//         require(
//             disableMint == false,
//             "ETFContract: unwrap from eoa is not allowed"
//         );
//         return super.unwrap(_tokenId, _recipient);
//     }

//     // reedem ETF function
//     function reedemETF() public returns (uint256 tokenId) {
//         require(
//             ETFToken(etfTokenAddress).balanceOf(msg.sender) == etfTokenPerWrap,
//             "ETFContract: msg.sender does not have enough ETF Tokens"
//         );

//         ETFToken(etfTokenAddress).burn(msg.sender, etfTokenPerWrap);
//         _unwrap(lastETFReedemed, msg.sender);
//         lastETFReedemed += 1;
//         return lastETFReedemed - 1;
//     }

//     // Event to log the received Ether
//     event EtherReceived(address indexed sender, uint256 value);
// }
