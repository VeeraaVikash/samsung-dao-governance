// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract DelegationReg {
    // delegatee => total delegated power
    mapping(address => uint256) public delegatedPower;
    
    // delegator => delegatee
    mapping(address => address) public delegations;
    
    event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate);
    event DelegateVotesChanged(address indexed delegate, uint256 previousBalance, uint256 newBalance);
    
    function delegate(address delegatee) external {
        address currentDelegate = delegations[msg.sender];
        require(currentDelegate != delegatee, "Already delegated to this address");
        
        delegations[msg.sender] = delegatee;
        
        // MVP SIMPLIFICATION: Fixed amount of power delegated per user for demo
        uint256 amount = 100; 
        
        if (currentDelegate != address(0)) {
            delegatedPower[currentDelegate] -= amount;
            emit DelegateVotesChanged(currentDelegate, delegatedPower[currentDelegate] + amount, delegatedPower[currentDelegate]);
        }
        
        if (delegatee != address(0)) {
            delegatedPower[delegatee] += amount;
            emit DelegateVotesChanged(delegatee, delegatedPower[delegatee] - amount, delegatedPower[delegatee]);
        }
        
        emit DelegateChanged(msg.sender, currentDelegate, delegatee);
    }
    
    function revoke() external {
        address currentDelegate = delegations[msg.sender];
        require(currentDelegate != address(0), "No active delegation");
        
        delegations[msg.sender] = address(0);
        
        uint256 amount = 100;
        delegatedPower[currentDelegate] -= amount;
        
        emit DelegateVotesChanged(currentDelegate, delegatedPower[currentDelegate] + amount, delegatedPower[currentDelegate]);
        emit DelegateChanged(msg.sender, currentDelegate, address(0));
    }
    
    function getDelegatedPower(address account) external view returns (uint256) {
        return delegatedPower[account];
    }
}
