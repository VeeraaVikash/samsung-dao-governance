interface AccountCardProps {
  accountId: string;
  name: string;
  role: string;
  spuBalance: number;
}

export function AccountCard({ accountId, name, role, spuBalance }: AccountCardProps) {
  return (
    <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200 font-mono text-xs">
      <div className="flex justify-between mb-2"><span className="text-gray-400">Account ID:</span><span className="text-gray-900 font-semibold">{accountId}</span></div>
      <div className="flex justify-between mb-2"><span className="text-gray-400">Member:</span><span className="text-gray-700">{name}</span></div>
      <div className="flex justify-between mb-2"><span className="text-gray-400">Role:</span>
        <span className="font-semibold text-samsung-primary bg-samsung-light px-2 py-0.5 rounded capitalize">{role}</span></div>
      <div className="flex justify-between"><span className="text-gray-400">SPU balance:</span><span className="text-gray-500">{spuBalance} SPU testnet</span></div>
    </div>
  );
}
