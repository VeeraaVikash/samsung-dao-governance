"use client";

interface SaveBarProps {
  message: string;
  saved: boolean;
  successMessage?: string;
  onSave: () => void;
  onDiscard: () => void;
}

export function SaveBar({ message, saved, successMessage, onSave, onDiscard }: SaveBarProps) {
  return (
    <div className="sticky bottom-0 bg-white border-t border-gray-200 px-5 py-3 flex justify-between items-center">
      <span className="text-xs text-gray-400">
        {successMessage ? <span className="text-success font-medium">{successMessage}</span> : message}
      </span>
      <div className="flex gap-2">
        <button onClick={onDiscard} className="btn-secondary text-sm" disabled={saved}>Discard</button>
        <button onClick={onSave} className="btn-primary text-sm" disabled={saved}>Save &amp; publish</button>
      </div>
    </div>
  );
}
