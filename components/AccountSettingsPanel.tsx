"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

interface AccountSettingsPanelProps {
  onNotify: (type: "success" | "error", text: string) => void;
  onUsernameChanged?: (username: string) => void;
}

export default function AccountSettingsPanel({
  onNotify,
  onUsernameChanged,
}: AccountSettingsPanelProps) {
  const [currentUsername, setCurrentUsername] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/credentials", { cache: "no-store" });
      const json = (await res.json()) as {
        ok?: boolean;
        username?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error || "Failed to load account.");
      setCurrentUsername(json.username || "");
      setNewUsername(json.username || "");
    } catch (error) {
      onNotify("error", (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!currentPassword) {
      onNotify("error", "Enter your current password.");
      return;
    }
    if (!newUsername.trim()) {
      onNotify("error", "Username is required.");
      return;
    }
    if (newPassword.length < 4) {
      onNotify("error", "New password must be at least 4 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      onNotify("error", "New password and confirmation do not match.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/credentials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newUsername: newUsername.trim(),
          newPassword,
          confirmPassword,
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        username?: string;
        error?: string;
        message?: string;
      };
      if (!res.ok) throw new Error(json.error || "Update failed.");

      setCurrentUsername(json.username || newUsername.trim());
      setNewUsername(json.username || newUsername.trim());
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onUsernameChanged?.(json.username || newUsername.trim());
      onNotify(
        "success",
        json.message || "Username and password updated successfully."
      );
    } catch (error) {
      onNotify("error", (error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border-2 border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/40";

  function PasswordField({
    label,
    value,
    onChange,
    show,
    onToggle,
    autoComplete,
    placeholder,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    show: boolean;
    onToggle: () => void;
    autoComplete: string;
    placeholder?: string;
  }) {
    return (
      <div className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-600">
          {label}
        </span>
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`${inputClass} pr-16`}
            autoComplete={autoComplete}
            placeholder={placeholder}
          />
          <button
            type="button"
            onClick={onToggle}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs font-semibold text-stone-600 hover:bg-stone-100"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? "Hide" : "Show"}
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <section className="rounded-2xl border border-stone-200 bg-white p-6 text-sm text-stone-500 shadow-sm">
        Loading account settings…
      </section>
    );
  }

  return (
    <section className="rounded-2xl border-2 border-[#c9a227]/50 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="font-serif text-lg font-bold text-stone-900">
        Change username &amp; password
      </h2>
      <p className="mt-1 text-sm text-stone-500">
        Update the admin login used for this site. You must enter your current
        password to save changes.
      </p>

      <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
        Current username:{" "}
        <strong className="text-stone-900">{currentUsername}</strong>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-600">
            New username
          </span>
          <input
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            className={inputClass}
            autoComplete="username"
            required
          />
        </label>

        <PasswordField
          label="Current password"
          value={currentPassword}
          onChange={setCurrentPassword}
          show={showCurrent}
          onToggle={() => setShowCurrent((v) => !v)}
          autoComplete="current-password"
          placeholder="Required to confirm changes"
        />

        <PasswordField
          label="New password"
          value={newPassword}
          onChange={setNewPassword}
          show={showNew}
          onToggle={() => setShowNew((v) => !v)}
          autoComplete="new-password"
          placeholder="At least 4 characters"
        />

        <PasswordField
          label="Confirm new password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          show={showConfirm}
          onToggle={() => setShowConfirm((v) => !v)}
          autoComplete="new-password"
          placeholder="Re-enter new password"
        />

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-semibold text-[#f5e6a8] hover:bg-stone-800 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save username & password"}
        </button>
      </form>
    </section>
  );
}
