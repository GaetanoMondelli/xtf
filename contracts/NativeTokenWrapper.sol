// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "@thirdweb-dev/contracts/base/ERC20Base.sol";
import "@thirdweb-dev/contracts/interfaces/IWETH.sol";
import "hardhat/console.sol";


// MOCK IMPLENTATION OF WRAPPED TOKEN
contract NativeTokenWrapper is IWETH, ERC20Base {
    constructor(
        string memory _name,
        string memory _symbol
    ) ERC20Base(msg.sender, _name, _symbol) {}

    function deposit() external payable override {
        // check msg.value
        // mint msg.value to msg.
        // receive msg.value
        console.log("depositing %s from %s", msg.value, msg.sender);
        _mint(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external override {
        // burn amount from msg.sender
        console.log("withdrawing %s to %s", amount, msg.sender);
        _burn(msg.sender, amount);
        // transfer amount to msg.sender
        // payable(msg.sender).transfer(amount);
        (bool success,) = msg.sender.call{value: amount}("");
        console.log("withdrawing %s to %s", amount, msg.sender, success);

    }

    function transfer(
        address to,
        uint256 value
    ) public override(ERC20, IWETH) returns (bool) {}
}
