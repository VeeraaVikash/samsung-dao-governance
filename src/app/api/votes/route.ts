import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/votes — Get current user's votes
export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const votes = await db.vote.findMany({
    where: { userId: user.id },
    include: {
      election: { select: { id: true, title: true, status: true } },
      candidate: { select: { id: true, name: true, department: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(votes);
}

// POST /api/votes — Cast a vote (alias for /api/elections POST)
export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { electionId, candidateId } = await req.json();

  if (!electionId || !candidateId) {
    return NextResponse.json({ error: "electionId and candidateId required" }, { status: 400 });
  }

  // Check election is live
  const election = await db.election.findUnique({ where: { id: electionId } });
  if (!election || election.status !== "LIVE") {
    return NextResponse.json({ error: "Election is not active" }, { status: 400 });
  }

  // Check reputation
  if (election.requireReputation) {
    const rules = await db.governanceRule.findFirst({ where: { active: true } });
    if (rules && user.reputationScore < rules.minReputationScore) {
      return NextResponse.json({ error: `Minimum reputation of ${rules.minReputationScore} required` }, { status: 403 });
    }
  }

  // Check not already voted
  const existing = await db.vote.findUnique({
    where: { electionId_userId: { electionId, userId: user.id } },
  });
  if (existing) {
    return NextResponse.json({ error: "Already voted in this election" }, { status: 409 });
  }

  // Cast vote
  const [vote] = await db.$transaction([
    db.vote.create({ data: { electionId, candidateId, userId: user.id } }),
    db.candidate.update({ where: { id: candidateId }, data: { voteCount: { increment: 1 } } }),
    db.contractLog.create({
      data: {
        contractName: "VotingEngine.sol",
        eventType: "VoteCast",
        details: `Vote cast · ${user.employeeId} → ${candidateId}`,
        txHash: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
      },
    }),
  ]);

  return NextResponse.json({ success: true, voteId: vote.id });
}
