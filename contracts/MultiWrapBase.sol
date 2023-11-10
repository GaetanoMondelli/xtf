// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@thirdweb-dev/contracts/base/ERC721Multiwrap.sol";
import "hardhat/console.sol";

// import ERC721Multiwrap

contract MultiWrapBase is ERC721Multiwrap {
    bytes32 private constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor(
        string memory _name,
        string memory _symbol,
        address _royaltyRecipient,
        uint128 _royaltyBps,
        address _nativeTokenWrapper
    )
        ERC721Multiwrap(
            msg.sender,
            _name,
            _symbol,
            _royaltyRecipient,
            _royaltyBps,
            _nativeTokenWrapper
        )
    {}

    // Override the wrap function to add a check for the token ID

    function wrap(
        Token[] calldata _tokensToWrap,
        string calldata _uriForWrappedToken,
        address _recipient
    )
        public
        payable
        override
        onlyRoleWithSwitch(MINTER_ROLE)
        returns (uint256 tokenId)
    {
        console.log("wrap called");
        return super.wrap(_tokensToWrap, _uriForWrappedToken, _recipient);
    }

    // Receive function
    receive() external payable {
        console.log("receive called");
        emit EtherReceived(msg.sender, msg.value);
    }

    // Event to log the received Ether
    event EtherReceived(address indexed sender, uint256 value);
}
