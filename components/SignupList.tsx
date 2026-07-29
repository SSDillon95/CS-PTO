"use client";

import type { SignupEntry } from "@/lib/types";

interface SignupListProps {
  entries: SignupEntry[];
  onDelete: (id: string) => void;
}

export default function SignupList({ entries, onDelete }: SignupListProps) {
  if (entries.length === 0) {
    return (
      <section className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-sm text-stone-500 shadow-sm">
        No signups on this device yet. Completed forms appear here after submit.
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="border-b border-stone-200 bg-stone-50 px-5 py-4">
        <h2 className="font-serif text-lg font-bold text-stone-900">
          Recent signups
        </h2>
        <p className="text-xs text-stone-500">
          {entries.length} on this browser · board is notified by email
        </p>
      </div>
      <ul className="divide-y divide-stone-100">
        {entries.map((entry) => (
          <li key={entry.id} className="px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="font-semibold text-stone-900">{entry.name}</div>
                <div className="text-sm text-stone-600">{entry.phone}</div>
                <div className="text-sm text-stone-600">
                  {entry.children && entry.children.length > 0 ? (
                    <ul className="list-inside list-disc">
                      {entry.children.map((c, i) => (
                        <li key={i}>
                          {c.name}
                          {c.grade ? ` — ${c.grade}` : ""}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    entry.childNameGrade
                  )}
                </div>
                <ul className="mt-2 list-inside list-disc text-sm text-stone-700">
                  {entry.eventLabels.map((label) => (
                    <li key={label}>{label}</li>
                  ))}
                </ul>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-stone-400">
                  <span>
                    {new Date(entry.createdAt).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                  <span
                    className={
                      entry.emailSent
                        ? "rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800"
                        : "rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800"
                    }
                  >
                    {entry.emailSent ? "Emailed to board" : "Email not sent"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Remove local copy of signup for ${entry.name}?`)) {
                    onDelete(entry.id);
                  }
                }}
                className="text-xs font-medium text-red-600 hover:text-red-500"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
