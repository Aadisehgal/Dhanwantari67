"use client";

import { useState } from "react";
import { runRecallCampaign } from "@/actions/chronic-registry";

export function RecallCampaignForm({ conditions }: { conditions: { condition: string; count: number }[] }) {
  const [condition, setCondition] = useState(conditions[0]?.condition ?? "");
  const [message, setMessage] = useState("It's time for your routine follow-up check-up. Please book an appointment at your earliest convenience.");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ sent: number; totalTagged: number } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!condition) return;
    setSubmitting(true);
    const res = await runRecallCampaign(condition, message);
    setSubmitting(false);
    if (res.ok) setResult({ sent: res.sent, totalTagged: res.totalTagged });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-neutral-200 bg-white p-5 dark:bg-neutral-900">
      <h3 className="font-semibold">Recall Campaign</h3>
      <select className="input" value={condition} onChange={(e) => setCondition(e.target.value)}>
        {conditions.map((c) => <option key={c.condition} value={c.condition}>{c.condition} ({c.count} patients)</option>)}
      </select>
      <textarea className="input" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
      <button type="submit" disabled={submitting || !condition} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60">
        {submitting ? "Sending..." : "Send Recall Reminders"}
      </button>
      {result && (
        <p className="text-sm text-brand-600">
          Sent to {result.sent} of {result.totalTagged} tagged patients (email + in-app).
        </p>
      )}
    </form>
  );
}
