// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract TimelockController {
    uint256 public constant MIN_DELAY = 172800; // 48 hours for anti-flash governance
    
    mapping(bytes32 => bool) public queuedTransactions;
    
    address public admin; // Expected to be the council multi-sig layer
    
    event QueueTransaction(bytes32 indexed txHash, address indexed target, uint256 value, string signature, bytes data, uint256 eta);
    event ExecuteTransaction(bytes32 indexed txHash, address indexed target, uint256 value, string signature, bytes data, uint256 eta);

    constructor() {
        admin = msg.sender;
    }
    
    function queueTransaction(address target, uint256 value, string memory signature, bytes memory data, uint256 eta) public returns (bytes32) {
        require(msg.sender == admin, "Timelock::queueTransaction: Call must come from admin.");
        require(eta >= block.timestamp + MIN_DELAY, "Timelock::queueTransaction: Estimated execution delay not met.");
        
        bytes32 txHash = keccak256(abi.encode(target, value, signature, data, eta));
        queuedTransactions[txHash] = true;
        
        emit QueueTransaction(txHash, target, value, signature, data, eta);
        return txHash;
    }

    function executeTransaction(address target, uint256 value, string memory signature, bytes memory data, uint256 eta) public payable returns (bytes memory) {
        require(msg.sender == admin, "Timelock::executeTransaction: Call must come from admin.");
        
        bytes32 txHash = keccak256(abi.encode(target, value, signature, data, eta));
        require(queuedTransactions[txHash], "Timelock::executeTransaction: Transaction hasn't been queued.");
        require(block.timestamp >= eta, "Timelock::executeTransaction: Transaction hasn't surpassed time lock.");
        
        queuedTransactions[txHash] = false;
        
        // Execute the transaction
        bytes memory callData;
        if (bytes(signature).length == 0) {
            callData = data;
        } else {
            callData = abi.encodePacked(bytes4(keccak256(bytes(signature))), data);
        }

        (bool success, bytes memory returnData) = target.call{value: value}(callData);
        require(success, "Timelock::executeTransaction: Transaction execution reverted.");

        emit ExecuteTransaction(txHash, target, value, signature, data, eta);
        return returnData;
    }
}
