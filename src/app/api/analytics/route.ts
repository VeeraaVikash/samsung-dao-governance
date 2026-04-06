import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json({
    totalVotes: 412,
    activeProposals: 7,
    participationRate: 48.6,
    trendingProposals: ["P-12", "P-11"],
    voterTurnoutTrend: [42.1, 45.3, 48.6],
    avgReputationScore: 623,
  });
}
