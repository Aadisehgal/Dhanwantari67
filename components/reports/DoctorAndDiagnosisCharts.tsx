"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function TopDiagnosesChart({ data }: { data: { code: string; label: string; count: number }[] }) {
  const chartData = data.map((d) => ({ name: `${d.code}`, fullLabel: d.label, count: d.count }));

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:bg-neutral-900">
      <h3 className="mb-3 font-semibold">Top Diagnoses</h3>
      {chartData.length === 0 ? (
        <p className="text-sm text-neutral-400">No diagnoses recorded yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" fontSize={11} />
            <YAxis type="category" dataKey="name" fontSize={11} width={70} />
            <Tooltip formatter={(value: any, _name: any, item: any) => [value, item.payload.fullLabel]} />
            <Bar dataKey="count" fill="#7C3AED" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export function DoctorConsultationChart({ data }: { data: { doctor: string; consultations: number }[] }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:bg-neutral-900">
      <h3 className="mb-3 font-semibold">Consultations by Doctor</h3>
      {data.length === 0 ? (
        <p className="text-sm text-neutral-400">No completed consultations yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" fontSize={11} />
            <YAxis type="category" dataKey="doctor" fontSize={11} width={100} />
            <Tooltip />
            <Bar dataKey="consultations" fill="#0F9D58" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
