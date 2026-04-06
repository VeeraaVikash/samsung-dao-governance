"use client";

import { useState } from "react";

interface ElectionFormProps {
  onSubmit: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ElectionForm({ onSubmit, onCancel, loading }: ElectionFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  return (
    <div className="card p-5 border-[1.5px] border-samsung-primary">
      <h3 className="text-sm heading mb-3">New Election</h3>
      <div className="flex flex-col gap-3 mb-3">
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter title"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-[13px] text-gray-700 outline-none focus:border-samsung-primary" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Enter description" rows={3}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-[13px] text-gray-700 outline-none focus:border-samsung-primary resize-none" />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onCancel} className="btn-secondary text-sm">Cancel</button>
        <button onClick={() => onSubmit({ title, description })} disabled={loading || !title}
          className="btn-primary text-sm">{loading ? "Creating..." : "Create"}</button>
      </div>
    </div>
  );
}
