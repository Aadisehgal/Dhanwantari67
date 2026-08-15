export function StatCard({ label, value, tone = "default" }: { label: string; value: string | number; tone?: "default" | "warning" | "danger" }) {
  const toneClasses =
    tone === "warning" ? "border-amber-300 bg-amber-50 text-amber-800" :
    tone === "danger" ? "border-red-300 bg-red-50 text-status-alert" :
    "border-neutral-200 bg-white dark:bg-neutral-900";

  return (
    <div className={`rounded-xl border p-5 ${toneClasses}`}>
      <p className="text-xs font-medium uppercase text-neutral-400">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
