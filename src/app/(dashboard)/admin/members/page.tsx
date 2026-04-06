"use client";

import { useAuth } from "@/hooks/useAuth";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface User {
  id: string; employeeId: string; name: string; email: string; department: string;
  role: string; memberType: string; kycVerified: boolean; walletBound: boolean;
  hederaAccountId: string | null; reputationScore: number; active: boolean; createdAt: string;
}

export default function MembersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
    if (!loading && user && user.role !== "ADMIN") router.push("/");
  }, [loading, user, router]);

  useEffect(() => {
    fetch("/api/users?mode=registry").then(r => r.json()).then(d => setUsers(d.users || [])).catch(() => {});
  }, []);

  if (loading || !user) return null;

  return (
    <DashboardLayout role="ADMIN">
      <h2 className="text-xl heading mb-1">Member Registry</h2>
      <p className="text-xs text-gray-400 mb-5">{users.length} registered members</p>

      <div className="card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-thin border-gray-200 bg-gray-50">
              <th className="eyebrow px-4 py-2.5">Employee ID</th>
              <th className="eyebrow px-4 py-2.5">Name</th>
              <th className="eyebrow px-4 py-2.5">Department</th>
              <th className="eyebrow px-4 py-2.5">Role</th>
              <th className="eyebrow px-4 py-2.5">KYC</th>
              <th className="eyebrow px-4 py-2.5">Wallet</th>
              <th className="eyebrow px-4 py-2.5 text-right">Reputation</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-thin border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-2.5 font-mono text-xs text-gray-700">{u.employeeId}</td>
                <td className="px-4 py-2.5 text-[13px] text-gray-700 font-medium">{u.name}</td>
                <td className="px-4 py-2.5 text-xs text-gray-500">{u.department}</td>
                <td className="px-4 py-2.5"><StatusBadge status={u.role === "ADMIN" ? "danger" : u.role === "COUNCIL" ? "executing" : "active"} label={u.role.toLowerCase()} /></td>
                <td className="px-4 py-2.5">
                  <span className={`w-2 h-2 rounded-full inline-block ${u.kycVerified ? "bg-success" : "bg-warning"}`} />
                </td>
                <td className="px-4 py-2.5 font-mono text-[11px] text-gray-400">
                  {u.hederaAccountId || "—"}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-gray-700 text-right">{u.reputationScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
