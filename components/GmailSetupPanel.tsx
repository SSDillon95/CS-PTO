"use client";

import { useCallback, useEffect, useState } from "react";
import { DISTRIBUTION_CONTACTS } from "@/lib/types";

interface GmailSetupStatus {
  username: string;
  hasPassword: boolean;
  configured: boolean;
  configSource: "saved" | "environment" | "none";
  smtpHost: string;
  smtpPort: number;
  fromAddress: string;
  updatedAt: string | null;
  distributionEmails: string[];
}

interface GmailSetupPanelProps {
  onNotify: (type: "success" | "error", text: string) => void;
}

function contactLabel(email: string): string {
  const known = DISTRIBUTION_CONTACTS.find(
    (c) => c.email.toLowerCase() === email.toLowerCase()
  );
  return known?.label || "";
}

function sourceLabel(source: GmailSetupStatus["configSource"]): string {
  switch (source) {
    case "saved":
      return "Saved in Gmail Setup";
    case "environment":
      return "Environment variables";
    default:
      return "Not configured";
  }
}

export default function GmailSetupPanel({ onNotify }: GmailSetupPanelProps) {
  const [status, setStatus] = useState<GmailSetupStatus | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [distribution, setDistribution] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingGmail, setSavingGmail] = useState(false);
  const [savingList, setSavingList] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/gmail", { cache: "no-store" });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        data?: GmailSetupStatus;
      };
      if (!res.ok || !json.data) {
        throw new Error(json.error || "Failed to load Gmail setup.");
      }
      setStatus(json.data);
      setUsername(json.data.username || "");
      setPassword("");
      setDistribution(json.data.distributionEmails || []);
    } catch (error) {
      onNotify("error", (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSaveGmail(e: React.FormEvent) {
    e.preventDefault();
    setSavingGmail(true);
    try {
      const res = await fetch("/api/admin/gmail", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        data?: GmailSetupStatus;
      };
      if (!res.ok || !json.data) {
        throw new Error(json.error || "Failed to save Gmail setup.");
      }
      setStatus(json.data);
      setPassword("");
      onNotify(
        "success",
        "Gmail setup saved and verified. Form entries will send from this account."
      );
    } catch (error) {
      onNotify("error", (error as Error).message);
    } finally {
      setSavingGmail(false);
    }
  }

  async function handleClearGmail() {
    if (!confirm("Remove saved Gmail credentials?")) return;
    setSavingGmail(true);
    try {
      const res = await fetch("/api/admin/gmail", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear-gmail" }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        data?: GmailSetupStatus;
      };
      if (!res.ok || !json.data) {
        throw new Error(json.error || "Failed to clear Gmail.");
      }
      setStatus(json.data);
      setUsername(json.data.username || "");
      setPassword("");
      onNotify("success", "Gmail credentials cleared.");
    } catch (error) {
      onNotify("error", (error as Error).message);
    } finally {
      setSavingGmail(false);
    }
  }

  async function handleSaveDistribution() {
    setSavingList(true);
    try {
      const res = await fetch("/api/admin/gmail", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save-distribution",
          distributionEmails: distribution,
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        data?: GmailSetupStatus;
      };
      if (!res.ok || !json.data) {
        throw new Error(json.error || "Failed to save distribution list.");
      }
      setStatus(json.data);
      setDistribution(json.data.distributionEmails);
      onNotify("success", "Distribution list saved.");
    } catch (error) {
      onNotify("error", (error as Error).message);
    } finally {
      setSavingList(false);
    }
  }

  function addEmail() {
    const value = newEmail.trim().toLowerCase();
    if (!value) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      onNotify("error", "Enter a valid email address.");
      return;
    }
    if (distribution.includes(value)) {
      onNotify("error", "That email is already on the list.");
      return;
    }
    setDistribution((prev) => [...prev, value]);
    setNewEmail("");
  }

  function removeEmail(email: string) {
    setDistribution((prev) => prev.filter((e) => e !== email));
  }

  const inputClass =
    "w-full rounded-lg border-2 border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/40";

  if (loading) {
    return (
      <section className="rounded-2xl border border-stone-200 bg-white p-6 text-sm text-stone-500 shadow-sm">
        Loading Gmail setup…
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {/* Distribution list */}
      <section className="rounded-2xl border-2 border-[#c9a227]/50 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="font-serif text-lg font-bold text-stone-900">
          Form entry distribution
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          When someone submits the public signup form, an email with their
          entry is sent to everyone on this list.
        </p>

        <ul className="mt-4 divide-y divide-stone-100 rounded-xl border border-stone-200">
          {distribution.map((email) => {
            const label = contactLabel(email);
            return (
              <li
                key={email}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
              >
                <div>
                  {label && (
                    <div className="text-sm font-semibold text-stone-900">
                      {label}
                    </div>
                  )}
                  <a
                    href={`mailto:${email}`}
                    className="text-sm text-stone-700 hover:text-[#a88b1e]"
                  >
                    {email}
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => removeEmail(email)}
                  className="text-xs font-medium text-red-600 hover:text-red-500"
                >
                  Remove
                </button>
              </li>
            );
          })}
          {distribution.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-stone-500">
              No recipients yet. Add at least one email.
            </li>
          )}
        </ul>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addEmail();
              }
            }}
            placeholder="Add email address…"
            className={inputClass}
          />
          <button
            type="button"
            onClick={addEmail}
            className="shrink-0 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
          >
            Add
          </button>
        </div>

        <button
          type="button"
          onClick={handleSaveDistribution}
          disabled={savingList}
          className="mt-4 rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-semibold text-[#f5e6a8] hover:bg-stone-800 disabled:opacity-60"
        >
          {savingList ? "Saving…" : "Save distribution list"}
        </button>
      </section>

      {/* Gmail setup */}
      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h2 className="font-serif text-lg font-bold text-stone-900">
            Gmail setup
          </h2>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              status?.configured
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {status?.configured ? "Configured" : "Not configured"}
          </span>
          <span className="text-xs text-stone-500">
            {sourceLabel(status?.configSource ?? "none")}
          </span>
        </div>

        <p className="mb-4 text-sm text-stone-500">
          Connect a Gmail account to send form entries. Use a{" "}
          <strong>Google App Password</strong> if 2-Step Verification is on
          (Google Account → Security → App passwords).
        </p>

        <form onSubmit={handleSaveGmail} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                Gmail address
              </span>
              <input
                type="email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="you@gmail.com"
                className={inputClass}
                required
                autoComplete="off"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                Password / App Password
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  status?.hasPassword
                    ? "Leave blank to keep current password"
                    : "App password"
                }
                className={inputClass}
                required={!status?.hasPassword}
                autoComplete="new-password"
              />
            </label>
          </div>

          {status?.configured && (
            <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <span className="text-xs uppercase tracking-wide text-stone-400">
                    SMTP
                  </span>
                  <div>
                    {status.smtpHost}:{status.smtpPort}
                  </div>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wide text-stone-400">
                    From
                  </span>
                  <div>{status.fromAddress || status.username}</div>
                </div>
              </div>
              {status.updatedAt && (
                <p className="mt-2 text-xs text-stone-400">
                  Last saved {new Date(status.updatedAt).toLocaleString()}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={savingGmail}
              className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-600 disabled:opacity-60"
            >
              {savingGmail ? "Verifying…" : "Save & verify Gmail"}
            </button>
            {status?.configSource === "saved" && (
              <button
                type="button"
                onClick={handleClearGmail}
                disabled={savingGmail}
                className="rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-60"
              >
                Clear Gmail
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
