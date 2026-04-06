import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const currentUser = await getSession();
  if (!currentUser?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const mode = url.searchParams.get("mode");

  // Admin: full registry
  if (mode === "registry" && currentUser.role === "ADMIN") {
    const users = await db.user.findMany({
      select: {
        id: true, employeeId: true, name: true, email: true, department: true,
        role: true, memberType: true, kycVerified: true, walletBound: true,
        hederaAccountId: true, reputationScore: true, active: true, createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const stats = {
      total: users.length,
      proposers: users.filter((u) => u.memberType === "PROPOSER" && u.role === "MEMBER").length,
      delegates: users.filter((u) => u.memberType === "DELEGATE").length,
      inactive: users.filter((u) => !u.active).length,
      kycVerified: users.filter((u) => u.kycVerified).length,
      walletsBound: users.filter((u) => u.walletBound).length,
    };

    return NextResponse.json({ users, stats });
  }

  // Current user profile
  const profile = await db.user.findUnique({
    where: { id: currentUser.id },
    select: {
      id: true, employeeId: true, name: true, email: true, department: true,
      role: true, memberType: true, kycVerified: true, walletBound: true,
      walletProvider: true, hederaAccountId: true, reputationScore: true,
      spuBalance: true, createdAt: true,
      _count: { select: { proposals: true, votes: true } },
    },
  });

  return NextResponse.json(profile);
}
