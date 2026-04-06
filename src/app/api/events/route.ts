import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/events — List events
export async function GET() {
  const user = await getSession();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const events = await db.governanceEvent.findMany({
    include: {
      _count: { select: { entries: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Check if current user has entered each event
  const userEntries = await db.eventEntry.findMany({
    where: { userId: user.id },
    select: { eventId: true },
  });
  const enteredIds = new Set(userEntries.map((e) => e.eventId));

  const enriched = events.map((ev) => ({
    ...ev,
    userEntered: enteredIds.has(ev.id),
  }));

  return NextResponse.json(enriched);
}

// POST /api/events — Enter an event (lottery/giveaway)
export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId } = await req.json();

  const event = await db.governanceEvent.findUnique({ where: { id: eventId } });
  if (!event || event.status === "CLOSED") {
    return NextResponse.json({ error: "Event is not active" }, { status: 400 });
  }

  try {
    const entry = await db.eventEntry.create({
      data: { eventId, userId: user.id },
    });

    await db.contractLog.create({
      data: {
        contractName: event.type === "LOTTERY" ? "LotteryEngine.sol" : "GiveawayEngine.sol",
        eventType: "EntryRegistered",
        details: `${event.type} entry · ${user.employeeId} → ${event.title}`,
        txHash: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
      },
    });

    return NextResponse.json({ success: true, entryId: entry.id });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "You have already entered this event" }, { status: 409 });
    }
    throw error;
  }
}
