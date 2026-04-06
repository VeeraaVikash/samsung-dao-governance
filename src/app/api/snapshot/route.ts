import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    blockHeight: 72483921,
    eligibleMembers: 847,
    snapshotAt: new Date().toISOString(),
    network: "testnet",
  });
}
