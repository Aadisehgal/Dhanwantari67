"use client";

import { get, set, del, keys } from "idb-keyval";

export interface QueuedAction {
  id: string;
  kind: string;
  payload: unknown;
  queuedAt: string;
}

const QUEUE_PREFIX = "offline-queue:";

/** Adds an action to the offline queue (call this when a write fails due to no network). */
export async function queueOfflineAction(kind: string, payload: unknown): Promise<void> {
  const id = `${QUEUE_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const action: QueuedAction = { id, kind, payload, queuedAt: new Date().toISOString() };
  await set(id, action);
}

export async function getQueuedActions(): Promise<QueuedAction[]> {
  const allKeys = await keys();
  const queueKeys = allKeys.filter((k) => typeof k === "string" && k.startsWith(QUEUE_PREFIX));
  const actions = await Promise.all(queueKeys.map((k) => get(k as string)));
  return actions.filter(Boolean) as QueuedAction[];
}

export async function removeQueuedAction(id: string): Promise<void> {
  await del(id);
}

/**
 * Registered handlers for replaying queued actions once back online. Each
 * module that wants offline support registers its Server Action here
 * (e.g. handlers.recordVitals = recordVitals) rather than this module
 * importing every Server Action directly, keeping it decoupled.
 */
type ActionHandler = (payload: any) => Promise<unknown>;
const handlers: Record<string, ActionHandler> = {};

export function registerOfflineHandler(kind: string, handler: ActionHandler) {
  handlers[kind] = handler;
}

/**
 * Wraps a Server Action call: if the network is down (or the call throws
 * a fetch-related error), the payload is queued instead of lost, to be
 * replayed automatically when connectivity returns.
 */
export async function submitWithOfflineFallback<T>(
  kind: string,
  payload: unknown,
  action: () => Promise<T>
): Promise<{ ok: true; result: T } | { ok: true; queued: true }> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    await queueOfflineAction(kind, payload);
    return { ok: true, queued: true };
  }
  try {
    const result = await action();
    return { ok: true, result };
  } catch (err) {
    // Network-ish failure while "online" per the browser (e.g. flaky connection) — queue it too.
    await queueOfflineAction(kind, payload);
    return { ok: true, queued: true };
  }
}

/** Replays every queued action in order, removing each on success. Call this on the 'online' event. */
export async function syncOfflineQueue(): Promise<{ synced: number; failed: number }> {
  const actions = await getQueuedActions();
  let synced = 0;
  let failed = 0;

  for (const action of actions.sort((a, b) => a.queuedAt.localeCompare(b.queuedAt))) {
    const handler = handlers[action.kind];
    if (!handler) {
      failed++;
      continue;
    }
    try {
      await handler(action.payload);
      await removeQueuedAction(action.id);
      synced++;
    } catch {
      failed++;
    }
  }

  return { synced, failed };
}
