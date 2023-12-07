// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import {IERC721} from "@thirdweb-dev/contracts/eip/interface/IERC721.sol";
import {IERC165} from "@thirdweb-dev/contracts/eip/interface/IERC165.sol";

// import {ContractMetadata} from "@thirdweb-dev/contracts/extension/ContractMetadata.sol";

contract NFTVote is IERC165, IERC721 {
    address public admin;
    string public _baseTokenURIV;
    string public name;
    string public symbol;
    uint256 public totalSupply = 0;
    uint256 public _burnCounter = 0;
    mapping(uint256 => address) _ownerships;
    mapping(address => uint256) balances;
    uint256 public _currentIndex = _startTokenId();

    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    constructor(
        address _admin,
        string memory _name,
        string memory _symbol,
        string memory _tokenURI
    ) {
        admin = _admin;
        name = _name;
        symbol = _symbol;
        _baseTokenURIV = _tokenURI;
    }

    function _mint(address to) public {
        if (_ownerships[_currentIndex] == address(0)) {
            _ownerships[_currentIndex] = to;
            balances[to]++;
            totalSupply++;
            emit Transfer(address(0), to, _currentIndex);
            _currentIndex++;
        } else {
            require(
                _ownerships[_currentIndex] == to,
                ""
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
        require(_ownerships[tokenId] != address(0), "no");
        balances[_ownerships[tokenId]]--;
        delete _ownerships[tokenId];
        totalSupply--;
        _burnCounter++;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "noadmin");
        _;
    }

    function transferOwnership(address newOwner) public onlyAdmin {
        admin = newOwner;
    }

    function _baseTokenURI() internal view virtual returns (string memory) {
        return _baseTokenURIV;
    }

    function setBaseTokenURI(string memory baseTokenURI) public onlyAdmin {
        _baseTokenURIV = baseTokenURI;
    }

    function tokenURI(
        uint256 tokenId
    ) public view virtual returns (string memory) {
        if (_ownerships[tokenId] == address(0)) {
            return "";
        }
        return _baseTokenURIV;
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
        require(_ownerships[tokenId] == from, "");
        _ownerships[tokenId] = to;
        balances[from]--;
        balances[to]++;
        emit Transfer(from, to, tokenId);
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

    function isApprovedForAll(
        address _owner,
        address operator
    ) external view override returns (bool) {
        return _operatorApprovals[_owner][operator];
    }

    function approve(address to, uint256 tokenId) external override {
        address owner = _ownerships[tokenId];
        require(to != owner, "");

        require(
            msg.sender == owner || _operatorApprovals[owner][msg.sender],
            ""
        );

        _tokenApprovals[tokenId] = to;
        emit Approval(owner, to, tokenId);
    }

    function getApproved(
        uint256 tokenId
    ) external view override returns (address) {
        require(_ownerships[tokenId] != address(0), "0");
        return _tokenApprovals[tokenId];
    }

    function _approve(address to, uint256 tokenId) internal {
        _tokenApprovals[tokenId] = to;
        emit Approval(_ownerships[tokenId], to, tokenId);
    }

    function setApprovalForAll(
        address operator,
        bool _approved
    ) external override {
        require(operator != msg.sender, "");

        _operatorApprovals[msg.sender][operator] = _approved;
        emit ApprovalForAll(msg.sender, operator, _approved);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes calldata _data
    ) external override {
        require(_ownerships[tokenId] == from, "noadmin");
        _ownerships[tokenId] = to;
        balances[from]--;
        balances[to]++;
        // if (isContract(to)) {
        //     require(
        //         IERC721Receiver(to).onERC721Received(
        //             msg.sender,
        //             from,
        //             tokenId,
        //             _data
        //         ) ==
        //             bytes4(
        //                 keccak256(
        //                     "onERC721Received(address,address,uint256,bytes)"
        //                 )
        //             ),
        //         "ERC721: transfer to non ERC721Receiver implementer"
        //     );
        // }
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerships[tokenId] != address(0);
    }

    function isContract(address _addr) private view returns (bool) {
        uint32 size;
        assembly {
            size := extcodesize(_addr)
        }
        return (size > 0);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) external pure virtual override returns (bool) {
        return
            interfaceId == type(IERC721).interfaceId ||
            interfaceId == type(IERC165).interfaceId;

        // interfaceId == type(ContractMetadata).interfaceId;
    }

    function _canSetContractURI()
        internal
        view
        virtual
        returns (
            // override
            bool
        )
    {
        return msg.sender == admin;
    }
}
