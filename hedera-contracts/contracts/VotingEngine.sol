// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IDelegationReg {
    function getDelegatedPower(address account) external view returns (uint256);
}

contract VotingEngine {
    IDelegationReg public delegationReg;
    
    struct ProposalVote {
        uint256 forVotes;
        uint256 againstVotes;
        mapping(address => bool) hasVoted;
    }
    
    mapping(uint256 => ProposalVote) public proposalVotes;
    
    event VoteCast(address indexed voter, uint256 indexed proposalId, uint8 support, uint256 weight, string reason);
    
    constructor(address _delegationReg) {
        delegationReg = IDelegationReg(_delegationReg);
    }
    
    function castVote(uint256 proposalId, uint8 support) external {
        ProposalVote storage pVote = proposalVotes[proposalId];
        require(!pVote.hasVoted[msg.sender], "VotingEngine: already voted");
        
        // MVP SIMPLIFICATION: Voting power = standard balance (100) + delegated power * reputation multiplier (static)
        uint256 baseVotingPower = 100;
        uint256 delegatedPower = delegationReg.getDelegatedPower(msg.sender);
        uint256 reputationMultiplier = 2; // Static MVP reputation factor
        
        uint256 weight = (baseVotingPower + delegatedPower) * reputationMultiplier;
        
        pVote.hasVoted[msg.sender] = true;
        
        if (support == 1) {
            pVote.forVotes += weight;
        } else if (support == 0) {
            pVote.againstVotes += weight;
        } else {
            revert("VotingEngine: invalid vote type; use 1 for For, 0 for Against");
        }
        
        emit VoteCast(msg.sender, proposalId, support, weight, "No reason provided");
    }
    
    function getProposalVotes(uint256 proposalId) external view returns (uint256 forVotes, uint256 againstVotes) {
        ProposalVote storage pVote = proposalVotes[proposalId];
        return (pVote.forVotes, pVote.againstVotes);
    }
    
    function hasVoted(uint256 proposalId, address voter) external view returns (bool) {
        return proposalVotes[proposalId].hasVoted[voter];
    }
}
