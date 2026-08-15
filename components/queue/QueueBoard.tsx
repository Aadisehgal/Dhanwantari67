"use client";

import { useState, useTransition } from "react";
import { callNextToken, completeToken, markNoShow } from "@/actions/queue";

interface QueueToken {
  id: string;
  tokenNumber: number;
  status: string;
  estimatedWaitMins?: number;
  appointment: { patient: { name: string; uhid: string } };
}

export function QueueBoard({
  doctorId,
  initialWaiting,
  initialCalled,
  avgConsultMins,
}: {
  doctorId: string;
  initialWaiting: QueueToken[];
  initialCalled: QueueToken[];
  avgConsultMins: number;
}) {
  const [waiting, setWaiting] = useState(initialWaiting);
  const [called, setCalled] = useState(initialCalled);
  const [isPending, startTransition] = useTransition();

  function handleCallNext() {
    startTransition(async () => {
      const res = await callNextToken(doctorId);
      if (res.ok && res.token) {
        setWaiting((w) => w.filter((t) => t.id !== res.token!.id));
        setCalled((c) => [...c, res.token as any]);
      }
    });
  }

  function handleComplete(tokenId: string) {
    startTransition(async () => {
      await completeToken(tokenId);
      setCalled((c) => c.filter((t) => t.id !== tokenId));
    });
  }

  function handleNoShow(tokenId: string) {
    startTransition(async () => {
      await markNoShow(tokenId);
      setWaiting((w) => w.filter((t) => t.id !== tokenId));
    });
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:bg-neutral-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">In Consultation</h2>
        </div>
        {called.length === 0 && <p className="text-sm text-neutral-400">Nobody currently in consultation.</p>}
        <ul className="space-y-2">
          {called.map((t) => (
            <li key={t.id} className="flex items-center justify-between rounded-lg bg-brand-50 p-3">
              <div>
                <p className="font-semibold">Token #{t.tokenNumber}</p>
                <p className="text-sm text-neutral-600">{t.appointment.patient.name}</p>
              </div>
              <button
                onClick={() => handleComplete(t.id)}
                disabled={isPending}
                className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600"
              >
                Mark Complete
              </button>
            </li>
          ))}
        </ul>

        <button
          onClick={handleCallNext}
          disabled={isPending || waiting.length === 0}
          className="mt-4 w-full rounded-lg bg-accent-500 py-2 font-semibold text-white hover:bg-accent-600 disabled:opacity-50"
        >
          Call Next Token
        </button>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:bg-neutral-900">
        <h2 className="mb-4 font-semibold">Waiting Queue (avg {avgConsultMins} min/consult)</h2>
        {waiting.length === 0 && <p className="text-sm text-neutral-400">Queue is empty.</p>}
        <ol className="space-y-2">
          {waiting.map((t) => (
            <li key={t.id} className="flex items-center justify-between rounded-lg border border-neutral-100 p-3 dark:border-neutral-800">
              <div>
                <p className="font-semibold">#{t.tokenNumber} — {t.appointment.patient.name}</p>
                <p className="text-xs text-neutral-500">
                  Est. wait: ~{t.estimatedWaitMins} min
                </p>
              </div>
              <button
                onClick={() => handleNoShow(t.id)}
                disabled={isPending}
                className="text-xs text-status-alert hover:underline"
              >
                No-show
              </button>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
