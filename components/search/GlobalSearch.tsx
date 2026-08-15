"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { globalSearch, type GlobalSearchResult } from "@/actions/search";

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult[]>([]);

  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    const res = await globalSearch(q);
    setResults(res);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => runSearch(query), 250);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  function handleSelect(r: GlobalSearchResult) {
    setOpen(false);
    setQuery("");
    router.push(r.href);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-500 hover:border-brand-400 dark:border-neutral-700"
      >
        Search... <kbd className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs dark:bg-neutral-800">Ctrl+K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-24" onClick={() => setOpen(false)}>
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl dark:bg-neutral-900" onClick={(e) => e.stopPropagation()}>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search patients, invoices, medicines..."
              className="w-full border-b border-neutral-200 px-4 py-3 text-sm outline-none dark:border-neutral-800 dark:bg-neutral-900"
            />
            <div className="max-h-80 overflow-y-auto">
              {results.map((r) => (
                <button
                  key={r.href}
                  onClick={() => handleSelect(r)}
                  className="block w-full border-b border-neutral-50 px-4 py-2.5 text-left text-sm hover:bg-brand-50 dark:border-neutral-800"
                >
                  <span className="mr-2 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] uppercase text-neutral-500 dark:bg-neutral-800">{r.type}</span>
                  {r.label}
                </button>
              ))}
              {query.trim().length >= 2 && results.length === 0 && (
                <p className="p-4 text-center text-sm text-neutral-400">No results found.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
