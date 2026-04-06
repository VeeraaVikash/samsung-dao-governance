import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/multisig — Get pending multisig actions
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSession();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const actions = await db.multisigAction.findMany({
    where: { status: "PENDING" },
    include: {
      signatures: {
        include: {
          user: { select: { id: true, name: true, employeeId: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get all council members for signer list
  const councilMembers = await db.user.findMany({
    where: { role: "COUNCIL" },
    select: { id: true, name: true, employeeId: true, hederaAccountId: true },
  });

  return NextResponse.json({ actions, councilMembers });
}

// POST /api/multisig — Sign a pending action (Council only)
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getSession();
  if (!user?.id || user.role !== "COUNCIL") {
    return NextResponse.json({ error: "Council access required" }, { status: 403 });
  }

  const { actionId } = await req.json();

  const action = await db.multisigAction.findUnique({
    where: { id: actionId },
    include: { _count: { select: { signatures: true } } },
  });

  if (!action || action.status !== "PENDING") {
    return NextResponse.json({ error: "Action not found or already executed" }, { status: 400 });
  }

  try {
    await db.multisigSignature.create({
      data: { actionId, userId: user.id },
    });

    // Check if threshold met
    const newCount = action._count.signatures + 1;
    if (newCount >= action.requiredSigs) {
      await db.multisigAction.update({
        where: { id: actionId },
        data: { status: "EXECUTED" },
      });

      await db.contractLog.create({
        data: {
          contractName: "MultisigCouncil.sol",
          eventType: "ActionExecuted",
          details: `Multisig action executed — ${action.description} (${newCount}/${action.requiredSigs} sigs)`,
          txHash: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
        },
      });
    }

    return NextResponse.json({ success: true, sigCount: newCount, threshold: action.requiredSigs });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "You have already signed this action" }, { status: 409 });
    }
    throw error;
  }
}

