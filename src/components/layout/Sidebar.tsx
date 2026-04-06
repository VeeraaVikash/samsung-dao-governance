"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarItem {
  id: string;
  label: string;
  href: string;
  badge?: string;
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

const memberSections: SidebarSection[] = [
  {
    title: "OVERVIEW",
    items: [
      { id: "dashboard", label: "Dashboard", href: "/member/dashboard" },
      { id: "profile", label: "My profile", href: "/member/profile" },
    ],
  },
  {
    title: "PARTICIPATE",
    items: [
      { id: "vote", label: "Vote", href: "/member/vote", badge: "1" },
      { id: "proposals", label: "Proposals", href: "/member/proposals", badge: "3" },
      { id: "lottery", label: "Lottery", href: "/member/lottery" },
      { id: "giveaway", label: "Giveaway", href: "/member/giveaway" },
    ],
  },
  {
    title: "MY ACTIVITY",
    items: [
      { id: "myproposals", label: "My proposals", href: "/member/proposals" },
      { id: "delegations", label: "My delegations", href: "/member/delegations" },
      { id: "history", label: "History", href: "/member/history" },
    ],
  },
];

const councilSections: SidebarSection[] = [
  {
    title: "OVERVIEW",
    items: [
      { id: "dashboard", label: "Dashboard", href: "/council/dashboard" },
      { id: "proposals", label: "Proposals", href: "/council/proposals", badge: "4" },
    ],
  },
  {
    title: "GOVERNANCE",
    items: [
      { id: "rules", label: "Rule builder", href: "/council/rules" },
      { id: "election", label: "Election setup", href: "/council/election" },
      { id: "voting", label: "Voting config", href: "/council/voting" },
    ],
  },
  {
    title: "EVENTS",
    items: [
      { id: "giveaway", label: "Giveaway setup", href: "/council/giveaway" },
      { id: "lottery", label: "Lottery config", href: "/council/lottery" },
    ],
  },
  {
    title: "SETTINGS",
    items: [
      { id: "reputation", label: "Reputation rules", href: "/council/reputation" },
      { id: "delegation", label: "Delegation limits", href: "/council/delegation" },
    ],
  },
];

const adminSections: SidebarSection[] = [
  {
    title: "OVERVIEW",
    items: [
      { id: "dashboard", label: "Dashboard", href: "/admin/dashboard" },
      { id: "members", label: "Member registry", href: "/admin/members" },
    ],
  },
  {
    title: "MONITORING",
    items: [
      { id: "pipeline", label: "Proposal pipeline", href: "/admin/proposals" },
      { id: "logs", label: "Contract logs", href: "/admin/logs" },
      { id: "alerts", label: "Anomaly alerts", href: "/admin/alerts", badge: "2" },
    ],
  },
  {
    title: "GOVERNANCE",
    items: [
      { id: "timelock", label: "Timelock status", href: "/admin/timelock" },
      { id: "multisig", label: "Multisig council", href: "/admin/multisig" },
      { id: "snapshots", label: "Snapshot history", href: "/admin/snapshots" },
    ],
  },
  {
    title: "REPORTS",
    items: [
      { id: "analytics", label: "Analytics export", href: "/admin/analytics" },
      { id: "audit", label: "Audit trail", href: "/admin/audit" },
    ],
  },
];

const sectionMap: Record<string, SidebarSection[]> = {
  ADMIN: adminSections,
  COUNCIL: councilSections,
  MEMBER: memberSections,
};

interface SidebarProps {
  role: "ADMIN" | "COUNCIL" | "MEMBER";
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const sections = sectionMap[role] || memberSections;

  return (
    <aside className="w-[200px] min-h-[calc(100vh-84px)] bg-white border-r border-thin border-gray-200 py-4 sticky top-[84px] self-start shrink-0">
      {sections.map((section) => (
        <div key={section.title} className="mb-4">
          <div className="px-4 mb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-gray-400">
            {section.title}
          </div>
          {section.items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`
                  flex justify-between items-center w-full px-4 py-[7px] text-[13px] no-underline
                  border-l-2 transition-colors
                  ${active
                    ? "bg-samsung-light text-samsung-primary font-medium border-l-samsung-primary"
                    : "text-gray-500 border-l-transparent hover:bg-gray-50 hover:text-gray-700"
                  }
                `}
              >
                {item.label}
                {item.badge && (
                  <span className="font-mono text-[10px] font-semibold bg-samsung-light text-samsung-primary px-1.5 rounded">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </aside>
  );
}
