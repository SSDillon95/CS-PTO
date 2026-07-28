"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";

interface QrSharePanelProps {
  onNotify: (type: "success" | "error", text: string) => void;
}

export default function QrSharePanel({ onNotify }: QrSharePanelProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(true);
  const [copying, setCopying] = useState(false);

  const formUrl = useMemo(() => {
    if (typeof window === "undefined") return "https://cs-pto.vercel.app/";
    return `${window.location.origin}/`;
  }, []);

  const generate = useCallback(async () => {
    setGenerating(true);
    try {
      const url = await QRCode.toDataURL(formUrl, {
        width: 512,
        margin: 2,
        errorCorrectionLevel: "M",
        color: {
          dark: "#1c1917",
          light: "#ffffff",
        },
      });
      setDataUrl(url);
    } catch {
      onNotify("error", "Could not generate QR code.");
      setDataUrl(null);
    } finally {
      setGenerating(false);
    }
  }, [formUrl, onNotify]);

  useEffect(() => {
    void generate();
  }, [generate]);

  async function dataUrlToBlob(url: string): Promise<Blob> {
    const res = await fetch(url);
    return res.blob();
  }

  async function handleCopyQr() {
    if (!dataUrl) return;
    setCopying(true);
    try {
      const blob = await dataUrlToBlob(dataUrl);

      if (
        typeof ClipboardItem !== "undefined" &&
        navigator.clipboard &&
        "write" in navigator.clipboard
      ) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ [blob.type || "image/png"]: blob }),
          ]);
          onNotify("success", "QR code image copied. Paste it into a flyer, email, or text.");
          return;
        } catch {
          // fall through to other methods
        }
      }

      // Fallback: copy the public form URL
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(formUrl);
        onNotify(
          "success",
          "Image copy isn’t supported in this browser. The public form link was copied instead."
        );
        return;
      }

      onNotify("error", "Could not copy. Try Download QR instead.");
    } catch {
      onNotify("error", "Could not copy QR code.");
    } finally {
      setCopying(false);
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(formUrl);
      onNotify("success", "Public form link copied.");
    } catch {
      onNotify("error", "Could not copy link.");
    }
  }

  function handleDownload() {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "dorsey-pto-signup-qr.png";
    a.click();
    onNotify("success", "QR code downloaded.");
  }

  return (
    <section className="rounded-2xl border-2 border-[#c9a227]/50 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="font-serif text-lg font-bold text-stone-900">
        QR code for distribution
      </h2>
      <p className="mt-1 text-sm text-stone-500">
        Scan this code to open the public PTO signup form. Copy or download it
        for flyers, handouts, and group texts.
      </p>

      <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          {generating || !dataUrl ? (
            <div className="flex h-64 w-64 items-center justify-center text-sm text-stone-400">
              Generating QR…
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dataUrl}
              alt="QR code linking to Dorsey PTO public signup form"
              width={256}
              height={256}
              className="h-64 w-64"
            />
          )}
        </div>

        <div className="w-full min-w-0 flex-1 space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Points to
            </p>
            <a
              href={formUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 break-all text-sm font-medium text-[#a88b1e] hover:underline"
            >
              {formUrl}
            </a>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={handleCopyQr}
              disabled={!dataUrl || copying || generating}
              className="rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-semibold text-[#f5e6a8] hover:bg-stone-800 disabled:opacity-60"
            >
              {copying ? "Copying…" : "Copy QR code"}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={!dataUrl || generating}
              className="rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-60"
            >
              Download PNG
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              className="rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
            >
              Copy form link
            </button>
          </div>

          <p className="text-xs text-stone-400">
            Tip: Use <strong>Copy QR code</strong> to paste into Canva, Word, or
            a group message. Use <strong>Download PNG</strong> to save a file
            for printing.
          </p>
        </div>
      </div>
    </section>
  );
}
