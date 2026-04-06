import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// GET /api/governance — Get active governance rules
export async function GET() {
  const user = await getSession();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rules = await db.governanceRule.findFirst({
    where: { active: true },
    orderBy: { period: "desc" },
  });

  return NextResponse.json(rules);
}

const updateSchema = z.object({
  quorumThreshold: z.number().min(1).max(100).optional(),
  votingWindowHours: z.number().min(1).max(720).optional(),
  minReputationScore: z.number().min(0).max(10000).optional(),
  delegationLimit: z.number().min(1).max(50).optional(),
  executionDelayHours: z.number().min(0).max(168).optional(),
});

// PATCH /api/governance — Update rules (Council only)
export async function PATCH(req: NextRequest) {
  const user = await getSession();
  if (!user?.id || user.role !== "COUNCIL") {
    return NextResponse.json({ error: "Council access required" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const current = await db.governanceRule.findFirst({
    where: { active: true },
    orderBy: { period: "desc" },
  });

  if (!current) {
    return NextResponse.json({ error: "No active governance rules found" }, { status: 404 });
  }

  const updated = await db.governanceRule.update({
    where: { id: current.id },
    data: parsed.data,
  });

  await db.contractLog.create({
    data: {
      contractName: "GovernanceRules.sol",
      eventType: "RulesUpdated",
      details: `Governance rules updated by ${user.name} — period #${current.period}`,
      txHash: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
    },
  });

  return NextResponse.json(updated);
}
