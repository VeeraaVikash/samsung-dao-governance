// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract LotteryManager {
    address[] public entries;
    address public lastWinner;
    
    event EnteredLottery(address indexed entrant);
    event LotteryWinnerSelected(address indexed winner, uint256 prizeAmount);
    
    function enterLottery() external {
        entries.push(msg.sender);
        emit EnteredLottery(msg.sender);
    }
    
    function drawWinners() external {
        require(entries.length > 0, "No entries");
        
        // MVP SIMPLIFICATION: Pseudo-randomness
        uint256 randomIndex = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, entries.length))) % entries.length;
        lastWinner = entries[randomIndex];
        
        // Reset for next round
        delete entries;
        
        emit LotteryWinnerSelected(lastWinner, 1000); // Fixed MVP prize
    }
    
    function getEntriesCount() external view returns (uint256) {
        return entries.length;
    }
}
