"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { StatusBar } from "@/components/layout/StatusBar";
import { StepPills } from "@/components/ui/StepPills";
import { ChevronRight } from "lucide-react";

type WalletProvider = "hashpack" | "walletconnect" | "blade";
const wallets: { id: WalletProvider; name: string; desc: string; recommended?: boolean }[] = [
  { id: "hashpack", name: "HashPack wallet", desc: "Recommended for Hedera", recommended: true },
  { id: "walletconnect", name: "WalletConnect", desc: "Scan QR with mobile wallet" },
  { id: "blade", name: "Blade wallet", desc: "Hedera native wallet" },
];

export default function WalletPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedProvider, setSelectedProvider] = useState<WalletProvider | null>(null);
  const [accountId, setAccountId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleBind() {
    if (!accountId.trim()) { setError("Please enter your Hedera Account ID."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/wallet", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: accountId.trim(), provider: selectedProvider }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to bind wallet"); setLoading(false); return; }
      router.push(`/auth/success?accountId=${data.user.hederaAccountId}&provider=${selectedProvider}`);
    } catch { setError("Network error."); setLoading(false); }
  }

  const dashboardPath = user?.role === "ADMIN" ? "/admin/dashboard" : user?.role === "COUNCIL" ? "/council/dashboard" : "/member/dashboard";

  return (
    <div className="min-h-screen bg-gray-50"><Navbar /><StatusBar />
      <div className="max-w-[420px] mx-auto mt-12 px-4">
        <div className="card p-7 rounded-[14px]">
          <StepPills current={2} done={[1]} />
          <div className="text-center mb-5">
            <div className="flex justify-center items-center gap-2 mb-2">
              <span className="eyebrow text-samsung-primary">Step 2 of 2</span>
              <span className="font-mono text-[10px] font-semibold text-success bg-success-light px-2 py-0.5 rounded uppercase tracking-wide">Once only</span>
            </div>
            <h2 className="text-[22px] heading mb-1.5">Connect Hedera wallet</h2>
            <p className="text-[13px] text-gray-500 leading-relaxed">Connect your Hedera testnet wallet. You only need to do this once.</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200 font-mono text-xs mb-4">
            <div className="flex justify-between mb-1.5"><span className="text-gray-400">Network:</span><span className="text-gray-700 font-medium">Hedera Testnet</span></div>
            <div className="flex justify-between mb-1.5"><span className="text-gray-400">Chain ID:</span><span className="text-gray-700">0x128 · 296</span></div>
            <div className="flex justify-between items-center"><span className="text-gray-400">Account ID:</span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-warning inline-block"/><span className="text-gray-500">Pending</span></span></div>
          </div>
          {!selectedProvider ? (
            <div className="flex flex-col gap-2 mb-4">
              {wallets.map(w => (
                <button key={w.id} onClick={() => setSelectedProvider(w.id)}
                  className="flex items-center justify-between px-3.5 py-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-colors w-full">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-samsung-light flex items-center justify-center text-samsung-primary font-bold text-sm">{w.name[0]}</div>
                    <div className="text-left"><div className="text-[13px] font-medium text-gray-700">{w.name}</div>
                      <div className="text-[11px] text-gray-400 flex items-center gap-1">{w.desc}
                        {w.recommended && <span className="font-mono text-[9px] font-semibold text-samsung-primary bg-samsung-light px-1.5 rounded uppercase">Recommended</span>}</div></div>
                  </div><ChevronRight className="w-4 h-4 text-gray-400" />
                </button>))}
            </div>
          ) : (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-samsung-light flex items-center justify-center text-samsung-primary font-bold text-xs">{wallets.find(w => w.id === selectedProvider)?.name[0]}</div>
                <div><div className="text-[13px] font-medium text-gray-700">{wallets.find(w => w.id === selectedProvider)?.name}</div>
                  <button onClick={() => { setSelectedProvider(null); setError(""); }} className="text-[11px] text-samsung-primary hover:underline">Change wallet</button></div>
              </div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Hedera Account ID</label>
              <input type="text" placeholder="e.g. 0.0.4827341" value={accountId} onChange={e => setAccountId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-[13px] font-mono text-gray-700 outline-none focus:border-samsung-primary mb-2" />
              <p className="text-[11px] text-gray-400 mb-3">Create one free at <a href="https://portal.hedera.com/" target="_blank" rel="noopener noreferrer" className="text-samsung-primary hover:underline">portal.hedera.com</a></p>
              {error && <div className="bg-danger-light text-danger text-xs rounded-lg px-3 py-2 mb-3">{error}</div>}
              <button onClick={handleBind} disabled={loading} className="btn-primary w-full">{loading ? "Verifying on testnet…" : "Verify & bind wallet"}</button>
            </div>
          )}
          <button onClick={() => router.push(dashboardPath)} className="btn-secondary w-full">Skip for now — set up later</button>
          <p className="text-[11px] text-gray-400 text-center mt-4">No funds required on testnet</p>
        </div>
      </div>
    </div>
  );
}
