// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@thirdweb-dev/contracts/base/ERC20Base.sol";
import "@thirdweb-dev/contracts/extension/Ownable.sol";
import "hardhat/console.sol";



contract ETFToken is ERC20, Ownable {
    constructor() ERC20("ETF Token", "ETF") {
        _setupOwner(msg.sender);
    }

    /**
     * @dev Function to mint new ETF tokens. Only the owner can mint.
     *
     * @param account The address that will receive the minted tokens.
     * @param amount The amount of tokens to mint.
     */
    function mint(address account, uint256 amount) external onlyOwner {
        console.log("Minting %s ETF tokens for %s", amount, account);
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) external onlyOwner {
        super._burn(account, amount);
    }

    function _canSetOwner() internal view virtual override returns (bool) {
        return msg.sender == owner();
    }
}
