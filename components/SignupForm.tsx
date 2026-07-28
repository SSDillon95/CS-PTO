"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { EventOption, SignupFormData } from "@/lib/types";

interface SignupFormProps {
  onSuccess: (
    data: SignupFormData,
    emailSent: boolean,
    emailError?: string
  ) => void;
}

export default function SignupForm({ onSuccess }: SignupFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [childNameGrade, setChildNameGrade] = useState("");
  const [eventOptions, setEventOptions] = useState<EventOption[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [events, setEvents] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/events", { cache: "no-store" });
        const json = (await res.json()) as { events?: EventOption[] };
        if (!cancelled) {
          setEventOptions(json.events || []);
        }
      } catch {
        if (!cancelled) setEventOptions([]);
      } finally {
        if (!cancelled) setEventsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function toggleEvent(id: string) {
    setEvents((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!phone.trim()) {
      setError("Phone number is required.");
      return;
    }
    if (!childNameGrade.trim()) {
      setError("Child's name & grade is required.");
      return;
    }
    if (events.length === 0) {
      setError("Please select at least one event to help with.");
      return;
    }

    const data: SignupFormData = {
      name: name.trim(),
      phone: phone.trim(),
      childNameGrade: childNameGrade.trim(),
      events,
    };

    setSubmitting(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        emailSent?: boolean;
        emailError?: string;
      };

      if (!res.ok) {
        setError(json.error || "Something went wrong. Please try again.");
        return;
      }

      onSuccess(data, Boolean(json.emailSent), json.emailError);
      setName("");
      setPhone("");
      setChildNameGrade("");
      setEvents([]);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border-2 border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/40";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border-2 border-[#c9a227]/60 bg-white p-6 shadow-md sm:p-8"
    >
      <h2 className="text-center font-serif text-2xl font-bold tracking-wide text-stone-900">
        PTO Sign Up Sheet
      </h2>
      <p className="mt-1 text-center text-sm text-stone-500">
        Dorsey Attendance Center · Parent Teacher Organization
      </p>

      <div className="mt-8 space-y-5">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-stone-800">
            Name <span className="text-red-600">*</span>
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            className={inputClass}
            autoComplete="name"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-stone-800">
            Phone Number <span className="text-red-600">*</span>
          </span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 555-5555"
            className={inputClass}
            autoComplete="tel"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-stone-800">
            Child&apos;s Name &amp; Grade{" "}
            <span className="text-red-600">*</span>
          </span>
          <input
            type="text"
            value={childNameGrade}
            onChange={(e) => setChildNameGrade(e.target.value)}
            placeholder="e.g. Alex Smith — 3rd Grade"
            className={inputClass}
            required
          />
        </label>

        <fieldset>
          <legend className="mb-3 text-sm font-semibold text-stone-800">
            Events to Help In <span className="text-red-600">*</span>
          </legend>
          {eventsLoading ? (
            <p className="text-sm text-stone-500">Loading events…</p>
          ) : eventOptions.length === 0 ? (
            <p className="text-sm text-stone-500">
              No events are available right now. Please check back later.
            </p>
          ) : (
            <div className="space-y-3">
              {eventOptions.map((event) => {
                const checked = events.includes(event.id);
                return (
                  <label
                    key={event.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 px-4 py-3 transition ${
                      checked
                        ? "border-[#c9a227] bg-[#faf6e8]"
                        : "border-stone-200 bg-stone-50 hover:border-stone-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleEvent(event.id)}
                      className="mt-1 h-4 w-4 rounded border-stone-400 text-[#c9a227] focus:ring-[#c9a227]"
                    />
                    <span className="text-sm font-medium text-stone-800">
                      {event.label}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </fieldset>
      </div>

      {error && (
        <p
          className="mt-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || eventsLoading || eventOptions.length === 0}
        className="mt-8 w-full rounded-xl bg-stone-900 px-5 py-3.5 text-sm font-bold uppercase tracking-wider text-[#f5e6a8] shadow transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#c9a227] focus:ring-offset-2"
      >
        {submitting ? "Submitting…" : "Submit Sign Up"}
      </button>

      <p className="mt-4 text-center text-xs text-stone-400">
        Thank you for supporting the Dorsey PTO.
      </p>
    </form>
  );
}
