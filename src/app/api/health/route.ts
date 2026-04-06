import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getNetworkStatus } from "@/lib/hedera";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Check DB
    await db.$queryRaw`SELECT 1`;

    // Check Hedera
    const hedera = await getNetworkStatus();

    return NextResponse.json({
      status: "healthy",
      database: "connected",
      hedera,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { status: "unhealthy", error: String(error) },
      { status: 503 }
    );
  }
}

