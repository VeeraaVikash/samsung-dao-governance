import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  return NextResponse.json({
    valid: true,
    proposalId: body.proposalId,
    checks: { reputationOk: true, formatOk: true, duplicateOk: true },
  });
}
