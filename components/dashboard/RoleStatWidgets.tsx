import { StatCard } from "@/components/dashboard/StatCard";

interface TodayStats {
  appointmentsToday: number;
  revenueToday: number;
  registrationsToday: number;
  pendingLeaves: number;
  lowStockCount: number;
  pendingLabOrders: number;
}

export function RoleStatWidgets({ role, stats }: { role: string; stats: TodayStats }) {
  const cards: { label: string; value: string | number; tone?: "default" | "warning" | "danger" }[] = [];

  switch (role) {
    case "HOSPITAL_ADMIN":
    case "BRANCH_ADMIN":
    case "SUPER_ADMIN":
      cards.push(
        { label: "Revenue Today", value: `Rs ${stats.revenueToday.toLocaleString()}` },
        { label: "New Patients Today", value: stats.registrationsToday },
        { label: "Appointments Today", value: stats.appointmentsToday },
        { label: "Low Stock Items", value: stats.lowStockCount, tone: stats.lowStockCount > 0 ? "warning" : "default" },
        { label: "Pending Leave Requests", value: stats.pendingLeaves, tone: stats.pendingLeaves > 0 ? "warning" : "default" },
        { label: "Pending Lab Orders", value: stats.pendingLabOrders }
      );
      break;
    case "RECEPTIONIST":
      cards.push(
        { label: "Appointments Today", value: stats.appointmentsToday },
        { label: "New Patients Today", value: stats.registrationsToday }
      );
      break;
    case "DOCTOR":
      cards.push({ label: "Appointments Today", value: stats.appointmentsToday });
      break;
    case "PHARMACIST":
    case "STORE_MANAGER":
      cards.push({ label: "Low Stock Items", value: stats.lowStockCount, tone: stats.lowStockCount > 0 ? "warning" : "default" });
      break;
    case "ACCOUNTANT":
      cards.push({ label: "Revenue Today", value: `Rs ${stats.revenueToday.toLocaleString()}` });
      break;
    case "LAB_TECHNICIAN":
      cards.push({ label: "Pending Lab Orders", value: stats.pendingLabOrders });
      break;
    case "HR_MANAGER":
      cards.push({ label: "Pending Leave Requests", value: stats.pendingLeaves, tone: stats.pendingLeaves > 0 ? "warning" : "default" });
      break;
    default:
      cards.push({ label: "Appointments Today", value: stats.appointmentsToday });
  }

  return (
    <div className="mb-8 grid grid-cols-3 gap-4">
      {cards.map((c) => (
        <StatCard key={c.label} label={c.label} value={c.value} tone={c.tone} />
      ))}
    </div>
  );
}
