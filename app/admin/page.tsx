"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import EventsManagerPanel from "@/components/EventsManagerPanel";
import GmailSetupPanel from "@/components/GmailSetupPanel";
import type { SignupEntry } from "@/lib/types";

type AdminTab = "signups" | "events" | "gmail";

export default function AdminPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [entries, setEntries] = useState<SignupEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<AdminTab>("signups");
  const [toast, setToast] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const me = await fetch("/api/auth/me");
      if (!me.ok) {
        router.replace("/login");
        return;
      }
      const meJson = (await me.json()) as { username?: string };
      setUsername(meJson.username || "Admin");

      const res = await fetch("/api/admin/signups");
      if (!res.ok) {
        router.replace("/login");
        return;
      }
      const json = (await res.json()) as { entries: SignupEntry[] };
      setEntries(json.entries || []);
    } catch {
      setError("Could not load admin data.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  function notify(type: "success" | "error", text: string) {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 5000);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete signup for ${name}?`)) return;
    const res = await fetch("/api/admin/signups", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } else {
      alert("Could not delete signup.");
    }
  }

  function handleExport() {
    window.location.href = "/api/admin/signups?format=csv";
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-stone-500">
        Loading admin…
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#a88b1e]">
            Admin
          </p>
          <h1 className="font-serif text-2xl font-bold text-stone-900">
            Dorsey PTO
          </h1>
          <p className="text-sm text-stone-500">Signed in as {username}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/"
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Public form
          </Link>
          {tab === "signups" && (
            <button
              type="button"
              onClick={handleExport}
              disabled={entries.length === 0}
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
            >
              Export CSV
            </button>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg bg-stone-900 px-3 py-2 text-sm font-semibold text-[#f5e6a8] hover:bg-stone-800"
          >
            Log out
          </button>
        </div>
      </header>

      <nav className="mb-6 flex flex-wrap gap-1 rounded-xl border border-stone-200 bg-white p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setTab("signups")}
          className={`min-w-[6rem] flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
            tab === "signups"
              ? "bg-stone-900 text-[#f5e6a8]"
              : "text-stone-600 hover:bg-stone-50"
          }`}
        >
          Signups
        </button>
        <button
          type="button"
          onClick={() => setTab("events")}
          className={`min-w-[6rem] flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
            tab === "events"
              ? "bg-stone-900 text-[#f5e6a8]"
              : "text-stone-600 hover:bg-stone-50"
          }`}
        >
          Events
        </button>
        <button
          type="button"
          onClick={() => setTab("gmail")}
          className={`min-w-[6rem] flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
            tab === "gmail"
              ? "bg-stone-900 text-[#f5e6a8]"
              : "text-stone-600 hover:bg-stone-50"
          }`}
        >
          Gmail setup
        </button>
      </nav>

      {toast && (
        <div
          className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
            toast.type === "success"
              ? "border-emerald-300 bg-emerald-50 text-emerald-900"
              : "border-red-300 bg-red-50 text-red-800"
          }`}
          role="status"
        >
          {toast.text}
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {tab === "gmail" ? (
        <GmailSetupPanel onNotify={notify} />
      ) : tab === "events" ? (
        <EventsManagerPanel onNotify={notify} />
      ) : (
        <>
          <div className="mb-4 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600 shadow-sm">
            <strong className="text-stone-900">{entries.length}</strong> total
            signup{entries.length === 1 ? "" : "s"}
          </div>

          {entries.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center text-sm text-stone-500 shadow-sm">
              No signups yet. When volunteers submit the public form, they will
              appear here.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                    <th className="px-4 py-3 font-medium">Child &amp; Grade</th>
                    <th className="px-4 py-3 font-medium">Events</th>
                    <th className="px-4 py-3 font-medium">Submitted</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium"> </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-stone-50/80">
                      <td className="px-4 py-3 font-medium text-stone-900">
                        {entry.name}
                      </td>
                      <td className="px-4 py-3 text-stone-700">{entry.phone}</td>
                      <td className="px-4 py-3 text-stone-700">
                        {entry.childNameGrade}
                      </td>
                      <td className="px-4 py-3 text-stone-700">
                        <ul className="list-inside list-disc">
                          {entry.eventLabels.map((l) => (
                            <li key={l}>{l}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-stone-500">
                        {new Date(entry.createdAt).toLocaleString("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            entry.emailSent
                              ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800"
                              : "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800"
                          }
                        >
                          {entry.emailSent ? "Sent" : "Not sent"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleDelete(entry.id, entry.name)}
                          className="text-xs font-medium text-red-600 hover:text-red-500"
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
        </>
      )}
    </div>
  );
}
