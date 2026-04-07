"use client";

import { useAuth } from "@/hooks/useAuth";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AlertTriangle, CheckCircle, Clock, X } from "lucide-react";

interface Alert {
  id: string; severity: "critical" | "warning" | "info"; title: string;
  detail: string; source: string; timestamp: string; resolved: boolean;
  investigation: string; affectedEntities: string[]; recommendedAction: string;
}

const mockAlerts: Alert[] = [
  { id: "a1", severity: "critical", title: "Unusual voting pattern detected",
    detail: "Proposal P-12 received 47 votes from accounts created in the last 24h. Possible Sybil attack vector.",
    source: "AI Anomaly Detection", timestamp: "2025-04-04T12:23:00", resolved: false,
    investigation: "The anomaly detection engine flagged a cluster of 47 votes on Proposal P-12 originating from accounts created within a 24-hour window. All accounts passed KYC but share similar registration patterns. IP analysis shows 38 of 47 originate from the same /24 subnet. Vote timestamps are within a 12-minute window, suggesting coordinated activity.",
    affectedEntities: ["Proposal P-12", "47 member accounts", "VotingEngine.sol"],
    recommendedAction: "Freeze votes on P-12 pending manual review. Flag the 47 accounts for enhanced KYC re-verification. Consider extending the voting window by 48h." },
  { id: "a2", severity: "warning", title: "Delegation chain depth exceeded",
    detail: "Member 0.0.3921 has a delegation chain of 4 hops — governance limit is 3.",
    source: "DelegationReg.sol", timestamp: "2025-04-04T10:15:00", resolved: false,
    investigation: "A circular delegation pattern was detected: Member A → B → C → D → A. The DelegationReg contract should have blocked this at hop 3, but a race condition in block 72,481,190 allowed the 4th hop to be registered before validation completed.",
    affectedEntities: ["0.0.3921", "0.0.4102", "0.0.3856", "0.0.4501"],
    recommendedAction: "Revoke the 4th delegation manually. Patch DelegationReg.sol to add mutex locking on chain depth validation." },
  { id: "a3", severity: "warning", title: "Quorum at risk for Proposal P-10",
    detail: "Only 38% participation with 12h remaining. Quorum threshold is 51%.",
    source: "Governance Analytics", timestamp: "2025-04-03T18:30:00", resolved: false,
    investigation: "Current participation rate is 38.2% (324 of 847 eligible members). Historical data shows an average of 8% voter surge in the final 6 hours. At current trajectory, estimated final participation is 46.2% — below the 51% quorum threshold.",
    affectedEntities: ["Proposal P-10", "523 non-voting members"],
    recommendedAction: "Send reminder notifications to eligible voters. Consider whether the council should extend the voting window by 24h." },
  { id: "a4", severity: "info", title: "Reputation decay cycle completed",
    detail: "Monthly decay applied to 23 inactive members (-5 pts each).",
    source: "ReputationOracle", timestamp: "2025-04-03T09:00:00", resolved: true,
    investigation: "Routine monthly decay cycle executed successfully. 23 members had zero governance activity in the past 30 days and received a -5 point decay penalty. No member fell below the 0-point floor. Average post-decay score for affected members: 72 pts.",
    affectedEntities: ["23 inactive members", "ReputationOracle contract"],
    recommendedAction: "No action required. Routine operation completed as expected." },
  { id: "a5", severity: "info", title: "Snapshot taken for Election Q2",
    detail: "Voter eligibility snapshot at block #72,481,200. 847 members eligible.",
    source: "Snapshot Service", timestamp: "2025-04-01T09:00:00", resolved: true,
    investigation: "Eligibility snapshot for Council Election Q2 2025 was taken at block height 72,481,200. 847 of 1,247 total members met all criteria: active status, KYC verified, reputation ≥ 100 pts, and wallet bound.",
    affectedEntities: ["847 eligible members", "400 ineligible members"],
    recommendedAction: "No action required. Snapshot is immutable and stored on-chain." },
];

