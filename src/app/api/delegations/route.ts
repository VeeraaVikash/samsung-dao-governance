import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/delegations — List current user's delegations
export async function GET() {
  const user = await getSession();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const given = await db.delegation.findMany({
    where: { delegatorId: user.id, active: true },
    include: { delegate: { select: { id: true, name: true, employeeId: true, department: true, reputationScore: true } } },
  });

  const received = await db.delegation.findMany({
    where: { delegateId: user.id, active: true },
    include: { delegator: { select: { id: true, name: true, employeeId: true, department: true, reputationScore: true } } },
  });

  // Get available delegates (members with wallets, not self)
  const delegates = await db.user.findMany({
    where: {
      role: "MEMBER",
      memberType: "DELEGATE",
      walletBound: true,
      active: true,
      id: { not: user.id },
    },
    select: { id: true, name: true, employeeId: true, department: true, reputationScore: true },
  });

  // Get current delegation limit
  const rules = await db.governanceRule.findFirst({ where: { active: true } });

  return NextResponse.json({
    given,
    received,
    availableDelegates: delegates,
    delegationLimit: rules?.delegationLimit || 5,
  });
}

// POST /api/delegations — Create a delegation
export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { delegateId } = await req.json();

  if (delegateId === user.id) {
    return NextResponse.json({ error: "Cannot delegate to yourself" }, { status: 400 });
  }

  // Check delegate exists and is a delegate type
  const delegate = await db.user.findUnique({ where: { id: delegateId } });
  if (!delegate || !delegate.walletBound) {
    return NextResponse.json({ error: "Invalid delegate or delegate has no wallet bound" }, { status: 400 });
  }

  // Check delegation limit
  const rules = await db.governanceRule.findFirst({ where: { active: true } });
  const limit = rules?.delegationLimit || 5;
  const currentCount = await db.delegation.count({ where: { delegateId, active: true } });
  if (currentCount >= limit) {
    return NextResponse.json({ error: `Delegate has reached the maximum of ${limit} delegations` }, { status: 400 });
  }

  // Check circular delegation
  const reverse = await db.delegation.findFirst({
    where: { delegatorId: delegateId, delegateId: user.id, active: true },
  });
  if (reverse) {
    return NextResponse.json({ error: "Circular delegation not allowed" }, { status: 400 });
  }

  try {
    const delegation = await db.delegation.create({
      data: { delegatorId: user.id, delegateId },
    });

    await db.contractLog.create({
      data: {
        contractName: "DelegationReg.sol",
        eventType: "DelegationCreated",
        details: `Delegation: ${user.employeeId} → ${delegate.employeeId}`,
        txHash: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
      },
    });

    return NextResponse.json(delegation, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Delegation already exists" }, { status: 409 });
    }
    throw error;
  }
}

// DELETE /api/delegations — Revoke a delegation
export async function DELETE(req: NextRequest) {
  const user = await getSession();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { delegationId } = await req.json();

  const delegation = await db.delegation.findUnique({ where: { id: delegationId } });
  if (!delegation || delegation.delegatorId !== user.id) {
    return NextResponse.json({ error: "Delegation not found or not yours" }, { status: 404 });
  }

  await db.delegation.update({ where: { id: delegationId }, data: { active: false } });

  await db.contractLog.create({
    data: {
      contractName: "DelegationReg.sol",
      eventType: "DelegationRevoked",
      details: `Delegation revoked: ${delegationId}`,
      txHash: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
    },
  });

  return NextResponse.json({ success: true });
}
