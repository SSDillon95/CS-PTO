"use client";

import { useState, type FormEvent } from "react";
import type { PtoFormData, PtoType } from "@/lib/types";
import { PTO_TYPES } from "@/lib/types";

const empty: PtoFormData = {
  name: "",
  email: "",
  startDate: "",
  endDate: "",
  type: "vacation",
  notes: "",
};

interface PtoFormProps {
  onSubmit: (data: PtoFormData) => void;
}

export default function PtoForm({ onSubmit }: PtoFormProps) {
  const [form, setForm] = useState<PtoFormData>(empty);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof PtoFormData>(key: K, value: PtoFormData[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "startDate" && next.endDate && next.endDate < value) {
        next.endDate = value as string;
      }
      return next;
    });
    setError(null);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!form.startDate || !form.endDate) {
      setError("Start and end dates are required.");
      return;
    }
    if (form.endDate < form.startDate) {
      setError("End date must be on or after start date.");
      return;
    }
    onSubmit({
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
      notes: form.notes.trim(),
    });
    setForm(empty);
    setError(null);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
    >
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
        Sign up for PTO
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Add your time off so the CS team can plan coverage.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-1">
          <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Name *
          </span>
          <input
            type="text"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Jane Smith"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-teal-500/30 placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            required
          />
        </label>

        <label className="block sm:col-span-1">
          <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Email
          </span>
          <input
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="jane@company.com"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-teal-500/30 placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Start date *
          </span>
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => update("startDate", e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-teal-500/30 focus:border-teal-500 focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            End date *
          </span>
          <input
            type="date"
            value={form.endDate}
            min={form.startDate || undefined}
            onChange={(e) => update("endDate", e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-teal-500/30 focus:border-teal-500 focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Type
          </span>
          <select
            value={form.type}
            onChange={(e) => update("type", e.target.value as PtoType)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-teal-500/30 focus:border-teal-500 focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          >
            {PTO_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Notes
          </span>
          <textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            rows={2}
            placeholder="Optional coverage notes…"
            className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-teal-500/30 placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </label>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      <div className="mt-5 flex justify-end">
        <button
          type="submit"
          className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
        >
          Add PTO
        </button>
      </div>
    </form>
  );
}
