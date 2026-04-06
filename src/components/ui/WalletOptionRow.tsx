"use client";

import { ChevronRight } from "lucide-react";

interface WalletOptionRowProps {
  name: string;
  desc: string;
  recommended?: boolean;
  onClick: () => void;
}

export function WalletOptionRow({ name, desc, recommended, onClick }: WalletOptionRowProps) {
  return (
    <button onClick={onClick}
      className="flex items-center justify-between px-3.5 py-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-colors w-full">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-samsung-light flex items-center justify-center text-samsung-primary font-bold text-sm">{name[0]}</div>
        <div className="text-left">
          <div className="text-[13px] font-medium text-gray-700">{name}</div>
          <div className="text-[11px] text-gray-400 flex items-center gap-1">{desc}
            {recommended && <span className="font-mono text-[9px] font-semibold text-samsung-primary bg-samsung-light px-1.5 rounded uppercase">Recommended</span>}
          </div>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-400" />
    </button>
  );
}
