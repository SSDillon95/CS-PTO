"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import SignupForm from "@/components/SignupForm";
import type { SignupFormData } from "@/lib/types";

export default function HomePage() {
  const [banner, setBanner] = useState<{
    type: "success" | "warning";
    message: string;
  } | null>(null);

  function handleSuccess(
    _data: SignupFormData,
    emailSent: boolean,
    emailError?: string
  ) {
    if (emailSent) {
      setBanner({
        type: "success",
        message:
          "Thank you! Your signup was submitted and emailed to the PTO board.",
      });
    } else {
      setBanner({
        type: "warning",
        message: emailError
          ? `Signup received, but email could not be sent: ${emailError}`
          : "Signup received, but email could not be sent. Please contact the PTO board directly.",
      });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="relative mx-auto w-full max-w-xl flex-1 px-4 py-8 sm:px-6">
      <Link
        href="/login"
        className="absolute left-4 top-4 z-10 rounded-lg border border-stone-300 bg-white/95 px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm backdrop-blur transition hover:bg-stone-50 sm:left-6 sm:top-6"
      >
        Log in
      </Link>

      <header className="mb-8 text-center">
        <div className="mx-auto mb-4 w-full max-w-[280px] sm:max-w-[320px]">
          <Image
            src="/dorsey-pto-logo.jpg"
            alt="Dorsey Attendance Center Parent Teacher Organization — Together We Support, Together We Succeed"
            width={640}
            height={640}
            priority
            className="h-auto w-full rounded-full shadow-md ring-2 ring-[#c9a227]/50"
          />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a88b1e]">
          Together We Support · Together We Succeed
        </p>
      </header>

      {banner && (
        <div
          className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
            banner.type === "success"
              ? "border-emerald-300 bg-emerald-50 text-emerald-900"
              : "border-amber-300 bg-amber-50 text-amber-950"
          }`}
          role="status"
        >
          <div className="flex items-start justify-between gap-3">
            <p>{banner.message}</p>
            <button
              type="button"
              onClick={() => setBanner(null)}
              className="shrink-0 text-xs font-semibold opacity-70 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="space-y-8">
        <SignupForm onSuccess={handleSuccess} />
      </div>

      <footer className="mt-12 border-t border-stone-200 pt-6 text-center text-xs text-stone-400">
        Dorsey Attendance Center · Parent Teacher Organization
        <br />
        Signups are emailed to the PTO board automatically.
      </footer>
    </div>
  );
}

