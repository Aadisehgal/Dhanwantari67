"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface VitalRow {
  recordedAt: string;
  pulse: number | null;
  spo2: number | null;
  weightKg: number | null;
  bmi: number | null;
}

export function VitalsTrendChart({ vitals }: { vitals: VitalRow[] }) {
  const data = vitals.map((v) => ({
    date: new Date(v.recordedAt).toLocaleDateString(),
    Pulse: v.pulse ?? undefined,
    SpO2: v.spo2 ?? undefined,
    Weight: v.weightKg ?? undefined,
    BMI: v.bmi ?? undefined,
  }));

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:bg-neutral-900">
      <h2 className="mb-3 font-semibold">Vitals Trend</h2>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" fontSize={12} />
          <YAxis fontSize={12} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="Pulse" stroke="#0F9D58" strokeWidth={2} connectNulls />
          <Line type="monotone" dataKey="SpO2" stroke="#7C3AED" strokeWidth={2} connectNulls />
          <Line type="monotone" dataKey="Weight" stroke="#F59E0B" strokeWidth={2} connectNulls />
          <Line type="monotone" dataKey="BMI" stroke="#DC2626" strokeWidth={2} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
