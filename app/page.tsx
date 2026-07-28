"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import SignupForm from "@/components/SignupForm";
import SignupList from "@/components/SignupList";
import type { SignupEntry, SignupFormData } from "@/lib/types";
import { eventLabel } from "@/lib/types";
import {
  createId,
  exportCsv,
  loadEntries,
  saveEntries,
} from "@/lib/storage";

export default function HomePage() {
  const [entries, setEntries] = useState<SignupEntry[]>([]);
  const [ready, setReady] = useState(false);
  const [banner, setBanner] = useState<{
    type: "success" | "warning";
    message: string;
  } | null>(null);

  useEffect(() => {
    setEntries(loadEntries());
    setReady(true);
  }, []);

  const persist = useCallback((next: SignupEntry[]) => {
    setEntries(next);
    saveEntries(next);
  }, []);

  function handleSuccess(
    data: SignupFormData,
    emailSent: boolean,
    emailError?: string
  ) {
    const entry: SignupEntry = {
      id: createId(),
      ...data,
      eventLabels: data.events.map(eventLabel),
      createdAt: new Date().toISOString(),
      emailSent,
    };
    persist([entry, ...entries]);

    if (emailSent) {
      setBanner({
        type: "success",
        message:
          "Thank you! Your signup was submitted and emailed to the PTO board.",
      });
    } else {
      setBanner({
        type: "warning",
        message: emailError
          ? `Signup saved, but email could not be sent: ${emailError}`
          : "Signup saved, but email could not be sent. Please contact the PTO board directly.",
      });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDelete(id: string) {
    persist(entries.filter((e) => e.id !== id));
  }

  function handleExport() {
    const csv = exportCsv(entries);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dorsey-pto-signups-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-stone-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl flex-1 px-4 py-8 sm:px-6">
      <header className="mb-8 text-center">
        <div className="mx-auto mb-4 w-full max-w-[280px] sm:max-w-[320px]">
          <Image
            src="/dorsey-pto-logo.jpg"
            alt="Dorsey Attendance Center Parent Teacher Organization — Together We Support, Together We Succeed"
            width={640}
            height={640}
            priority
            className="h-auto w-full rounded-full shadow-md ring-2 ring-[#c9a227]/50"
          />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a88b1e]">
          Together We Support · Together We Succeed
        </p>
      </header>

      {banner && (
        <div
          className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
            banner.type === "success"
              ? "border-emerald-300 bg-emerald-50 text-emerald-900"
              : "border-amber-300 bg-amber-50 text-amber-950"
          }`}
          role="status"
        >
          <div className="flex items-start justify-between gap-3">
            <p>{banner.message}</p>
            <button
              type="button"
              onClick={() => setBanner(null)}
              className="shrink-0 text-xs font-semibold opacity-70 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="space-y-8">
        <SignupForm onSuccess={handleSuccess} />

        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-base font-bold text-stone-800">
            On this device
          </h2>
          <button
            type="button"
            onClick={handleExport}
            disabled={entries.length === 0}
            className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Export CSV
          </button>
        </div>

        <SignupList entries={entries} onDelete={handleDelete} />
      </div>

      <footer className="mt-12 border-t border-stone-200 pt-6 text-center text-xs text-stone-400">
        Dorsey Attendance Center · Parent Teacher Organization
        <br />
        Signups are emailed to the PTO board automatically.
      </footer>
    </div>
  );
}
