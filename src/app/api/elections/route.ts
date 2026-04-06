import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/elections — List elections
export const dynamic = "force-dynamic";

export async function GET() {
  const elections = await db.election.findMany({
    include: {
      candidates: { orderBy: { voteCount: "desc" } },
      _count: { select: { votes: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(elections);
}

// POST /api/elections — Cast a vote
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { electionId, candidateId } = await req.json();

  // Check election is live
  const election = await db.election.findUnique({ where: { id: electionId } });
  if (!election || election.status !== "LIVE") {
    return NextResponse.json({ error: "Election is not currently active" }, { status: 400 });
  }

  // Check reputation requirement
  if (election.requireReputation) {
    const rules = await db.governanceRule.findFirst({ where: { active: true } });
    if (rules && user.reputationScore < rules.minReputationScore) {
      return NextResponse.json({ error: `Minimum reputation of ${rules.minReputationScore} required` }, { status: 403 });
    }
  }

  // Check not already voted
  const existingVote = await db.vote.findUnique({
    where: { electionId_userId: { electionId, userId: user.id } },
  });
  if (existingVote) {
    return NextResponse.json({ error: "You have already voted in this election" }, { status: 409 });
  }

  // Cast vote (transaction)
  const [vote] = await db.$transaction([
    db.vote.create({
      data: { electionId, candidateId, userId: user.id },
    }),
    db.candidate.update({
      where: { id: candidateId },
      data: { voteCount: { increment: 1 } },
    }),
    db.contractLog.create({
      data: {
        contractName: "VotingEngine.sol",
        eventType: "VoteCast",
        details: `Vote cast · Member ${user.hederaAccountId || user.employeeId} → Candidate ${candidateId}`,
        txHash: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
      },
    }),
  ]);

  return NextResponse.json({ success: true, voteId: vote.id });
}

