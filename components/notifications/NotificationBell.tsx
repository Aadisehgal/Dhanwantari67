"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { getMyNotifications, markNotificationRead, markAllNotificationsRead } from "@/actions/notifications";

interface NotificationRow {
  id: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPending, startTransition] = useTransition();

  async function load() {
    const res = await getMyNotifications();
    setNotifications(res.notifications as any);
    setUnreadCount(res.unreadCount);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  function handleOpen() {
    setOpen((o) => !o);
  }

  function handleRead(id: string) {
    startTransition(async () => {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    });
  }

  function handleReadAll() {
    startTransition(async () => {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    });
  }

  return (
    <div className="relative">
      <button onClick={handleOpen} className="relative rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800">
        Notifications
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-status-alert text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl border border-neutral-200 bg-white shadow-lg dark:bg-neutral-900">
          <div className="flex items-center justify-between border-b border-neutral-100 p-3 dark:border-neutral-800">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={handleReadAll} disabled={isPending} className="text-xs text-brand-600 hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((n) => (
              <Link
                key={n.id}
                href={n.link ?? "#"}
                onClick={() => !n.isRead && handleRead(n.id)}
                className={`block border-b border-neutral-50 p-3 text-sm dark:border-neutral-800 ${n.isRead ? "opacity-60" : "bg-brand-50 dark:bg-neutral-800"}`}
              >
                <p className="font-medium">{n.title}</p>
                <p className="text-xs text-neutral-500">{n.message}</p>
                <p className="mt-1 text-[10px] text-neutral-400">{new Date(n.createdAt).toLocaleString()}</p>
              </Link>
            ))}
            {notifications.length === 0 && <p className="p-6 text-center text-sm text-neutral-400">No notifications yet.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
