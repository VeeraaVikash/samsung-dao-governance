"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

function SamsungLogo() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <rect width="26" height="26" rx="5" fill="white" fillOpacity="0.15" />
      <rect x="4" y="4" width="7" height="7" rx="1.5" fill="white" fillOpacity="0.9" />
      <rect x="15" y="4" width="7" height="7" rx="1.5" fill="white" fillOpacity="0.6" />
      <rect x="4" y="15" width="7" height="7" rx="1.5" fill="white" fillOpacity="0.6" />
      <rect x="15" y="15" width="7" height="7" rx="1.5" fill="white" fillOpacity="0.4" />
    </svg>
  );
}

export function Navbar() {
  const { user, logout } = useAuth();

  const roleBadge = user?.role === "ADMIN" ? "Admin · Monitor"
    : user?.role === "COUNCIL" ? "Council" : "";

  return (
    <nav className="h-[52px] bg-samsung-primary flex items-center justify-between px-6">
      <Link href="/" className="flex items-center gap-2.5 no-underline">
        <SamsungLogo />
        <span className="text-white font-semibold text-[15px] tracking-tight">Samsung DAO</span>
        <span className="text-white/50 text-[13px] ml-1">Governance Portal</span>
      </Link>
      <div className="flex items-center gap-3">
        <span className="font-mono text-[11px] text-white/70 bg-white/10 px-2.5 py-0.5 rounded-md tracking-wide font-medium">
          {roleBadge ? `${roleBadge} · ` : ""}PRISM · Testnet
        </span>
        {user && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-semibold">
              {user.name?.split(" ").map((n: string) => n[0]).join("")}
            </div>
            <span className="text-white text-[13px] font-medium">{user.name}</span>
            <button onClick={async () => { await logout(); window.location.href = "/"; }}
              className="text-white/40 hover:text-white/70 text-xs ml-2 transition-colors">
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
