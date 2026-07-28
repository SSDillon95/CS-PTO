"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error || "Login failed.");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border-2 border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 outline-none focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/40";

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-10 sm:px-6">
      <div className="mb-6">
        <Link
          href="/"
          className="text-sm font-medium text-stone-600 hover:text-stone-900"
        >
          ← Back to sign up form
        </Link>
      </div>

      <div className="rounded-2xl border-2 border-[#c9a227]/60 bg-white p-6 shadow-md sm:p-8">
        <div className="mx-auto mb-4 w-24">
          <Image
            src="/dorsey-pto-logo.jpg"
            alt="Dorsey PTO"
            width={200}
            height={200}
            className="h-auto w-full rounded-full ring-2 ring-[#c9a227]/40"
          />
        </div>
        <h1 className="text-center font-serif text-2xl font-bold text-stone-900">
          Admin Login
        </h1>
        <p className="mt-1 text-center text-sm text-stone-500">
          PTO board access only
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-stone-800">
              Username
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className={inputClass}
              required
            />
          </label>
          <div className="block">
            <span className="mb-1.5 block text-sm font-semibold text-stone-800">
              Password
            </span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className={`${inputClass} pr-20`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs font-semibold text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && (
            <p
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-stone-900 px-5 py-3 text-sm font-bold uppercase tracking-wider text-[#f5e6a8] transition hover:bg-stone-800 disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Log in"}
          </button>
        </form>
      </div>
    </div>
  );
}
