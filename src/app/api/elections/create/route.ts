import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createElectionSchema = z.object({
  title: z.string().min(3).max(200),
  electionType: z.enum(["SINGLE_CHOICE", "MULTI_CHOICE", "RANKED"]),
  startDate: z.string(),
  endDate: z.string(),
  requireReputation: z.boolean().default(true),
  allowDelegation: z.boolean().default(true),
  snapshotEligibility: z.boolean().default(false),
  candidates: z.array(z.object({
    name: z.string().min(2),
    department: z.string().min(2),
  })).min(2, "At least 2 candidates required"),
});

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user?.id || user.role !== "COUNCIL") {
    return NextResponse.json({ error: "Council access required" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createElectionSchema.safeParse(body);
  if (!parsed.success) {
    const errs = parsed.error.flatten();
    const msgs: string[] = [];
    Object.entries(errs.fieldErrors).forEach(([k, v]) => {
      if (v) msgs.push(`${k}: ${v.join(", ")}`);
    });
    return NextResponse.json({ error: msgs.join(" · ") || "Validation failed" }, { status: 400 });
  }

  const d = parsed.data;

  const election = await db.election.create({
    data: {
      title: d.title,
      electionType: d.electionType,
      status: "SCHEDULED",
      startDate: new Date(d.startDate),
      endDate: new Date(d.endDate),
      eligibleMemberCount: await db.user.count({ where: { role: "MEMBER", active: true } }),
      requireReputation: d.requireReputation,
      allowDelegation: d.allowDelegation,
      snapshotEligibility: d.snapshotEligibility,
      candidates: {
        create: d.candidates.map(c => ({ name: c.name, department: c.department, voteCount: 0 })),
      },
    },
    include: { candidates: true },
  });

  await db.contractLog.create({
    data: {
      contractName: "ElectionFactory.sol",
      eventType: "ElectionCreated",
      details: `Election created: "${d.title}" with ${d.candidates.length} candidates`,
      txHash: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
    },
  });

  return NextResponse.json(election, { status: 201 });
}
