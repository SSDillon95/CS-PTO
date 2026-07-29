"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import type {
  ChildEntry,
  EventOption,
  ParentMatch,
  SignupFormData,
} from "@/lib/types";
import {
  MAX_CHILDREN,
  normalizeChildren,
  normalizePhoneDigits,
} from "@/lib/types";
import ReturningParentModal from "@/components/ReturningParentModal";

interface SignupFormProps {
  onSuccess: (
    data: SignupFormData,
    emailSent: boolean,
    emailError?: string
  ) => void;
}

function emptyChild(): ChildEntry {
  return { name: "", grade: "" };
}

export default function SignupForm({ onSuccess }: SignupFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [children, setChildren] = useState<ChildEntry[]>([emptyChild()]);
  const [eventOptions, setEventOptions] = useState<EventOption[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [events, setEvents] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [match, setMatch] = useState<ParentMatch | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [autofilled, setAutofilled] = useState(false);

  // Phones we already prompted for this session (confirm or decline)
  const promptedPhones = useRef<Set<string>>(new Set());
  const lookupAbort = useRef<AbortController | null>(null);

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

  const lookupParent = useCallback(async (phoneValue: string) => {
    const digits = normalizePhoneDigits(phoneValue);
    if (digits.length < 10) return;
    if (promptedPhones.current.has(digits)) return;

    lookupAbort.current?.abort();
    const controller = new AbortController();
    lookupAbort.current = controller;

    setLookingUp(true);
    try {
      const res = await fetch("/api/signup/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneValue }),
        signal: controller.signal,
      });
      const json = (await res.json()) as {
        found?: boolean;
        match?: ParentMatch;
      };
      if (controller.signal.aborted) return;
      if (res.ok && json.found && json.match) {
        setMatch(json.match);
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      // Silent — lookup is optional convenience
    } finally {
      if (!controller.signal.aborted) setLookingUp(false);
    }
  }, []);

  // Debounced lookup while typing a full phone number
  useEffect(() => {
    const digits = normalizePhoneDigits(phone);
    if (digits.length < 10) return;
    if (promptedPhones.current.has(digits)) return;

    const timer = window.setTimeout(() => {
      void lookupParent(phone);
    }, 600);
    return () => window.clearTimeout(timer);
  }, [phone, lookupParent]);

  function applyMatch(m: ParentMatch) {
    setName(m.name);
    setPhone(m.phone);
    setChildren(
      m.children.length > 0
        ? m.children.map((c) => ({ name: c.name, grade: c.grade }))
        : [emptyChild()]
    );
    // Only pre-check events that still exist on the public form
    const activeIds = new Set(eventOptions.map((e) => e.id));
    setEvents((m.events || []).filter((id) => activeIds.has(id)));
    setAutofilled(true);
    setError(null);
  }

  function handleConfirmMatch() {
    if (!match) return;
    const digits = normalizePhoneDigits(match.phone);
    promptedPhones.current.add(digits);
    applyMatch(match);
    setMatch(null);
  }

  function handleDeclineMatch() {
    if (match) {
      promptedPhones.current.add(normalizePhoneDigits(match.phone));
    }
    setMatch(null);
  }

  function toggleEvent(id: string) {
    setEvents((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
    setError(null);
  }

  function updateChild(
    index: number,
    field: keyof ChildEntry,
    value: string
  ) {
    setChildren((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
    setError(null);
  }

  function addChild() {
    setChildren((prev) => {
      if (prev.length >= MAX_CHILDREN) return prev;
      return [...prev, emptyChild()];
    });
    setError(null);
  }

  function removeChild(index: number) {
    setChildren((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
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

    const validChildren = normalizeChildren(children);
    if (validChildren.length === 0) {
      setError("Add at least one child (name and grade).");
      return;
    }
    for (let i = 0; i < validChildren.length; i++) {
      const c = validChildren[i];
      if (!c.name) {
        setError(`Child ${i + 1}: name is required.`);
        return;
      }
      if (!c.grade) {
        setError(`Child ${i + 1}: grade is required.`);
        return;
      }
    }

    for (let i = 0; i < children.length; i++) {
      const c = children[i];
      const hasName = c.name.trim().length > 0;
      const hasGrade = c.grade.trim().length > 0;
      if ((hasName && !hasGrade) || (!hasName && hasGrade)) {
        setError(
          `Child ${i + 1}: enter both name and grade, or clear the row.`
        );
        return;
      }
    }

    if (events.length === 0) {
      setError("Please select at least one event to help with.");
      return;
    }

    const data: SignupFormData = {
      name: name.trim(),
      phone: phone.trim(),
      children: validChildren,
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
      setChildren([emptyChild()]);
      setEvents([]);
      setAutofilled(false);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border-2 border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/40";

  return (
    <>
      {match && (
        <ReturningParentModal
          match={match}
          onConfirm={handleConfirmMatch}
          onDecline={handleDeclineMatch}
        />
      )}

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
              onChange={(e) => {
                setName(e.target.value);
                setAutofilled(false);
              }}
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
              onChange={(e) => {
                setPhone(e.target.value);
                setAutofilled(false);
              }}
              onBlur={() => {
                if (normalizePhoneDigits(phone).length >= 10) {
                  void lookupParent(phone);
                }
              }}
              placeholder="(555) 555-5555"
              className={inputClass}
              autoComplete="tel"
              required
            />
            <p className="mt-1.5 text-xs text-stone-500">
              {lookingUp
                ? "Checking for a previous signup…"
                : "If you signed up before, we can fill in your info when you enter this number."}
            </p>
          </label>

          {autofilled && (
            <div
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
              role="status"
            >
              Form filled from your previous signup. Review and update anything
              that changed, then submit.
            </div>
          )}

          <fieldset>
            <legend className="mb-1.5 text-sm font-semibold text-stone-800">
              Children <span className="text-red-600">*</span>
            </legend>
            <p className="mb-3 text-xs text-stone-500">
              Enter each child&apos;s name and grade. You can list up to{" "}
              {MAX_CHILDREN} children.
            </p>

            <div className="space-y-3">
              {children.map((child, index) => (
                <div
                  key={index}
                  className="rounded-xl border-2 border-stone-200 bg-stone-50/80 p-3 sm:p-4"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                      Child {index + 1}
                    </span>
                    {children.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeChild(index)}
                        className="text-xs font-medium text-red-600 hover:text-red-500"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-stone-700">
                        Name <span className="text-red-600">*</span>
                      </span>
                      <input
                        type="text"
                        value={child.name}
                        onChange={(e) =>
                          updateChild(index, "name", e.target.value)
                        }
                        placeholder="Child's name"
                        className={inputClass}
                        required={index === 0}
                        autoComplete="off"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-stone-700">
                        Grade <span className="text-red-600">*</span>
                      </span>
                      <input
                        type="text"
                        value={child.grade}
                        onChange={(e) =>
                          updateChild(index, "grade", e.target.value)
                        }
                        placeholder="e.g. 3rd Grade"
                        className={inputClass}
                        required={index === 0}
                        autoComplete="off"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>

            {children.length < MAX_CHILDREN && (
              <button
                type="button"
                onClick={addChild}
                className="mt-3 w-full rounded-lg border-2 border-dashed border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-[#c9a227] hover:bg-[#faf6e8] hover:text-stone-900"
              >
                + Add another child ({children.length}/{MAX_CHILDREN})
              </button>
            )}
          </fieldset>

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
    </>
  );
}
