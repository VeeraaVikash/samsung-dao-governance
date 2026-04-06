import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createEventSchema = z.object({
  type: z.enum(["LOTTERY", "GIVEAWAY"]),
  title: z.string().min(3).max(200),
  description: z.string().max(2000).default(""),
  prize: z.string().min(1).max(200),
  drawDate: z.string().optional(),
  closesAt: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user?.id || user.role !== "COUNCIL") {
    return NextResponse.json({ error: "Council access required" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createEventSchema.safeParse(body);
  if (!parsed.success) {
    const errs = parsed.error.flatten();
    const msgs: string[] = [];
    Object.entries(errs.fieldErrors).forEach(([k, v]) => {
      if (v) msgs.push(`${k}: ${v.join(", ")}`);
    });
    return NextResponse.json({ error: msgs.join(" · ") || "Validation failed" }, { status: 400 });
  }

  const d = parsed.data;

  const event = await db.governanceEvent.create({
    data: {
      type: d.type,
      title: d.title,
      description: d.description,
      prize: d.prize,
      status: "ACTIVE",
      drawDate: d.drawDate ? new Date(d.drawDate) : null,
      closesAt: d.closesAt ? new Date(d.closesAt) : null,
    },
  });

  await db.contractLog.create({
    data: {
      contractName: d.type === "LOTTERY" ? "LotteryEngine.sol" : "GiveawayEngine.sol",
      eventType: "EventCreated",
      details: `${d.type} created: "${d.title}" — Prize: ${d.prize}`,
      txHash: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
    },
  });

  return NextResponse.json(event, { status: 201 });
}
