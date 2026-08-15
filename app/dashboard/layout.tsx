import { GlobalSearch } from "@/components/search/GlobalSearch";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { OfflineIndicator } from "@/components/pwa/OfflineIndicator";
import Link from "next/link";
import Image from "next/image";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <OfflineIndicator />
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white/80 px-6 py-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/80">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-brand-700">
          <Image src="/logo.png" alt="Dhanwantari Healthcare" width={32} height={32} className="rounded-full" />
          Dhanwantari Healthcare
        </Link>
        <div className="flex items-center gap-4">
          <GlobalSearch />
          <NotificationBell />
        </div>
      </header>
      {children}
    </div>
  );
}
