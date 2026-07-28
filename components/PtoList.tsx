"use client";

import type { PtoEntry, SignupCategory, SignupStatus } from "@/lib/types";
import { SIGNUP_CATEGORIES } from "@/lib/types";
import { categoryLabel, formatDateRange } from "@/lib/storage";

const typeColors: Record<SignupCategory, string> = {
  event: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
  classroom:
    "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
  fundraising:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  hospitality:
    "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
  other: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
};

const statusColors: Record<SignupStatus, string> = {
  confirmed:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  pending:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  cancelled:
    "bg-slate-100 text-slate-500 line-through dark:bg-slate-800 dark:text-slate-500",
};

interface PtoListProps {
  entries: PtoEntry[];
  filterName: string;
  filterType: SignupCategory | "all";
  onFilterName: (v: string) => void;
  onFilterType: (v: SignupCategory | "all") => void;
  onStatusChange: (id: string, status: SignupStatus) => void;
  onDelete: (id: string) => void;
}

export default function PtoList({
  entries,
  filterName,
  filterType,
  onFilterName,
  onFilterType,
  onStatusChange,
  onDelete,
}: PtoListProps) {
  const filtered = entries
    .filter((e) => {
      const q = filterName.toLowerCase();
      if (
        q &&
        !e.name.toLowerCase().includes(q) &&
        !(e.eventName ?? "").toLowerCase().includes(q) &&
        !(e.studentName ?? "").toLowerCase().includes(q)
      ) {
        return false;
      }
      if (filterType !== "all" && e.type !== filterType) return false;
      return true;
    })
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Signup sheet
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {filtered.length} volunteer
            {filtered.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="search"
            value={filterName}
            onChange={(e) => onFilterName(e.target.value)}
            placeholder="Search name, event, student…"
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
          <select
            value={filterType}
            onChange={(e) =>
              onFilterType(e.target.value as SignupCategory | "all")
            }
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          >
            <option value="all">All categories</option>
            {SIGNUP_CATEGORIES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
          No signups yet. Use the form above to volunteer.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Volunteer</th>
                <th className="px-4 py-3 font-medium">Event / Role</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Notes</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((entry) => (
                <tr
                  key={entry.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900 dark:text-white">
                      {entry.name}
                    </div>
                    {entry.studentName && (
                      <div className="text-xs text-slate-500">
                        Student: {entry.studentName}
                      </div>
                    )}
                    {(entry.email || entry.phone) && (
                      <div className="text-xs text-slate-500">
                        {[entry.email, entry.phone].filter(Boolean).join(" · ")}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                    {entry.eventName || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                    {formatDateRange(entry.startDate, entry.endDate)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColors[entry.type] ?? typeColors.other}`}
                    >
                      {categoryLabel(entry.type)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={entry.status}
                      onChange={(e) =>
                        onStatusChange(
                          entry.id,
                          e.target.value as SignupStatus
                        )
                      }
                      className={`rounded-full border-0 px-2.5 py-0.5 text-xs font-medium capitalize outline-none ${statusColors[entry.status]}`}
                    >
                      <option value="confirmed">Confirmed</option>
                      <option value="pending">Pending</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="max-w-[160px] truncate px-4 py-3 text-slate-500">
                    {entry.notes || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          confirm(
                            `Remove signup for ${entry.name}${entry.eventName ? ` (${entry.eventName})` : ""}?`
                          )
                        ) {
                          onDelete(entry.id);
                        }
                      }}
                      className="text-xs font-medium text-red-600 hover:text-red-500 dark:text-red-400"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
