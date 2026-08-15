"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Wraps html5-qrcode for camera-based barcode scanning. Renders a small
 * inline scanner region; calls onScan with the decoded text and stops
 * itself automatically after one successful read.
 */
export function BarcodeScanner({ onScan, onClose }: { onScan: (code: string) => void; onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let scanner: any;
    let cancelled = false;

    import("html5-qrcode").then(({ Html5Qrcode }) => {
      if (cancelled || !containerRef.current) return;
      scanner = new Html5Qrcode(containerRef.current.id);
      scanner
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 220 },
          (decodedText: string) => {
            onScan(decodedText);
            scanner.stop().catch(() => {});
          },
          () => {
            /* per-frame decode errors are expected while aiming — ignore */
          }
        )
        .catch(() => setError("Could not access camera. Check browser permissions."));
    });

    return () => {
      cancelled = true;
      scanner?.stop?.().catch(() => {});
    };
  }, [onScan]);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:bg-neutral-900">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold">Scan Barcode</span>
        <button onClick={onClose} className="text-xs text-status-alert">
          Close
        </button>
      </div>
      {error ? (
        <p className="text-sm text-status-alert">{error}</p>
      ) : (
        <div id="barcode-scanner-region" ref={containerRef} className="mx-auto w-full max-w-xs" />
      )}
    </div>
  );
}
