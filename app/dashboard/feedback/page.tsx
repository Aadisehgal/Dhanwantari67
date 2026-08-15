export const dynamic = "force-dynamic";

import { listFeedback, getDoctorSatisfactionScores, submitFeedback } from "@/actions/feedback";
import { prisma } from "@/lib/prisma";

async function handleSubmit(formData: FormData) {
  "use server";
  const patientId = String(formData.get("patientId"));
  const doctorId = String(formData.get("doctorId") || "") || undefined;
  const rating = Number(formData.get("rating"));
  const comment = String(formData.get("comment") || "");
  if (patientId && rating) await submitFeedback(patientId, doctorId, rating, comment || undefined);
}

export default async function FeedbackPage() {
  const [feedback, scores, patients, doctors] = await Promise.all([
    listFeedback(),
    getDoctorSatisfactionScores(),
    prisma.patient.findMany({ take: 50, orderBy: { createdAt: "desc" }, select: { id: true, name: true } }),
    prisma.doctor.findMany({ include: { user: { select: { name: true } } } }),
  ]);

  return (
    <div className="min-h-screen bg-neutral-50 p-8 dark:bg-neutral-950">
      <h1 className="mb-6 text-2xl font-bold text-brand-700">Patient Feedback & NPS</h1>

      <div className="mb-6 grid grid-cols-2 gap-6">
        <form action={handleSubmit} className="space-y-3 rounded-xl border border-neutral-200 bg-white p-5 dark:bg-neutral-900">
          <h3 className="font-semibold">Submit Feedback</h3>
          <select name="patientId" required className="input">
            {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select name="doctorId" className="input">
            <option value="">General (no specific doctor)</option>
            {doctors.map((d) => <option key={d.id} value={d.id}>Dr. {d.user.name}</option>)}
          </select>
          <select name="rating" required className="input">
            <option value="5">5 - Excellent</option>
            <option value="4">4 - Good</option>
            <option value="3">3 - Average</option>
            <option value="2">2 - Poor</option>
            <option value="1">1 - Very Poor</option>
          </select>
          <textarea name="comment" placeholder="Comment (optional)" rows={2} className="input" />
          <button type="submit" className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
            Submit
          </button>
        </form>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:bg-neutral-900">
          <h3 className="mb-3 font-semibold">Doctor Satisfaction Scores</h3>
          <div className="space-y-2">
            {scores.map((s) => (
              <div key={s.doctor} className="flex justify-between text-sm">
                <span>Dr. {s.doctor}</span>
                <span>{s.avgRating}/5 - NPS {s.nps} - {s.responseCount} responses</span>
              </div>
            ))}
            {scores.length === 0 && <p className="text-sm text-neutral-400">No feedback yet.</p>}
          </div>
        </div>
      </div>

      <h2 className="mb-3 font-semibold text-neutral-700">Recent Feedback</h2>
      <div className="space-y-2">
        {feedback.map((f) => (
          <div key={f.id} className="rounded-lg border border-neutral-200 p-3 text-sm dark:border-neutral-800">
            <p>{f.patient.name} rated {f.rating}/5{f.doctor && ` for Dr. ${f.doctor.user.name}`}</p>
            {f.comment && <p className="text-neutral-500">{f.comment}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
