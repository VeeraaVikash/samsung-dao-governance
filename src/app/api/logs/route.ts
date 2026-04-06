import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/logs — Get contract event logs (Admin only)
export async function GET() {
  const user = await getSession();
  if (!user?.id || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const logs = await db.contractLog.findMany({
    orderBy: { timestamp: "desc" },
    take: 50,
  });

  return NextResponse.json(logs);
}
