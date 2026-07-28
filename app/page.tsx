"use client";

import { useCallback, useEffect, useState } from "react";
import PtoForm from "@/components/PtoForm";
import PtoList from "@/components/PtoList";
import PtoCalendar from "@/components/PtoCalendar";
import StatsBar from "@/components/StatsBar";
import type { PtoEntry, PtoFormData, PtoStatus, PtoType } from "@/lib/types";
import {
  createId,
  exportCsv,
  loadEntries,
  saveEntries,
} from "@/lib/storage";

export default function HomePage() {
  const [entries, setEntries] = useState<PtoEntry[]>([]);
  const [ready, setReady] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [filterType, setFilterType] = useState<PtoType | "all">("all");
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  useEffect(() => {
    setEntries(loadEntries());
    setReady(true);
  }, []);

  const persist = useCallback((next: PtoEntry[]) => {
    setEntries(next);
    saveEntries(next);
  }, []);

  function handleAdd(data: PtoFormData) {
    const entry: PtoEntry = {
      id: createId(),
      ...data,
      status: "scheduled",
      createdAt: new Date().toISOString(),
    };
    persist([entry, ...entries]);
  }

  function handleStatusChange(id: string, status: PtoStatus) {
    persist(entries.map((e) => (e.id === id ? { ...e, status } : e)));
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
    a.download = `cs-pto-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function prevMonth() {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  }

  function goToday() {
    const d = new Date();
    setCalYear(d.getFullYear());
    setCalMonth(d.getMonth());
  }

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-slate-500">
        Loading CS-PTO…
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-teal-800 dark:bg-teal-900/50 dark:text-teal-300">
            Customer Success
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            CS-PTO
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Team PTO signup sheet — who&apos;s out and when.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={entries.length === 0}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          Export CSV
        </button>
      </header>

      <div className="space-y-6">
        <StatsBar entries={entries} />
        <PtoForm onSubmit={handleAdd} />
        <PtoCalendar
          entries={entries}
          year={calYear}
          month={calMonth}
          onPrev={prevMonth}
          onNext={nextMonth}
          onToday={goToday}
        />
        <PtoList
          entries={entries}
          filterName={filterName}
          filterType={filterType}
          onFilterName={setFilterName}
          onFilterType={setFilterType}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
      </div>

      <footer className="mt-12 border-t border-slate-200 pt-6 text-center text-xs text-slate-400 dark:border-slate-800">
        CS-PTO · Data is stored in this browser (localStorage). Export CSV to
        share.
      </footer>
    </div>
  );
}
