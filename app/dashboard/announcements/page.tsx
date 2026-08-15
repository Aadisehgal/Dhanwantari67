export const dynamic = "force-dynamic";

import { listAnnouncements, createAnnouncement } from "@/actions/announcements";

async function handleCreate(formData: FormData) {
  "use server";
  const title = String(formData.get("title"));
  const content = String(formData.get("content"));
  if (title && content) await createAnnouncement(title, content);
}

export default async function AnnouncementsPage() {
  const announcements = await listAnnouncements();

  return (
    <div className="min-h-screen bg-neutral-50 p-8 dark:bg-neutral-950">
      <h1 className="mb-6 text-2xl font-bold text-brand-700">Announcement Board</h1>

      <form action={handleCreate} className="mb-6 space-y-3 rounded-xl border border-neutral-200 bg-white p-5 dark:bg-neutral-900">
        <input name="title" placeholder="Title" required className="input" />
        <textarea name="content" placeholder="Announcement content..." rows={3} required className="input" />
        <button type="submit" className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
          Post Announcement
        </button>
      </form>

      <div className="space-y-3">
        {announcements.map((a) => (
          <div key={a.id} className="rounded-xl border border-neutral-200 bg-white p-4 dark:bg-neutral-900">
            <p className="font-semibold">{a.title}</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">{a.content}</p>
            <p className="mt-1 text-xs text-neutral-400">{new Date(a.createdAt).toLocaleString()}</p>
          </div>
        ))}
        {announcements.length === 0 && <p className="text-sm text-neutral-400">No announcements yet.</p>}
      </div>
    </div>
  );
}
