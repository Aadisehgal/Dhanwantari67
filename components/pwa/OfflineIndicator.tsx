"use client";

import { useState, useEffect } from "react";
import { getQueuedActions, syncOfflineQueue, registerOfflineHandler } from "@/lib/offline/queue";
import { recordVitals } from "@/actions/opd";
import { recordNursingNote } from "@/actions/ipd";

// Register the Server Actions that support offline queueing/replay.
registerOfflineHandler("recordVitals", recordVitals);
registerOfflineHandler("recordNursingNote", (payload: { admissionId: string; note: string; vitals?: any }) =>
  recordNursingNote(payload.admissionId, payload.note, payload.vitals)
);

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  async function refreshPending() {
    const actions = await getQueuedActions();
    setPendingCount(actions.length);
  }

  async function handleSync() {
    setSyncing(true);
    await syncOfflineQueue();
    await refreshPending();
    setSyncing(false);
  }

  useEffect(() => {
    setIsOnline(navigator.onLine);
    refreshPending();

    function goOnline() {
      setIsOnline(true);
      handleSync();
    }
    function goOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (isOnline && pendingCount === 0) return null;

  return (
    <div
      className={`px-4 py-2 text-center text-sm font-medium ${
        isOnline ? "bg-amber-100 text-amber-800" : "bg-status-alert text-white"
      }`}
    >
      {!isOnline
        ? "You're offline - changes will be saved locally and synced automatically."
        : syncing
          ? "Syncing queued changes..."
          : `${pendingCount} change${pendingCount === 1 ? "" : "s"} pending sync.`}
      {isOnline && pendingCount > 0 && !syncing && (
        <button onClick={handleSync} className="ml-2 underline">
          Sync now
        </button>
      )}
    </div>
  );
}
