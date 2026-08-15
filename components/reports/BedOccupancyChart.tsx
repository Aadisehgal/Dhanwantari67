"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export function BedOccupancyChart({
  data,
}: {
  data: { ward: string; occupied: number; vacant: number; occupancyPercent: number }[];
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:bg-neutral-900">
      <h3 className="mb-3 font-semibold">Bed Occupancy by Ward</h3>
      {data.length === 0 ? (
        <p className="text-sm text-neutral-400">No wards configured.</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="ward" fontSize={11} />
            <YAxis fontSize={11} />
            <Tooltip />
            <Legend />
            <Bar dataKey="occupied" stackId="a" fill="#DC2626" name="Occupied" />
            <Bar dataKey="vacant" stackId="a" fill="#0F9D58" name="Vacant" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
