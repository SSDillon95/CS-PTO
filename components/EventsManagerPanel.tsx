"use client";

import { useCallback, useEffect, useState } from "react";
import type { EventOption } from "@/lib/types";

interface EventsManagerPanelProps {
  onNotify: (type: "success" | "error", text: string) => void;
}

export default function EventsManagerPanel({
  onNotify,
}: EventsManagerPanelProps) {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/events", { cache: "no-store" });
      const json = (await res.json()) as {
        events?: EventOption[];
        error?: string;
      };
      if (!res.ok) throw new Error(json.error || "Failed to load events.");
      setEvents(json.events || []);
    } catch (error) {
      onNotify("error", (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction(body: Record<string, unknown>, successMsg: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as {
        events?: EventOption[];
        error?: string;
      };
      if (!res.ok) throw new Error(json.error || "Update failed.");
      setEvents(json.events || []);
      onNotify("success", successMsg);
    } catch (error) {
      onNotify("error", (error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newLabel.trim()) {
      onNotify("error", "Enter an event name.");
      return;
    }
    await runAction({ action: "add", label: newLabel.trim() }, "Event added.");
    setNewLabel("");
  }

  function startEdit(event: EventOption) {
    setEditingId(event.id);
    setEditLabel(event.label);
  }

  async function saveEdit(id: string) {
    if (!editLabel.trim()) {
      onNotify("error", "Event name is required.");
      return;
    }
    await runAction(
      { action: "update", id, label: editLabel.trim() },
      "Event updated."
    );
    setEditingId(null);
    setEditLabel("");
  }

  async function toggleActive(event: EventOption) {
    await runAction(
      { action: "update", id: event.id, active: !event.active },
      event.active
        ? "Event hidden from the public form."
        : "Event shown on the public form."
    );
  }

  async function handleDelete(event: EventOption) {
    if (
      !confirm(
        `Delete “${event.label}” from the form? You must keep at least one event.`
      )
    ) {
      return;
    }
    await runAction({ action: "delete", id: event.id }, "Event deleted.");
  }

  const inputClass =
    "w-full rounded-lg border-2 border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/40";

  if (loading) {
    return (
      <section className="rounded-2xl border border-stone-200 bg-white p-6 text-sm text-stone-500 shadow-sm">
        Loading events…
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border-2 border-[#c9a227]/50 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="font-serif text-lg font-bold text-stone-900">
          Events on public form
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          These checkboxes appear under “Events to Help In” on the public signup
          sheet. Changes show up immediately for new visitors.
        </p>

        <ul className="mt-5 space-y-3">
          {events.map((event, index) => (
            <li
              key={event.id}
              className={`rounded-xl border px-4 py-3 ${
                event.active
                  ? "border-stone-200 bg-stone-50"
                  : "border-stone-200 bg-stone-100 opacity-75"
              }`}
            >
              {editingId === event.id ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    className={inputClass}
                    autoFocus
                  />
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => saveEdit(event.id)}
                      className="rounded-lg bg-stone-900 px-3 py-2 text-xs font-semibold text-[#f5e6a8] disabled:opacity-60"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setEditingId(null);
                        setEditLabel("");
                      }}
                      className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-stone-900">
                      {event.label}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-stone-500">
                      <span
                        className={`rounded-full px-2 py-0.5 font-semibold ${
                          event.active
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-stone-200 text-stone-600"
                        }`}
                      >
                        {event.active ? "On form" : "Hidden"}
                      </span>
                      <span className="font-mono text-[11px] text-stone-400">
                        {event.id}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      disabled={busy || index === 0}
                      onClick={() =>
                        runAction(
                          { action: "move", id: event.id, direction: "up" },
                          "Event moved."
                        )
                      }
                      className="rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-xs font-medium text-stone-700 disabled:opacity-40"
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={busy || index === events.length - 1}
                      onClick={() =>
                        runAction(
                          { action: "move", id: event.id, direction: "down" },
                          "Event moved."
                        )
                      }
                      className="rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-xs font-medium text-stone-700 disabled:opacity-40"
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => startEdit(event)}
                      className="rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => toggleActive(event)}
                      className="rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700"
                    >
                      {event.active ? "Hide" : "Show"}
                    </button>
                    <button
                      type="button"
                      disabled={busy || events.length <= 1}
                      onClick={() => handleDelete(event)}
                      className="rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-600 disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <h3 className="text-sm font-bold text-stone-900">Add event</h3>
        <p className="mt-1 text-xs text-stone-500">
          Example: Spring Carnival - After School
        </p>
        <form
          onSubmit={handleAdd}
          className="mt-3 flex flex-col gap-2 sm:flex-row"
        >
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Event name / description"
            className={inputClass}
          />
          <button
            type="submit"
            disabled={busy}
            className="shrink-0 rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-semibold text-[#f5e6a8] hover:bg-stone-800 disabled:opacity-60"
          >
            Add event
          </button>
        </form>
      </section>
    </div>
  );
}
