import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// GET /api/proposals
export const dynamic = "force-dynamic";

export async function GET() {
  const proposals = await db.proposal.findMany({
    include: {
      author: { select: { id: true, name: true, department: true, employeeId: true } },
    },
    orderBy: { number: "desc" },
  });
  return NextResponse.json(proposals);
}

const createSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(5000),
});

// POST /api/proposals — Create proposal (Proposer only)
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role === "ADMIN") {
    return NextResponse.json({ error: "Admins cannot create proposals" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const messages: string[] = [];
    if (fieldErrors.title) messages.push(`Title: ${fieldErrors.title.join(", ")}`);
    if (fieldErrors.description) messages.push(`Description: ${fieldErrors.description.join(", ")}`);
    return NextResponse.json({
      error: messages.length > 0 ? messages.join(" · ") : "Validation failed",
      details: fieldErrors,
    }, { status: 400 });
  }

  const proposal = await db.proposal.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      authorId: user.id,
      status: "DRAFT",
    },
    include: { author: { select: { name: true, employeeId: true } } },
  });

  await db.contractLog.create({
    data: {
      contractName: "Governance.sol",
      eventType: "ProposalCreated",
      details: `Proposal P-${proposal.number} created · "${proposal.title}"`,
      txHash: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
    },
  });

  return NextResponse.json(proposal, { status: 201 });
}

// PATCH /api/proposals — Update status (Council only)
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  const user = await getSession();
  if (!user?.id || user.role !== "COUNCIL") {
    return NextResponse.json({ error: "Council access required" }, { status: 403 });
  }

  const { id, status } = await req.json();
  const validStatuses = ["PENDING", "APPROVED", "REJECTED"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status transition" }, { status: 400 });
  }

  const proposal = await db.proposal.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json(proposal);
}

