import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { employeeId, password } = await req.json();

  if (!employeeId || !password) {
    return NextResponse.json({ error: "Employee ID and password are required" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { employeeId } });
  if (!user || !user.active) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await createSession(user.id);

  const response = NextResponse.json({
    success: true,
    user: {
      id: user.id,
      employeeId: user.employeeId,
      name: user.name,
      email: user.email,
      department: user.department,
      role: user.role,
      memberType: user.memberType,
      kycVerified: user.kycVerified,
      walletBound: user.walletBound,
      hederaAccountId: user.hederaAccountId,
      reputationScore: user.reputationScore,
      spuBalance: user.spuBalance,
    },
  });

  response.cookies.set("session_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });

  return response;
}

