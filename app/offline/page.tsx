export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-6 text-center dark:bg-neutral-950">
      <div className="mb-4 text-5xl">Offline</div>
      <h1 className="mb-2 text-xl font-bold text-brand-700">You're offline</h1>
      <p className="max-w-sm text-sm text-neutral-500">
        Dhanwantari Healthcare needs an internet connection for this page. Anything you were
        viewing recently (patients, queue, appointments) may still be available from cache -
        try going back. Actions you queue offline (like recording vitals) will sync
        automatically once you're back online.
      </p>
    </div>
  );
}
