"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export function RevenueTrendChart({
  revenueTrend,
  registrationTrend,
}: {
  revenueTrend: { date: string; revenue: number }[];
  registrationTrend: { date: string; registrations: number }[];
}) {
  const data = revenueTrend.map((r, i) => ({
    date: r.date.slice(5),
    Revenue: r.revenue,
    Registrations: registrationTrend[i]?.registrations ?? 0,
  }));

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:bg-neutral-900">
      <h3 className="mb-3 font-semibold">Revenue & New Patients (30 days)</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" fontSize={11} interval={2} />
          <YAxis yAxisId="left" fontSize={11} />
          <YAxis yAxisId="right" orientation="right" fontSize={11} />
          <Tooltip />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="Revenue" stroke="#0F9D58" strokeWidth={2} dot={false} />
          <Line yAxisId="right" type="monotone" dataKey="Registrations" stroke="#7C3AED" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
