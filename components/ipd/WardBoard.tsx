import Link from "next/link";

interface BedRow {
  id: string;
  label: string;
  status: string;
  admissions: { id: string; patient: { name: string; uhid: string } }[];
}

interface WardRow {
  id: string;
  name: string;
  type: string;
  beds: BedRow[];
}

const STATUS_COLORS: Record<string, string> = {
  VACANT: "bg-brand-50 border-brand-300 text-brand-700",
  OCCUPIED: "bg-red-50 border-red-300 text-status-alert",
  CLEANING: "bg-amber-50 border-amber-300 text-amber-800",
  RESERVED: "bg-accent-50 border-accent-300 text-accent-600",
  MAINTENANCE: "bg-neutral-100 border-neutral-300 text-neutral-500",
};

export function WardBoard({ wards }: { wards: WardRow[] }) {
  return (
    <div className="space-y-6">
      {wards.map((ward) => (
        <div key={ward.id} className="rounded-xl border border-neutral-200 bg-white p-5 dark:bg-neutral-900">
          <h2 className="mb-3 font-semibold">{ward.name} <span className="text-xs text-neutral-400">({ward.type})</span></h2>
          <div className="grid grid-cols-6 gap-3">
            {ward.beds.map((bed) => {
              const admission = bed.admissions[0];
              return (
                <div key={bed.id} className={`rounded-lg border-2 p-3 text-xs ${STATUS_COLORS[bed.status]}`}>
                  <p className="font-semibold">{bed.label}</p>
                  <p className="mb-1">{bed.status}</p>
                  {admission ? (
                    <Link href={`/dashboard/ipd/${admission.id}`} className="underline">
                      {admission.patient.name}
                    </Link>
                  ) : bed.status === "VACANT" ? (
                    <Link href={`/dashboard/ipd/admit?bedId=${bed.id}`} className="underline">
                      Admit patient
                    </Link>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {wards.length === 0 && (
        <p className="rounded-xl border border-dashed border-neutral-300 p-8 text-center text-neutral-400">
          No wards configured for this branch yet.
        </p>
      )}
    </div>
  );
}
