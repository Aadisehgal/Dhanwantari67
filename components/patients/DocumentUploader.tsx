"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { uploadPatientDocument } from "@/actions/patients";

export function DocumentUploader({ patientId }: { patientId: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState("Lab Report");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.set("patientId", patientId);
    formData.set("category", category);
    formData.set("file", file);

    const result = await uploadPatientDocument(formData);

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (!result.ok) {
      setError(result.error ?? "Upload failed");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-dashed border-neutral-300 p-3 dark:border-neutral-700">
      <div className="flex items-center gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="input py-1 text-sm"
        >
          <option>Lab Report</option>
          <option>Scan</option>
          <option>Prescription</option>
          <option>Other</option>
        </select>
        <label className="cursor-pointer rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600">
          {uploading ? "Uploading..." : "Upload Photo"}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            capture="environment"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>
      {error && <p className="text-xs text-status-alert">{error}</p>}
      <p className="text-xs text-neutral-400">Take a photo of a report or scan, or choose one from your gallery.</p>
    </div>
  );
}
