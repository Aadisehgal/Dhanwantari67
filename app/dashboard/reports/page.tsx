export const dynamic = "force-dynamic";

import { getReportsBundle } from "@/actions/reports";
import { RevenueTrendChart } from "@/components/reports/RevenueTrendChart";
import { PaymentModeChart } from "@/components/reports/PaymentModeChart";
import { BedOccupancyChart } from "@/components/reports/BedOccupancyChart";
import { TopDiagnosesChart, DoctorConsultationChart } from "@/components/reports/DoctorAndDiagnosisCharts";

export default async function ReportsPage() {
  let bundle;
  try {
    bundle = await getReportsBundle(30);
  } catch {
    return (
      <div className="min-h-screen bg-neutral-50 p-8 dark:bg-neutral-950">
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-800">
          Your role doesn't have access to Reports & Analytics. Contact a hospital admin if you need this.
        </p>
      </div>
    );
  }

  if (!bundle) {
    return <p className="p-8 text-status-alert">No branch assigned to this account.</p>;
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-8 dark:bg-neutral-950">
      <h1 className="mb-6 text-2xl font-bold text-brand-700">Reports & Analytics</h1>

      <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-5">
        <p className="text-sm font-semibold text-amber-800">
          Pending Dues (across all patients): Rs {bundle.pendingDues.toFixed(2)}
        </p>
      </div>

      <div className="space-y-6">
        <RevenueTrendChart revenueTrend={bundle.revenueTrend} registrationTrend={bundle.registrationTrend} />

        <div className="grid grid-cols-2 gap-6">
          <PaymentModeChart data={bundle.paymentModes} />
          <BedOccupancyChart data={bundle.bedOccupancy} />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <TopDiagnosesChart data={bundle.topDiagnoses} />
          <DoctorConsultationChart data={bundle.doctorConsultations} />
        </div>
      </div>
    </div>
  );
}
