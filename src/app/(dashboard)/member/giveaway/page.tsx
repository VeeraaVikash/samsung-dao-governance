"use client";

import { useAuth } from "@/hooks/useAuth";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

interface GovEvent {
  id: string; type: string; title: string; description: string;
  status: string; prize: string; drawDate: string | null; closesAt: string | null;
  userEntered: boolean; _count: { entries: number };
}

export default function GiveawayPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<GovEvent[]>([]);

  useEffect(() => { if (!loading && !user) router.push("/auth/login"); }, [loading, user, router]);
  useEffect(() => { loadEvents(); }, []);

  function loadEvents() {
    fetch("/api/events").then(r => r.json()).then((d: GovEvent[]) => setEvents(d.filter(e => e.type === "GIVEAWAY"))).catch(() => {});
  }

  async function enterGiveaway(eventId: string) {
    const res = await fetch("/api/events", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId }),
    });
    if (res.ok) loadEvents();
    else { const d = await res.json(); alert(d.error); }
  }

  if (loading || !user) return null;

  return (
    <DashboardLayout role="MEMBER">
      <h2 className="text-xl heading mb-1">Giveaway</h2>
      <p className="text-xs text-gray-400 mb-5">Register for active giveaways</p>

      {events.length === 0 ? (
        <div className="card text-center py-12"><p className="text-sm text-gray-400">No active giveaways.</p></div>
      ) : events.map(ev => (
        <div key={ev.id} className="card p-5 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="eyebrow">GIVEAWAY</span>
              <h3 className="text-base heading mt-1">{ev.title}</h3>
              <p className="text-xs text-gray-500 mt-1">{ev.description}</p>
              <div className="flex gap-4 mt-3">
                <div className="text-xs text-gray-400">Prize: <span className="font-mono font-medium text-gray-700">{ev.prize}</span></div>
                {ev.closesAt && <div className="text-xs text-gray-400">Closes: <span className="text-gray-700">{new Date(ev.closesAt).toLocaleDateString()}</span></div>}
                <div className="text-xs text-gray-400">Registered: <span className="font-mono text-gray-700">{ev._count.entries}</span></div>
              </div>
            </div>
            <div>
              {ev.userEntered ? (
                <span className="text-xs font-semibold text-success bg-success-light px-3 py-1.5 rounded-lg">Registered</span>
              ) : ev.status === "ACTIVE" ? (
                <button onClick={() => enterGiveaway(ev.id)} className="btn-primary text-sm">Register</button>
              ) : (
                <span className="text-xs text-gray-400">Closed</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </DashboardLayout>
  );
}
