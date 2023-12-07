// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import {IERC721} from "@thirdweb-dev/contracts/eip/interface/IERC721.sol";
// IERC721Receiver
import {IERC721Receiver} from "@thirdweb-dev/contracts/eip/interface/IERC721Receiver.sol";

contract NFTVote is IERC721 {
    address public admin;
    string public _baseTokenURI;
    string public name;
    string public symbol;
    uint256 public totalSupply = 0;
    uint256 public _burnCounter = 0;
    mapping(uint256 => address) _ownerships;
    mapping(address => uint256) balances;
    uint256 public _currentIndex = _startTokenId();

    constructor(
        address _admin,
        string memory _name,
        string memory _symbol,
        string memory _tokenURI
    ) {
        admin = _admin;
        name = _name;
        symbol = _symbol;
        _baseTokenURI = _tokenURI;
    }

    function _mint(address to) internal {
        if (_ownerships[_currentIndex] == address(0)) {
            _ownerships[_currentIndex] = to;
            balances[to]++;
            totalSupply++;
            _currentIndex++;
        } else {
            require(
                _ownerships[_currentIndex] == to,
                "Token already minted to another address."
            );
        }
    }

    function nextTokenIdToMint() public view virtual returns (uint256) {
        return _currentIndex;
    }

    function _startTokenId() internal pure virtual returns (uint256) {
        return 1;
    }

    function _burn(uint256 tokenId) internal {
        require(_ownerships[tokenId] != address(0), "Token does not exist.");
        balances[_ownerships[tokenId]]--;
        delete _ownerships[tokenId];
        totalSupply--;
        _burnCounter++;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only owner can call this function.");
        _;
    }

    function transferOwnership(address newOwner) public onlyAdmin {
        admin = newOwner;
    }

    function setBaseTokenURI(string memory baseTokenURI) public onlyAdmin {
        _baseTokenURI = baseTokenURI;
    }

    function tokenURI(
        uint256 tokenId
    ) public view virtual returns (string memory) {
        if (_ownerships[tokenId] == address(0)) {
            return "";
        }
        return _baseTokenURI;
    }

    function balanceOf(
        address _owner
    ) external view override returns (uint256) {
        return balances[_owner];
    }

    function ownerOf(uint256 tokenId) external view override returns (address) {
        return _ownerships[tokenId];
    }

    function _safeMint(address to, uint256 amount) internal virtual {
        // for loop
        for (uint256 i = 0; i < amount; i++) {
            _mint(to);
        }
    }

    function _transferFrom(address from, address to, uint256 tokenId) internal {
        require(_ownerships[tokenId] == from, "Only owner can transfer token.");
        _ownerships[tokenId] = to;
        balances[from]--;
        balances[to]++;
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external override {
        _transferFrom(from, to, tokenId);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external override {
        _transferFrom(from, to, tokenId);
    }

    function approve(address to, uint256 tokenId) external override {
        // Approvals are not supported by Dummy ERC721
    }

    function getApproved(
        uint256 tokenId
    ) external view override returns (address) {}

    function setApprovalForAll(
        address operator,
        bool _approved
    ) external override {}

    function isApprovedForAll(
        address _owner,
        address operator
    ) external view override returns (bool) {}

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes calldata _data
    ) external override {
        require(
            _ownerships[tokenId] == from,
            "Only NFTVOTE owner can transfer token."
        );
        _ownerships[tokenId] = to;
        balances[from]--;
        balances[to]++;
        if (isContract(to)) {
            require(
                IERC721Receiver(to).onERC721Received(
                    msg.sender,
                    from,
                    tokenId,
                    _data
                ) ==
                    bytes4(
                        keccak256(
                            "onERC721Received(address,address,uint256,bytes)"
                        )
                    ),
                "ERC721: transfer to non ERC721Receiver implementer"
            );
        }
    }

    function isContract(address _addr) private view returns (bool) {
        uint32 size;
        assembly {
            size := extcodesize(_addr)
        }
        return (size > 0);
    }
}
