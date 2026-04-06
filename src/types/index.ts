export interface SessionUser {
  id: string;
  employeeId: string;
  email: string;
  name: string;
  department: string;
  role: "ADMIN" | "COUNCIL" | "MEMBER";
  memberType: "PROPOSER" | "DELEGATE";
  kycVerified: boolean;
  walletBound: boolean;
  walletProvider: string | null;
  hederaAccountId: string | null;
  reputationScore: number;
  spuBalance: number;
  active: boolean;
}

export interface ProposalData {
  id: string;
  number: number;
  title: string;
  description: string;
  status: "DRAFT" | "PENDING" | "APPROVED" | "EXECUTING" | "COMPLETED" | "REJECTED";
  createdAt: string;
  author: { name: string; employeeId: string; department: string };
}

export interface ElectionData {
  id: string;
  title: string;
  status: "DRAFT" | "SCHEDULED" | "LIVE" | "CLOSED" | "FINALIZED";
  electionType: string;
  startDate: string;
  endDate: string;
  eligibleMemberCount: number;
  requireReputation: boolean;
  allowDelegation: boolean;
  snapshotEligibility: boolean;
  candidates: CandidateData[];
  _count: { votes: number };
}

export interface CandidateData {
  id: string;
  name: string;
  department: string;
  voteCount: number;
}

export interface GovernanceEventData {
  id: string;
  type: "LOTTERY" | "GIVEAWAY";
  title: string;
  description: string;
  status: "UPCOMING" | "ACTIVE" | "CLOSED";
  prize: string;
  drawDate: string | null;
  closesAt: string | null;
  userEntered: boolean;
  _count: { entries: number };
}

export interface HistoryItem {
  id: string;
  type: "vote" | "proposal" | "delegation" | "lottery" | "giveaway";
  title: string;
  detail: string;
  timestamp: string;
}

export interface ContractLogEntry {
  id: string;
  timestamp: string;
  contractName: string;
  eventType: string;
  details: string;
  txHash: string | null;
}

export interface GovernanceRuleData {
  id: string;
  period: number;
  quorumThreshold: number;
  votingWindowHours: number;
  minReputationScore: number;
  delegationLimit: number;
  executionDelayHours: number;
  timelockWindowHours: number;
  multisigRequired: number;
  multisigTotal: number;
}
