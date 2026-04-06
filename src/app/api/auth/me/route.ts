import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json({
    id: user.id,
    employeeId: user.employeeId,
    name: user.name,
    email: user.email,
    department: user.department,
    role: user.role,
    memberType: user.memberType,
    kycVerified: user.kycVerified,
    walletBound: user.walletBound,
    walletProvider: user.walletProvider,
    hederaAccountId: user.hederaAccountId,
    reputationScore: user.reputationScore,
    spuBalance: user.spuBalance,
  });
}

