"use client";

interface ToggleRowProps {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

export function ToggleRow({ label, desc, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-200">
      <div>
        <div className="text-[13px] font-medium text-gray-700">{label}</div>
        <div className="text-[11px] text-gray-400">{desc}</div>
      </div>
      <label className="flex items-center cursor-pointer">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
          className="w-4 h-4 accent-samsung-primary rounded" />
      </label>
    </div>
  );
}
