"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { recordNursingNote } from "@/actions/ipd";
import { submitWithOfflineFallback } from "@/lib/offline/queue";

interface NoteRow {
  id: string;
  note: string;
  bp: string | null;
  pulse: number | null;
  temperature: number | null;
  spo2: number | null;
  recordedAt: string;
}

export function NursingNotesPanel({ admissionId, notes }: { admissionId: string; notes: NoteRow[] }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [bp, setBp] = useState("");
  const [pulse, setPulse] = useState("");
  const [temperature, setTemperature] = useState("");
  const [spo2, setSpo2] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    setSubmitting(true);

    const vitals = {
      bp: bp || undefined,
      pulse: pulse ? Number(pulse) : undefined,
      temperature: temperature ? Number(temperature) : undefined,
      spo2: spo2 ? Number(spo2) : undefined,
    };
    await submitWithOfflineFallback("recordNursingNote", { admissionId, note, vitals }, () =>
      recordNursingNote(admissionId, note, vitals)
    );

    setNote("");
    setBp("");
    setPulse("");
    setTemperature("");
    setSpo2("");
    setSubmitting(false);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:bg-neutral-900">
      <h3 className="mb-3 font-semibold">Nursing Notes</h3>

      <form onSubmit={handleSubmit} className="mb-4 space-y-2">
        <textarea className="input" rows={2} placeholder="Bedside observation..." value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="grid grid-cols-4 gap-2">
          <input className="input" placeholder="BP" value={bp} onChange={(e) => setBp(e.target.value)} />
          <input className="input" placeholder="Pulse" value={pulse} onChange={(e) => setPulse(e.target.value)} />
          <input className="input" placeholder="Temp" value={temperature} onChange={(e) => setTemperature(e.target.value)} />
          <input className="input" placeholder="SpO2" value={spo2} onChange={(e) => setSpo2(e.target.value)} />
        </div>
        <button type="submit" disabled={submitting} className="rounded-lg bg-brand-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60">
          {submitting ? "Saving..." : "Add Note"}
        </button>
      </form>

      <ul className="space-y-2 text-sm">
        {notes.map((n) => (
          <li key={n.id} className="border-t border-neutral-100 pt-2 dark:border-neutral-800">
            <p className="text-xs text-neutral-400">{new Date(n.recordedAt).toLocaleString()}</p>
            <p>{n.note}</p>
            {(n.bp || n.pulse || n.temperature || n.spo2) && (
              <p className="text-xs text-neutral-500">
                {n.bp && `BP ${n.bp} `}{n.pulse && `Pulse ${n.pulse} `}{n.temperature && `Temp ${n.temperature} `}{n.spo2 && `SpO2 ${n.spo2}`}
              </p>
            )}
          </li>
        ))}
        {notes.length === 0 && <p className="text-neutral-400">No nursing notes yet.</p>}
      </ul>
    </div>
  );
}
