export const dynamic = "force-dynamic";

import { getQueueBoard } from "@/actions/queue";
import { QueueBoard } from "@/components/queue/QueueBoard";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function QueuePage({
  params,
}: {
  params: Promise<{ doctorId: string }>;
}) {
  const { doctorId } = await params;

  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    include: { user: { select: { name: true } } },
  });
  if (!doctor) notFound();

  const board = await getQueueBoard(doctorId);

  return (
    <div className="min-h-screen bg-neutral-50 p-8 dark:bg-neutral-950">
      <h1 className="mb-6 text-2xl font-bold text-brand-700">
        Live Queue — Dr. {doctor.user.name}
      </h1>
      <QueueBoard
        doctorId={doctorId}
        initialWaiting={board.waiting as any}
        initialCalled={board.called as any}
        avgConsultMins={board.avgConsultMins}
      />
    </div>
  );
}
