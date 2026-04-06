import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { bindWallet } from "@/lib/hedera";
import { z } from "zod";

const bindSchema = z.object({
  accountId: z.string().regex(/^\d+\.\d+\.\d+$/, "Invalid Hedera account ID format"),
  provider: z.enum(["hashpack", "walletconnect", "blade"]),
});

// POST /api/wallet — Bind Hedera wallet to current user
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const currentUser = await getSession();
  if (!currentUser?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = bindSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { accountId, provider } = parsed.data;

    const existing = await db.user.findFirst({
      where: { hederaAccountId: accountId, id: { not: currentUser.id } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "This Hedera account is already bound to another Samsung employee" },
        { status: 409 }
      );
    }

    const result = await bindWallet(accountId, provider);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const updatedUser = await db.user.update({
      where: { id: currentUser.id },
      data: {
        hederaAccountId: result.accountId,
        walletBound: true,
        walletProvider: provider,
        walletBoundAt: new Date(),
      },
      select: {
        id: true, employeeId: true, name: true, role: true, memberType: true,
        hederaAccountId: true, walletBound: true, walletProvider: true, spuBalance: true,
      },
    });

    await db.contractLog.create({
      data: {
        contractName: "WalletRegistry.sol",
        eventType: "WalletBound",
        details: `Wallet bound · ${accountId} → ${currentUser.employeeId}`,
        txHash: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser, balance: result.balance });
  } catch (error) {
    console.error("[wallet/bind]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/wallet — Get current user's wallet status
export const dynamic = "force-dynamic";

export async function GET() {
  const currentUser = await getSession();
  if (!currentUser?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const walletInfo = await db.user.findUnique({
    where: { id: currentUser.id },
    select: {
      hederaAccountId: true, walletBound: true, walletProvider: true,
      walletBoundAt: true, spuBalance: true,
    },
  });

  return NextResponse.json(walletInfo);
}

