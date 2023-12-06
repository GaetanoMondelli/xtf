// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;


contract NFTVote is ERC721 {
    address public owner;
    string public baseTokenURI;
    

    constructor(
        address _owner,
        string memory _name,
        string memory _symbol,
        string memory _tokenURI
    ) ERC721(_name, _symbol) {
        owner = _owner;
        baseTokenURI = _tokenURI;
    }

    function mint(address to, uint256 tokenId) public onlyOwner {
        _mint(to, tokenId);
    }

    function burn(uint256 tokenId) public onlyOwner {
        _burn(tokenId);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function.");
        _;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        owner = newOwner;
    }

    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        return baseTokenURI;
    }
}
