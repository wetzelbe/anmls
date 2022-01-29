// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "./Interfaces.sol";
import "@openzeppelin/contracts/utils/Strings.sol";


contract ANMLS is ERC721, ERC165, ERC721Metadata, ERC721Enumerable {
    uint256 private _tokenIds = 0;
    mapping(address => mapping(address => bool)) private _operator;

    mapping(uint256 => uint256) private _genes;
    mapping(uint256 => uint256) private _parent1;
    mapping(uint256 => uint256) private _parent2;
    mapping(uint256 => string) private _name;
    mapping(uint256 => address) private _owner;
    mapping(uint256 => address) private _approvedAddress;
    mapping(uint256 => string) private _uri;
    mapping(address => uint256[]) private _enumOwner;
    mapping(address => mapping(uint256 => uint256)) private _enumOwnerIndex;
    mapping(bytes4 => bool) private _supportedInterfaces;

    /// @notice Constructor creates Parents with specified Genes
    /// @param GenesParent1 Specify Genes of first Parent
    /// @param GenesParent2 Specify Genes of second Parent
    constructor(
        uint256 GenesParent1,
        uint256 GenesParent2,
        string memory base
    ) {
        _addAnimal(GenesParent1, 0, 0, "Eve", msg.sender, string(abi.encodePacked(base, Strings.toHexString(GenesParent1))));
        _addAnimal(GenesParent2, 0, 0, "Adam", msg.sender, string(abi.encodePacked(base, Strings.toHexString(GenesParent2))));
        _supportedInterfaces[0x80ac58cd] = true;
        _supportedInterfaces[0x01ffc9a7] = true;
        _supportedInterfaces[0x5b5e139f] = true;
        _supportedInterfaces[0x780e9d63] = true;
    }

    function _addAnimal(
        uint256 Genes,
        uint256 Parent1,
        uint256 Parent2,
        string memory Name,
        address firstOwner,
        string memory uri
    ) private {
        _tokenIds++;
        _parent1[_tokenIds] = Parent1;
        _parent2[_tokenIds] = Parent2;
        _genes[_tokenIds] = Genes;
        _name[_tokenIds] = Name;
        _owner[_tokenIds] = firstOwner;
        _uri[_tokenIds] = uri;
        _enumOwner[firstOwner].push(_tokenIds);
        _enumOwnerIndex[firstOwner][_tokenIds] =
            _enumOwner[firstOwner].length -
            1;
    }

    function _transfer(
        address _from,
        address _to,
        uint256 _tokenId
    ) private {
        require(
            _to != address(0) && _from != address(0),
            "Cannot transfer to Zero Address!"
        );
        _owner[_tokenId] = _to;
        _approvedAddress[_tokenId] = address(0);
        _enumOwner[_to].push(_tokenId);
        _enumOwnerIndex[_to][_tokenId] = _enumOwner[_to].length - 1;

        _enumOwner[_from][_enumOwnerIndex[_from][_tokenId]] = _enumOwner[_from][
            _enumOwner[_from].length - 1
        ];

        _enumOwnerIndex[_from][
            _enumOwner[_from][_enumOwner[_from].length - 1]
        ] = _enumOwnerIndex[_from][_tokenId];

        _enumOwner[_from].pop();
    }

    // ----------------------- Begin Breading Functionality ------------------------------

    /// @notice Bread Child from two Parents
    /// @param Parent1 First Parent used for Breading
    /// @param Parent2 Second Parent used for Breading
    /// @return tokenId of Child
    function breed(
        uint256 Parent1,
        uint256 Parent2,
        string memory childName,
        string memory base
    ) public returns (uint256) {
        require(Parent1 != Parent2, "Need two individual Parents!");
        require(
            _owner[Parent1] == msg.sender ||
                _operator[_owner[Parent1]][msg.sender] == true,
            "Not the owner, nor the operator of the owner of first Parent!"
        );
        require(
            _owner[Parent2] == msg.sender ||
                _operator[_owner[Parent2]][msg.sender] == true,
            "Not the owner, nor the operator of the owner of second Parent!"
        );

        uint256 seed = uint256(keccak256(abi.encodePacked(block.number)));
        uint256 childGene = (((_genes[Parent1] ^ _genes[Parent2]) ^
            0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff) &
            _genes[Parent1]) | ((_genes[Parent1] ^ _genes[Parent2]) & seed);

        _addAnimal(childGene, Parent1, Parent2, childName, msg.sender, string(abi.encodePacked(base, Strings.toString(childGene))));
        return _tokenIds;
    }

    function _isValidToken(uint256 _tokenId) private view returns (bool) {
        if (_tokenId > 0 && _tokenId <= _tokenIds) return true;
        return false;
    }

    // ----------------------- End Breading Functionality ------------------------------

    function nameOf(uint256 _tokenId) external view returns (string memory) {
        require(_isValidToken(_tokenId), "Not a valid Token!");
        return _name[_tokenId];
    }

    function parent1Of(uint256 _tokenId) external view returns (uint256) {
        require(_isValidToken(_tokenId), "Not a valid Token!");
        return _parent1[_tokenId];
    }

    function parent2Of(uint256 _tokenId) external view returns (uint256) {
        require(_isValidToken(_tokenId), "Not a valid Token!");
        return _parent2[_tokenId];
    }

    function genesOf(uint256 _tokenId) external view returns (uint256) {
        require(_isValidToken(_tokenId), "Not a valid Token!");
        return _genes[_tokenId];
    }

    function last() external view returns (uint256) {
        return _tokenIds;
    }

    // ----------------------- Begin ERC721 Functions -------------------------------------

    /// @notice Count all NFTs assigned to an owner
    /// @dev NFTs assigned to the zero address are considered invalid, and this
    ///  function throws for queries about the zero address.
    /// @param _checkowner An address for whom to query the balance
    /// @return The number of NFTs owned by `_owner`, possibly zero
    function balanceOf(address _checkowner)
        external
        view
        override
        returns (uint256)
    {
        return _enumOwner[_checkowner].length;
    }

    /// @notice Find the owner of an NFT
    /// @dev NFTs assigned to zero address are considered invalid, and queries
    ///  about them do throw.
    /// @param _tokenId The identifier for an NFT
    /// @return The address of the owner of the NFT
    function ownerOf(uint256 _tokenId)
        external
        view
        override
        returns (address)
    {
        return _owner[_tokenId];
    }

    /// @notice Transfers the ownership of an NFT from one address to another address
    /// @dev Throws unless `msg.sender` is the current owner, an authorized
    ///  operator, or the approved address for this NFT. Throws if `_from` is
    ///  not the current owner. Throws if `_to` is the zero address. Throws if
    ///  `_tokenId` is not a valid NFT. When transfer is complete, this function
    ///  checks if `_to` is a smart contract (code size > 0). If so, it calls
    ///  `onERC721Received` on `_to` and throws if the return value is not
    ///  `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`.
    /// @param _from The current owner of the NFT
    /// @param _to The new owner
    /// @param _tokenId The NFT to transfer
    /// @param data Additional data with no specified format, sent in call to `_to`
    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _tokenId,
        bytes calldata data
    ) external override {
        require(
            msg.sender == _owner[_tokenId] ||
                _operator[_from][msg.sender] == true ||
                msg.sender == _owner[_tokenId],
            "Sender not authorized!"
        );
        require(_from == _owner[_tokenId], "Not the Owner!");
        require(
            _to == address(0) && _from == address(0),
            "Cannot transfer to Zero Address!"
        );
        require(_tokenId <= _tokenIds && _tokenId > 0, "Not a valid NFT");

        _transfer(_from, _to, _tokenId);

        // Check for _to being a smart contract
        bytes32 codehash;
        bytes32 accountHash = 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470;
        assembly {
            codehash := extcodehash(_to)
        } // solhint-disable-line
        if (codehash != 0x0 && codehash != accountHash) {
            bytes4 retval = ERC721TokenReceiver(_to).onERC721Received(
                msg.sender,
                _from,
                _tokenId,
                data
            );
            require(retval == 0x150b7a02, "Can not receive NFT");
        }

        emit Transfer(_from, _to, _tokenId);
    }

    /// @notice Transfers the ownership of an NFT from one address to another address
    /// @dev This works identically to the other function with an extra data parameter,
    ///  except this function just sets data to "".
    /// @param _from The current owner of the NFT
    /// @param _to The new owner
    /// @param _tokenId The NFT to transfer
    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _tokenId
    ) external override {
        require(
            msg.sender == _owner[_tokenId] ||
                _operator[_from][msg.sender] == true ||
                msg.sender == _owner[_tokenId],
            "Sender not authorized!"
        );
        require(_from == _owner[_tokenId], "Not the Owner!");
        require(
            _to != address(0) && _from != address(0),
            "Cannot transfer to Zero Address!"
        );
        require(_tokenId <= _tokenIds && _tokenId > 0, "Not a valid NFT");

        _transfer(_from, _to, _tokenId);

        // Check for _to being a smart contract
        bytes32 codehash;
        bytes32 accountHash = 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470;
        assembly {
            codehash := extcodehash(_to)
        } // solhint-disable-line
        if (codehash != 0x0 && codehash != accountHash) {
            bytes4 retval = ERC721TokenReceiver(_to).onERC721Received(
                msg.sender,
                _from,
                _tokenId,
                ""
            );
            require(retval == 0x150b7a02, "Can not receive NFT");
        }
        emit Transfer(_from, _to, _tokenId);
    }

    /// @notice Transfer ownership of an NFT -- THE CALLER IS RESPONSIBLE
    ///  TO CONFIRM THAT `_to` IS CAPABLE OF RECEIVING NFTS OR ELSE
    ///  THEY MAY BE PERMANENTLY LOST
    /// @dev Throws unless `msg.sender` is the current owner, an authorized
    ///  operator, or the approved address for this NFT. Throws if `_from` is
    ///  not the current owner. Throws if `_to` is the zero address. Throws if
    ///  `_tokenId` is not a valid NFT.
    /// @param _from The current owner of the NFT
    /// @param _to The new owner
    /// @param _tokenId The NFT to transfer
    function transferFrom(
        address _from,
        address _to,
        uint256 _tokenId
    ) external override {
        require(_owner[_tokenId] == _from, "You are not the owner!");
        require(
            _owner[_tokenId] == msg.sender ||
                _approvedAddress[_tokenId] == msg.sender,
            "You are not the owner!"
        );
        require(
            _to != address(0) && _from != address(0),
            "Cannot send to zero address"
        );
        require(_tokenId <= _tokenIds && _tokenId > 0, "Not a valid NFT");

        _transfer(_from, _to, _tokenId);
        emit Transfer(_from, _to, _tokenId);
    }

    /// @notice Change or reaffirm the approved address for an NFT
    /// @dev The zero address indicates there is no approved address.
    ///  Throws unless `msg.sender` is the current NFT owner, or an authorized
    ///  operator of the current owner.
    /// @param _approved The new approved NFT controller
    /// @param _tokenId The NFT to approve
    function approve(address _approved, uint256 _tokenId) external override {
        require(
            _owner[_tokenId] == msg.sender ||
                _operator[_owner[_tokenId]][msg.sender],
            "Neither the owner, nor a approved Operator"
        );
        _approvedAddress[_tokenId] = _approved;
        emit Approval(_owner[_tokenId], _approved, _tokenId);
    }

    /// @notice Enable or disable approval for a third party ("operator") to manage
    ///  all of `msg.sender`'s assets
    /// @dev Emits the ApprovalForAll event. The contract MUST allow
    ///  multiple operators per owner.
    /// @param _newoperator Address to add to the set of authorized operators
    /// @param _approved True if the operator is approved, false to revoke approval
    function setApprovalForAll(address _newoperator, bool _approved)
        external
        override
    {
        _operator[msg.sender][_newoperator] = _approved;
        emit ApprovalForAll(msg.sender, _newoperator, _approved);
    }

    /// @notice Get the approved address for a single NFT
    /// @dev Throws if `_tokenId` is not a valid NFT.
    /// @param _tokenId The NFT to find the approved address for
    /// @return The approved address for this NFT, or the zero address if there is none
    function getApproved(uint256 _tokenId)
        external
        view
        override
        returns (address)
    {
        require(_isValidToken(_tokenId), "Not a valid NFT!");
        return _approvedAddress[_tokenId];
    }

    /// @notice Query if an address is an authorized operator for another address
    /// @param _checkowner The address that owns the NFTs
    /// @param _checkoperator The address that acts on behalf of the owner
    /// @return True if `_operator` is an approved operator for `_owner`, false otherwise
    function isApprovedForAll(address _checkowner, address _checkoperator)
        external
        view
        override
        returns (bool)
    {
        return _operator[_checkowner][_checkoperator];
    }

    // ----------------------- End ERC721 Functions -------------------------------------

    // ----------------------- Begin ERC721Metadata Functions -------------------------------------

    /// @notice A descriptive name for a collection of NFTs in this contract
    function name() external pure override returns (string memory _retname) {
        return "Animals";
    }

    /// @notice An abbreviated name for NFTs in this contract
    function symbol()
        external
        pure
        override
        returns (string memory _retsymbol)
    {
        return "ANMLS";
    }

    /// @notice A distinct Uniform Resource Identifier (URI) for a given asset.
    /// @dev Throws if `_tokenId` is not a valid NFT. URIs are defined in RFC
    ///  3986. The URI may point to a JSON file that conforms to the "ERC721
    ///  Metadata JSON Schema".
    function tokenURI(uint256 _tokenId)
        external
        view
        override
        returns (string memory)
    {
        require(_isValidToken(_tokenId), "Not a valid NFT");
        return _uri[_tokenId];
    }

    // Additional: Set URI
    function setTokenUri(uint256 _tokenId, string memory newuri) external {
        require(_isValidToken(_tokenId), "Not a valid NFT");
        require(
            _owner[_tokenId] == msg.sender ||
                _operator[_owner[_tokenId]][msg.sender],
            "Neither the owner, nor a approved Operator"
        );
        _uri[_tokenId] = newuri;
    }

    // ----------------------- End ERC721Metadata Functions -------------------------------------

    // ----------------------- Begin ERC165 Functions -------------------------------------

    /// @notice Query if a contract implements an interface
    /// @param interfaceID The interface identifier, as specified in ERC-165
    /// @dev Interface identification is specified in ERC-165. This function
    ///  uses less than 30,000 gas.
    /// @return `true` if the contract implements `interfaceID` and
    ///  `interfaceID` is not 0xffffffff, `false` otherwise
    function supportsInterface(bytes4 interfaceID)
        external
        view
        override
        returns (bool)
    {
        return _supportedInterfaces[interfaceID];
    }

    // ----------------------- End ERC165 Functions -------------------------------------
    // ----------------------- Begin ERC721Enumerable Functions -------------------------

    /// @notice Count NFTs tracked by this contract
    /// @return A count of valid NFTs tracked by this contract, where each one of
    ///  them has an assigned and queryable owner not equal to the zero address
    function totalSupply() external view override returns (uint256) {
        return _tokenIds;
    }

    /// @notice Enumerate valid NFTs
    /// @dev Throws if `_index` >= `totalSupply()`.
    /// @param _index A counter less than `totalSupply()`
    /// @return The token identifier for the `_index`th NFT,
    ///  (sort order not specified)
    function tokenByIndex(uint256 _index)
        external
        view
        override
        returns (uint256)
    {
        require(_index < _tokenIds, "Index is too high");
        return _index + 1;
    }

    /// @notice Enumerate NFTs assigned to an owner
    /// @dev Throws if `_index` >= `balanceOf(_owner)` or if
    ///  `_owner` is the zero address, representing invalid NFTs.
    /// @param _checkowner An address where we are interested in NFTs owned by them
    /// @param _index A counter less than `balanceOf(_owner)`
    /// @return The token identifier for the `_index`th NFT assigned to `_owner`,
    ///   (sort order not specified)
    function tokenOfOwnerByIndex(address _checkowner, uint256 _index)
        external
        view
        override
        returns (uint256)
    {
        require(
            _enumOwner[_checkowner].length > _index,
            "Address does not own that many Tokens"
        );
        require(_checkowner != address(0), "Given Address is zero");
        return _enumOwner[_checkowner][_index];
    }

    // ----------------------- End ERC721Enumerable Functions ---------------------------
}
