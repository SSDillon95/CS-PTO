"use client";

import type { ParentMatch } from "@/lib/types";

interface ReturningParentModalProps {
  match: ParentMatch;
  onConfirm: () => void;
  onDecline: () => void;
}

export default function ReturningParentModal({
  match,
  onConfirm,
  onDecline,
}: ReturningParentModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="returning-parent-title"
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border-2 border-[#c9a227]/60 bg-white p-6 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#a88b1e]">
          Welcome back
        </p>
        <h2
          id="returning-parent-title"
          className="mt-1 font-serif text-xl font-bold text-stone-900"
        >
          Is this you?
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          We found a previous PTO signup with this phone number. Confirm to fill
          in your information automatically.
        </p>

        <div className="mt-5 space-y-4 rounded-xl border border-stone-200 bg-stone-50 px-4 py-4 text-sm">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-stone-400">
              Name
            </div>
            <div className="mt-0.5 font-semibold text-stone-900">
              {match.name}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-stone-400">
              Phone
            </div>
            <div className="mt-0.5 text-stone-800">{match.phone}</div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-stone-400">
              Children
            </div>
            {match.children.length > 0 ? (
              <ul className="mt-1 list-inside list-disc text-stone-800">
                {match.children.map((c, i) => (
                  <li key={i}>
                    {c.name}
                    {c.grade ? ` — ${c.grade}` : ""}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-0.5 text-stone-500">None on file</div>
            )}
          </div>
          {match.eventLabels.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                Events previously selected
              </div>
              <ul className="mt-1 list-inside list-disc text-stone-800">
                {match.eventLabels.map((label) => (
                  <li key={label}>{label}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-stone-900 px-4 py-3 text-sm font-bold text-[#f5e6a8] shadow transition hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-[#c9a227] focus:ring-offset-2"
          >
            Yes, that&apos;s me — fill form
          </button>
          <button
            type="button"
            onClick={onDecline}
            className="flex-1 rounded-xl border-2 border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:ring-offset-2"
          >
            No, that&apos;s not me
          </button>
        </div>
      </div>
    </div>
  );
}
