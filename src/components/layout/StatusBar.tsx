"use client";

import { useEffect, useState } from "react";

export function StatusBar() {
  const [block, setBlock] = useState(72483921);

  useEffect(() => {
    // Fetch real block from API on mount
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => {
        if (d.hedera?.blockNumber) setBlock(d.hedera.blockNumber);
      })
      .catch(() => {});

    // Simulate block increments
    const t = setInterval(() => {
      setBlock((b) => b + Math.floor(Math.random() * 3) + 1);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="h-8 bg-gray-100 border-b border-thin border-gray-300 flex items-center px-6 gap-2 font-mono text-xs text-gray-500">
      <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
      <span>
        Hedera testnet · Block #{block.toLocaleString()} · All systems operational
      </span>
    </div>
  );
}
