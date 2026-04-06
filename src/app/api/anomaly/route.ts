import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json({
    alerts: [
      { id: "a1", severity: "warning", message: "Unusual voting pattern on P-12", detectedAt: new Date().toISOString() },
      { id: "a2", severity: "info", message: "Delegation chain depth at limit for 0.0.3921", detectedAt: new Date().toISOString() },
    ],
  });
}
