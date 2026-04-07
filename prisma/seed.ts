import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Samsung DAO database...\n");

  // ── Admin user ──
  await db.user.upsert({
    where: { employeeId: "SEC-ADMIN-001" },
    update: {},
    create: {
      employeeId: "SEC-ADMIN-001",
      email: "admin@samsung.com",
      name: "Admin User",
      password: await bcrypt.hash("admin123", 10),
      department: "Platform Security",
      role: "ADMIN",
      kycVerified: true,
      reputationScore: 1000,
      spuBalance: 0,
    },
  });

  // ── Council member ──
  const council = await db.user.upsert({
    where: { employeeId: "SEC-COUNCIL-001" },
    update: {},
    create: {
      employeeId: "SEC-COUNCIL-001",
      email: "council@samsung.com",
      name: "Kim Jae-won",
      password: await bcrypt.hash("council123", 10),
      department: "R&D",
      role: "COUNCIL",
      kycVerified: true,
      hederaAccountId: "0.0.4827100",
      walletBound: true,
      walletProvider: "hashpack",
      walletBoundAt: new Date("2025-03-01"),
      reputationScore: 850,
      spuBalance: 380,
    },
  });

  // ── Standard member — proposer ──
  const member = await db.user.upsert({
    where: { employeeId: "SEC-2024-00421" },
    update: {},
    create: {
      employeeId: "SEC-2024-00421",
      email: "member@samsung.com",
      name: "Park Soo-yeon",
      password: await bcrypt.hash("member123", 10),
      department: "R&D Division",
      role: "MEMBER",
      memberType: "PROPOSER",
      kycVerified: true,
      hederaAccountId: "0.0.4827341",
      walletBound: true,
      walletProvider: "hashpack",
      walletBoundAt: new Date("2025-03-10"),
      reputationScore: 847,
      spuBalance: 240,
    },
  });

  // ── Delegate member ──
  await db.user.upsert({
    where: { employeeId: "SEC-2024-00500" },
    update: {},
    create: {
      employeeId: "SEC-2024-00500",
      email: "delegate@samsung.com",
      name: "Han Ji-min",
      password: await bcrypt.hash("member123", 10),
      department: "Product",
      role: "MEMBER",
      memberType: "DELEGATE",
      kycVerified: true,
      hederaAccountId: "0.0.4827500",
      walletBound: true,
      walletProvider: "walletconnect",
      walletBoundAt: new Date("2025-03-10"),
      reputationScore: 560,
      spuBalance: 120,
    },
  });

  // ── Extra council members for multisig ──
  for (const [i, data] of [
    { name: "Lee Min-jun", dept: "Engineering", eid: "SEC-COUNCIL-002" },
    { name: "Choi Dong-hyun", dept: "Product", eid: "SEC-COUNCIL-003" },
    { name: "Yoon Ha-neul", dept: "Security", eid: "SEC-COUNCIL-004" },
    { name: "Kang Seo-jin", dept: "Design", eid: "SEC-COUNCIL-005" },
  ].entries()) {
    await db.user.upsert({
      where: { employeeId: data.eid },
      update: {},
      create: {
        employeeId: data.eid,
        email: `council${i + 2}@samsung.com`,
        name: data.name,
        password: await bcrypt.hash("council123", 10),
        department: data.dept,
        role: "COUNCIL",
        kycVerified: true,
        hederaAccountId: `0.0.482710${i + 1}`,
        walletBound: true,
        walletProvider: "hashpack",
        walletBoundAt: new Date("2025-03-01"),
        reputationScore: 750 + i * 40,
        spuBalance: 200 + i * 50,
      },
    });
  }
  console.log("  ✓ Users created (7 total)\n");

  // ── Governance rules ──
  await db.governanceRule.upsert({
    where: { id: "default-rules" },
    update: {},
    create: {
      id: "default-rules",
      period: 7,
      quorumThreshold: 51,
      votingWindowHours: 72,
      minReputationScore: 100,
      delegationLimit: 5,
      executionDelayHours: 48,
      timelockWindowHours: 48,
      multisigRequired: 3,
      multisigTotal: 5,
      active: true,
    },
  });
  console.log("  ✓ Governance rules (period #7)\n");

  // ── Election ──
  const election = await db.election.create({
    data: {
      title: "Product Feature Vote — Q2 2025",
      status: "LIVE",
      electionType: "SINGLE_CHOICE",
      startDate: new Date("2025-04-01T09:00:00"),
      endDate: new Date("2025-04-04T18:00:00"),
      eligibleMemberCount: 847,
      requireReputation: true,
      allowDelegation: true,
    },
  });
  await db.candidate.createMany({
    data: [
      { electionId: election.id, name: "Add Night Mode to Samsung Gallery", department: "Galaxy Apps", voteCount: 187 },
      { electionId: election.id, name: "S Pen Latency Improvement for Galaxy Note", department: "Mobile Division", voteCount: 143 },
      { electionId: election.id, name: "Bixby Smart Home Third-Party Integration", department: "AI/IoT Division", voteCount: 82 },
    ],
  });
  console.log("  ✓ Election + 3 candidates\n");

  // ── Proposals ──
  await db.proposal.createMany({
    data: [
      { title: "Q2 SPU token reward increase", description: "Increase SPU rewards by 20% for active governance participants.", authorId: member.id, status: "PENDING" },
      { title: "Update delegation rules", description: "Allow up to 10 delegations per delegate instead of current 5 limit.", authorId: member.id, status: "APPROVED" },
      { title: "Modify quorum threshold", description: "Reduce quorum threshold from 51% to 40% for routine proposals.", authorId: member.id, status: "DRAFT" },
    ],
  });
  console.log("  ✓ 3 proposals\n");

  // ── Events ──
  await db.governanceEvent.createMany({
    data: [
      { type: "LOTTERY", title: "Q2 Samsung SPU Lottery", description: "Quarterly SPU token lottery for active members", status: "ACTIVE", prize: "500 SPU", drawDate: new Date("2025-04-15"), closesAt: new Date("2025-04-14") },
      { type: "GIVEAWAY", title: "PRISM Research Giveaway", description: "Giveaway for PRISM research contributors", status: "ACTIVE", prize: "Samsung Galaxy Tab", closesAt: new Date("2025-04-20") },
    ],
  });
  console.log("  ✓ 2 events (lottery + giveaway)\n");

  // ── Multisig action ──
  const msigAction = await db.multisigAction.create({
    data: {
      description: "Execute P-11 · Update delegation rules",
      proposalNumber: 11,
      requiredSigs: 3,
      totalSigners: 5,
      status: "PENDING",
      expiresAt: new Date(Date.now() + 38 * 60 * 60 * 1000),
    },
  });
  await db.multisigSignature.createMany({
    data: [
      { actionId: msigAction.id, userId: council.id },
    ],
    skipDuplicates: true,
  });
  console.log("  ✓ Multisig action (1/3 sigs)\n");

  // ── Contract logs ──
  await db.contractLog.createMany({
    data: [
      { contractName: "VotingEngine.sol", eventType: "VoteCast", details: "Vote cast · Member 0.0.4827341", txHash: "0x1a2b3c" },
      { contractName: "Governance.sol", eventType: "ProposalSubmitted", details: "Proposal P-12 submitted", txHash: "0x4d5e6f" },
      { contractName: "TimelockController", eventType: "DelayInitiated", details: "48h delay initiated · P-11", txHash: "0x7g8h9i" },
      { contractName: "ReputationOracle", eventType: "DecayApplied", details: "Decay applied · 23 members", txHash: null },
      { contractName: "DelegationReg.sol", eventType: "DelegationUpdated", details: "Delegation updated · 0.0.3921", txHash: "0xab12cd" },
    ],
  });
  console.log("  ✓ 5 contract log entries\n");

  console.log("✅ Seed complete!\n");
  console.log("Login credentials:");
  console.log("  Admin:    SEC-ADMIN-001    / admin123");
  console.log("  Council:  SEC-COUNCIL-001  / council123");
  console.log("  Member:   SEC-2024-00421   / member123");
  console.log("  Delegate: SEC-2024-00500   / member123\n");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
