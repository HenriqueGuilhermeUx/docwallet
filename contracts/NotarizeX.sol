// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title NotarizeX
 * @dev Smart contract for document authentication on Polygon blockchain
 * @notice Allows users to notarize documents and create smart contracts
 * @author DocWallet Team
 */
contract NotarizeX {
    // Structs
    struct Notarization {
        address owner;
        string documentHash;
        string documentName;
        uint256 timestamp;
        uint256 blockNumber;
        bool exists;
    }

    struct SmartContract {
        address party1;
        address party2;
        string contractType;
        string termsHash;
        uint256 value;
        uint256 createdAt;
        uint256 expirationDate;
        bool active;
        address creator;
    }

    // State variables
    address public admin;
    uint256 public notarizationCount;
    uint256 public contractCount;

    // Mappings
    mapping(bytes32 => Notarization) public notarizations;
    mapping(uint256 => SmartContract) public contracts;
    mapping(address => bytes32[]) public userNotarizations;
    mapping(address => uint256[]) public userContracts;

    // Events
    event DocumentNotarized(
        bytes32 indexed hash,
        address indexed owner,
        string documentName,
        uint256 timestamp,
        uint256 blockNumber
    );

    event ContractCreated(
        uint256 indexed contractId,
        address indexed creator,
        address indexed party2,
        string contractType
    );

    event ContractSigned(
        uint256 indexed contractId,
        address indexed signer
    );

    event ContractCompleted(
        uint256 indexed contractId
    );

    event ContractCancelled(
        uint256 indexed contractId
    );

    // Errors
    error NotarizationAlreadyExists(bytes32 hash);
    error NotarizationDoesNotExist(bytes32 hash);
    error Unauthorized();
    error ContractAlreadyActive();
    error ContractNotFound();

    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    /**
     * @dev Notarize a document hash on the blockchain
     * @param documentHash SHA-256 hash of the document
     * @param documentName Name/description of the document
     * @return bytes32 The hash key for this notarization
     */
    function notarize(
        string calldata documentHash,
        string calldata documentName
    ) external returns (bytes32) {
        bytes32 hash = keccak256(abi.encodePacked(documentHash));

        if (notarizations[hash].exists) {
            revert NotarizationAlreadyExists(hash);
        }

        notarizations[hash] = Notarization({
            owner: msg.sender,
            documentHash: documentHash,
            documentName: documentName,
            timestamp: block.timestamp,
            blockNumber: block.number,
            exists: true
        });

        userNotarizations[msg.sender].push(hash);
        notarizationCount++;

        emit DocumentNotarized(hash, msg.sender, documentName, block.timestamp, block.number);

        return hash;
    }

    /**
     * @dev Verify if a document hash has been notarized
     * @param hash The document hash to verify
     * @return Notarization The notarization details
     */
    function verify(bytes32 hash) external view returns (Notarization memory) {
        if (!notarizations[hash].exists) {
            revert NotarizationDoesNotExist(hash);
        }
        return notarizations[hash];
    }

    /**
     * @dev Check if a document hash exists
     * @param hash The document hash to check
     * @return bool True if exists
     */
    function exists(bytes32 hash) external view returns (bool) {
        return notarizations[hash].exists;
    }

    /**
     * @dev Get user's notarizations count
     * @param user Address of the user
     * @return uint256 Number of notarizations
     */
    function getUserNotarizationCount(address user) external view returns (uint256) {
        return userNotarizations[user].length;
    }

    /**
     * @dev Create a smart contract between two parties
     * @param party2 Second party address
     * @param contractType Type of contract
     * @param termsHash IPFS hash of contract terms
     * @param value Contract value in MATIC (wei)
     * @param expirationDays Days until expiration
     */
    function createContract(
        address party2,
        string calldata contractType,
        string calldata termsHash,
        uint256 value,
        uint256 expirationDays
    ) external returns (uint256) {
        require(party2 != address(0), "Invalid party2 address");
        require(expirationDays > 0, "Invalid expiration");

        uint256 contractId = contractCount++;

        contracts[contractId] = SmartContract({
            party1: msg.sender,
            party2: party2,
            contractType: contractType,
            termsHash: termsHash,
            value: value,
            createdAt: block.timestamp,
            expirationDate: block.timestamp + (expirationDays * 1 days),
            active: true,
            creator: msg.sender
        });

        userContracts[msg.sender].push(contractId);
        userContracts[party2].push(contractId);

        emit ContractCreated(contractId, msg.sender, party2, contractType);

        return contractId;
    }

    /**
     * @dev Party 2 accepts/signs the contract
     */
    function signContract(uint256 contractId) external {
        SmartContract storage contract_ = contracts[contractId];

        if (!contract_.active) {
            revert ContractNotFound();
        }

        require(contract_.party2 == msg.sender, "Only party2 can sign");
        require(block.timestamp <= contract_.expirationDate, "Contract expired");

        emit ContractSigned(contractId, msg.sender);
    }

    /**
     * @dev Complete a contract (both parties agree)
     */
    function completeContract(uint256 contractId) external {
        SmartContract storage contract_ = contracts[contractId];

        if (!contract_.active) {
            revert ContractNotFound();
        }

        require(
            contract_.party1 == msg.sender || contract_.party2 == msg.sender,
            "Only parties can complete"
        );

        contract_.active = false;

        emit ContractCompleted(contractId);
    }

    /**
     * @dev Cancel a contract
     */
    function cancelContract(uint256 contractId) external {
        SmartContract storage contract_ = contracts[contractId];

        if (!contract_.active) {
            revert ContractNotFound();
        }

        require(
            contract_.party1 == msg.sender || contract_.party2 == msg.sender,
            "Only parties can cancel"
        );

        contract_.active = false;

        emit ContractCancelled(contractId);
    }

    /**
     * @dev Get contract details
     */
    function getContract(uint256 contractId) external view returns (SmartContract memory) {
        return contracts[contractId];
    }

    /**
     * @dev Get user contract count
     */
    function getUserContractCount(address user) external view returns (uint256) {
        return userContracts[user].length;
    }

    /**
     * @dev Update admin address
     */
    function updateAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Invalid admin");
        admin = newAdmin;
    }
}
