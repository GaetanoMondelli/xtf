// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@thirdweb-dev/contracts/base/ERC20Base.sol";

contract FungibleToken is ERC20Base {
    constructor(
        string memory _name,
        string memory _symbol
    ) ERC20Base(msg.sender, _name, _symbol) {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
