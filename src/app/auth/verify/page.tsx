"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { StatusBar } from "@/components/layout/StatusBar";
import { StepPills } from "@/components/ui/StepPills";
import { CheckCircle } from "lucide-react";

export default function VerifyPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => { if (!loading && !user) router.push("/auth/login"); }, [loading, user, router]);

  if (loading || !user) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><span className="text-gray-400 text-sm">Verifying identity…</span></div>;

  const dashboardPath = user.role === "ADMIN" ? "/admin/dashboard" : user.role === "COUNCIL" ? "/council/dashboard" : "/member/dashboard";
  const nextStep = user.walletBound ? dashboardPath : "/auth/wallet";
  const nextLabel = user.walletBound ? "Go to dashboard" : "Continue to wallet setup";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar /><StatusBar />
      <div className="max-w-[420px] mx-auto mt-12 px-4">
        <div className="card p-7 rounded-[14px]">
          <StepPills current={1} done={[1]} />
          <div className="text-center mb-5">
            <span className="eyebrow text-samsung-primary block mb-2">Step 1 of 2 — Verified</span>
            <h2 className="text-[22px] heading mb-1.5">Identity confirmed</h2>
            <p className="text-[13px] text-gray-500 leading-relaxed">Your Samsung employee credentials were verified successfully.</p>
          </div>
          <div className="bg-success-light rounded-xl px-4 py-3.5 flex items-start gap-2.5 mb-4">
            <CheckCircle className="w-[18px] h-[18px] text-success shrink-0 mt-0.5" />
            <div><div className="text-sm font-semibold text-gray-900">{user.name} · {user.employeeId}</div>
              <div className="text-xs text-gray-500 mt-0.5">Samsung Electronics · {user.department} · Verified member</div></div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200 flex flex-col gap-2.5 mb-4">
            <div className="flex justify-between items-center"><span className="text-xs text-gray-400">KYC status</span>
              <span className="flex items-center gap-1.5 text-xs"><span className="w-1.5 h-1.5 rounded-full bg-success inline-block"/><span className="text-gray-700">Verified</span></span></div>
            <div className="flex justify-between items-center"><span className="text-xs text-gray-400">Role assigned</span>
              <span className="font-mono text-[10px] font-semibold text-samsung-primary bg-samsung-light px-2 py-0.5 rounded capitalize">{user.role.toLowerCase()}{user.role === "MEMBER" ? ` (${user.memberType.toLowerCase()})` : ""}</span></div>
            <div className="flex justify-between items-center"><span className="text-xs text-gray-400">Hedera wallet</span>
              <span className="flex items-center gap-1.5 text-xs"><span className={`w-1.5 h-1.5 rounded-full ${user.walletBound ? "bg-success" : "bg-warning"} inline-block`}/>
                <span className="text-gray-700">{user.walletBound ? user.hederaAccountId : "Not yet connected"}</span></span></div>
          </div>
          {!user.walletBound && <div className="bg-samsung-light rounded-xl px-3.5 py-3 text-[13px] text-samsung-dark mb-5 leading-relaxed">Next: connect your Hedera testnet wallet. One-time setup.</div>}
          <button onClick={() => router.push(nextStep)} className="btn-primary w-full">{nextLabel}</button>
        </div>
      </div>
    </div>
  );
}
