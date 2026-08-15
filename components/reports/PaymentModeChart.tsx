"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["#0F9D58", "#7C3AED", "#F59E0B", "#DC2626", "#3B82F6", "#EC4899"];

export function PaymentModeChart({ data }: { data: { mode: string; amount: number }[] }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:bg-neutral-900">
      <h3 className="mb-3 font-semibold">Payment Mode Breakdown</h3>
      {data.length === 0 ? (
        <p className="text-sm text-neutral-400">No payments recorded yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={data} dataKey="amount" nameKey="mode" cx="50%" cy="50%" outerRadius={90} label={(entry) => entry.mode}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