export default function AlertsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [alerts, setAlerts] = useState(mockAlerts);
  const [filter, setFilter] = useState<"all" | "active" | "resolved">("all");
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
    if (!loading && user && user.role !== "ADMIN") router.push("/");
  }, [loading, user, router]);

  if (loading || !user) return null;

  const filtered = filter === "all" ? alerts : filter === "active" ? alerts.filter(a => !a.resolved) : alerts.filter(a => a.resolved);

  const severityStyle = {
    critical: { bg: "bg-danger-light", border: "border-danger/30", icon: "text-danger", badge: "bg-danger text-white" },
    warning: { bg: "bg-warning-light", border: "border-warning/30", icon: "text-warning", badge: "bg-warning text-white" },
    info: { bg: "bg-samsung-light", border: "border-samsung-primary/20", icon: "text-samsung-primary", badge: "bg-samsung-primary/10 text-samsung-primary" },
  };

  function resolve(id: string) { setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a)); }

  return (
    <DashboardLayout role="ADMIN">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-xl heading">Anomaly Alerts</h2>
          <p className="text-xs text-gray-400">{alerts.filter(a => !a.resolved).length} active alerts</p>
        </div>
        <div className="flex flex-wrap gap-1 bg-gray-100 rounded-lg p-0.5">
          {(["all", "active", "resolved"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${filter === f ? "bg-white text-gray-700 shadow-sm" : "text-gray-400"}`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {filtered.map(alert => {
          const s = severityStyle[alert.severity];
          return (
            <div key={alert.id} className={`card ${s.bg} ${s.border} border-thin p-4`}>
              <div className="flex items-start gap-3">
                <AlertTriangle className={`w-5 h-5 ${s.icon} shrink-0 mt-0.5`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900">{alert.title}</span>
                    <span className={`font-mono text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${s.badge}`}>{alert.severity}</span>
                    {alert.resolved && <span className="flex items-center gap-1 text-[10px] text-success font-medium"><CheckCircle className="w-3 h-3" /> Resolved</span>}
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed mb-2">{alert.detail}</p>
                  <div className="flex items-center gap-4 text-[11px] text-gray-400">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(alert.timestamp).toLocaleString()}</span>
                    <span>Source: <span className="font-mono text-gray-500">{alert.source}</span></span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  <button onClick={() => setSelectedAlert(alert)} className="btn-secondary text-xs px-3 py-1">View details</button>
                  {!alert.resolved && <button onClick={() => resolve(alert.id)} className="text-xs px-3 py-1 rounded-lg bg-success-light text-success font-medium">Resolve</button>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedAlert(null)}>
          <div className="bg-white rounded-2xl max-w-[600px] w-full max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-mono text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${severityStyle[selectedAlert.severity].badge}`}>{selectedAlert.severity}</span>
                  {selectedAlert.resolved && <span className="text-[10px] text-success font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" />Resolved</span>}
                </div>
                <h3 className="text-lg heading">{selectedAlert.title}</h3>
                <p className="text-xs text-gray-400 mt-1">{new Date(selectedAlert.timestamp).toLocaleString()} · {selectedAlert.source}</p>
              </div>
              <button onClick={() => setSelectedAlert(null)} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-4 h-4 text-gray-400" /></button>
            </div>

            <div className="mb-4">
              <h4 className="eyebrow mb-2">INVESTIGATION</h4>
              <p className="text-[13px] text-gray-700 leading-relaxed">{selectedAlert.investigation}</p>
            </div>

            <div className="mb-4">
              <h4 className="eyebrow mb-2">AFFECTED ENTITIES</h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedAlert.affectedEntities.map((e, i) => (
                  <span key={i} className="font-mono text-[11px] bg-gray-100 text-gray-600 px-2 py-1 rounded">{e}</span>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <h4 className="eyebrow mb-2">RECOMMENDED ACTION</h4>
              <p className="text-[13px] text-gray-700 leading-relaxed">{selectedAlert.recommendedAction}</p>
            </div>

            <div className="flex gap-2 pt-2 border-t border-thin border-gray-200">
              {!selectedAlert.resolved && (
                <button onClick={() => { resolve(selectedAlert.id); setSelectedAlert({ ...selectedAlert, resolved: true }); }}
                  className="btn-primary text-sm">Mark as resolved</button>
              )}
              <button onClick={() => setSelectedAlert(null)} className="btn-secondary text-sm">Close</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
