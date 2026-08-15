"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { notificationProvider } from "@/lib/adapters/notification";
import type { NotificationType } from "@prisma/client";

/** Creates an in-app notification for a user, and optionally emails them via the pluggable adapter. */
export async function notifyUser(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string,
  emailAddress?: string
) {
  const notification = await prisma.notification.create({
    data: { userId, type, title, message, link },
  });

  if (emailAddress) {
    await notificationProvider.send({ to: emailAddress, subject: title, message });
  }

  return notification;
}

export async function getMyNotifications() {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return { notifications: [], unreadCount: 0 };

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return { notifications, unreadCount };
}

export async function markNotificationRead(id: string) {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return { ok: false };

  await prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } });
  revalidatePath("/dashboard/notifications");
  return { ok: true };
}

export async function markAllNotificationsRead() {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return { ok: false };

  await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  revalidatePath("/dashboard/notifications");
  return { ok: true };
}
