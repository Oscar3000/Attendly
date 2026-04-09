"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import QrCode from "@/components/qr-code";

const WEDDING_DATE = new Date("2026-05-23T10:00:00+01:00");

function useCountdown(targetDate: Date) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculate = () => {
      const diff = targetDate.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    calculate();
    const id = setInterval(calculate, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return timeLeft;
}

export default function HomePage() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "qr-scanner";
  const countdown = useCountdown(WEDDING_DATE);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop();
    }
    scannerRef.current = null;
    setScanning(false);
  }, []);

  const handleScanSuccess = useCallback(
    async (decodedText: string) => {
      await stopScanner();
      try {
        const url = new URL(decodedText);
        const match = url.pathname.match(/\/invite\/(.+)/);
        if (match?.[1]) {
          router.push(`/invite/${match[1]}`);
          return;
        }
      } catch {
        // Not a URL — try using it as a raw invitation ID
      }
      if (decodedText && !decodedText.includes(" ")) {
        router.push(`/invite/${decodedText}`);
        return;
      }
      setError("Invalid QR code. Please scan a valid invitation code.");
    },
    [router, stopScanner],
  );

  const startScanner = async () => {
    setError("");
    setScanning(true);
    await new Promise((r) => setTimeout(r, 100));
    try {
      const scanner = new Html5Qrcode(scannerContainerId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        handleScanSuccess,
        () => {},
      );
    } catch (err) {
      console.error("Scanner error:", err);
      setError(
        "Could not access camera. Please allow camera permissions and try again.",
      );
      setScanning(false);
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop();
      }
    };
  }, []);

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#FFF9F4" }}>
      {/* ── Hero ── */}
      <section
        className="relative flex flex-col items-center justify-center px-4 pt-16 pb-20 text-center overflow-hidden"
        style={{
          background:
            "linear-gradient(160deg, #FFF9F4 0%, #FDF0E6 55%, #FFF9F4 100%)",
        }}
      >
        {/* Gold top border */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{
            background:
              "linear-gradient(90deg, transparent, #C07A54, #D4AF37, #C07A54, transparent)",
          }}
        />

        {/* Monogram */}
        <div
          className="mb-5 text-5xl sm:text-6xl font-bold tracking-widest select-none"
          style={{
            color: "#C07A54",
            fontFamily: "Georgia, serif",
            textShadow: "0 2px 6px rgba(192,122,84,0.25)",
          }}
        >
          P &amp; O
        </div>

        {/* Tagline */}
        <p
          className="text-xs uppercase tracking-[0.35em] mb-6"
          style={{ color: "#9A7B6B" }}
        >
          Solemnly request your presence at their wedding celebration
        </p>

        {/* Couple names */}
        <h1
          className="text-6xl sm:text-8xl font-bold mb-2 leading-tight"
          style={{ color: "#2C1810", fontFamily: "Georgia, serif" }}
        >
          Pamela
        </h1>
        <div
          className="text-3xl sm:text-4xl my-1"
          style={{ color: "#C07A54", fontFamily: "Georgia, serif" }}
        >
          &amp;
        </div>
        <h1
          className="text-6xl sm:text-8xl font-bold mb-8 leading-tight"
          style={{ color: "#2C1810", fontFamily: "Georgia, serif" }}
        >
          Oscar
        </h1>

        {/* Date pill */}
        <div
          className="px-8 py-3 rounded-full text-base sm:text-lg font-semibold mb-10 tracking-wide"
          style={{ backgroundColor: "#C07A54", color: "#FFFFFF" }}
        >
          May 23rd, 2026
        </div>

        {/* Ornamental divider */}
        <div className="flex items-center gap-3 mb-8 w-full max-w-xs">
          <div className="flex-1 h-px" style={{ backgroundColor: "#D4AF37" }} />
          <span className="text-xl" style={{ color: "#D4AF37" }}>
            ❧
          </span>
          <div className="flex-1 h-px" style={{ backgroundColor: "#D4AF37" }} />
        </div>

        {/* Families */}
        <div
          className="text-center text-sm sm:text-base max-w-sm leading-relaxed"
          style={{ color: "#6B4A3A" }}
        >
          <p className="font-semibold">
            Chief Sunday &amp; Late Lolo Peace Innah
          </p>
          <p className="italic text-xs mb-3" style={{ color: "#9A7B6B" }}>
            (UGO MBA 1 of Ntezi)
          </p>
          <p className="mb-3 text-sm" style={{ color: "#9A7B6B" }}>
            and
          </p>
          <p className="font-semibold">Chief &amp; Lolo Livinus Umeh</p>
          <p className="italic text-xs" style={{ color: "#9A7B6B" }}>
            (Ogbuefi Okunenyeife 1 of Obinofia Ndiuno)
          </p>
        </div>

        {/* Gold bottom border */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{
            background:
              "linear-gradient(90deg, transparent, #C07A54, #D4AF37, #C07A54, transparent)",
          }}
        />
      </section>

      {/* ── Countdown ── */}
      <section
        className="px-4 py-12 text-center"
        style={{ backgroundColor: "#2C1810" }}
      >
        <p
          className="text-xs uppercase tracking-[0.35em] mb-7"
          style={{ color: "#D4AF37" }}
        >
          Counting Down to the Big Day
        </p>
        <div className="flex justify-center gap-3 sm:gap-8">
          {[
            { label: "Days", value: countdown.days },
            { label: "Hours", value: countdown.hours },
            { label: "Mins", value: countdown.minutes },
            { label: "Secs", value: countdown.seconds },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col items-center">
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-bold mb-2"
                style={{
                  backgroundColor: "#C07A54",
                  color: "#FFFFFF",
                  fontFamily: "Georgia, serif",
                  boxShadow: "0 4px 14px rgba(192,122,84,0.4)",
                }}
              >
                {String(value).padStart(2, "0")}
              </div>
              <span
                className="text-xs uppercase tracking-wider"
                style={{ color: "#9A7B6B" }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Event Details ── */}
      <section className="px-4 py-14 max-w-2xl mx-auto">
        <p
          className="text-center text-xs uppercase tracking-[0.35em] mb-8"
          style={{ color: "#9A7B6B" }}
        >
          Schedule of Events
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Church Service */}
          <div
            className="rounded-2xl p-6 border"
            style={{ borderColor: "#E8D5C4", backgroundColor: "#FFFCF9" }}
          >
            <div className="text-3xl mb-3">⛪</div>
            <h3
              className="font-bold text-lg mb-1"
              style={{ color: "#2C1810", fontFamily: "Georgia, serif" }}
            >
              Church Service
            </h3>
            <p
              className="text-sm font-bold mb-4 tracking-wide"
              style={{ color: "#C07A54" }}
            >
              10:00 AM
            </p>
            <p className="text-sm leading-6" style={{ color: "#6B4A3A" }}>
              Archangels Catholic Church
              <br />
              1 Mission St, Satellite Town
              <br />
              Lagos 102102, Lagos
            </p>
          </div>

          {/* Reception */}
          <div
            className="rounded-2xl p-6 border"
            style={{ borderColor: "#E8D5C4", backgroundColor: "#FFFCF9" }}
          >
            <div className="text-3xl mb-3">🥂</div>
            <h3
              className="font-bold text-lg mb-1"
              style={{ color: "#2C1810", fontFamily: "Georgia, serif" }}
            >
              Wedding Reception
            </h3>
            <p
              className="text-sm font-bold mb-4 tracking-wide"
              style={{ color: "#C07A54" }}
            >
              3:00 PM
            </p>
            <p className="text-sm leading-6" style={{ color: "#6B4A3A" }}>
              Canary World
              <br />
              23 Rd, opposite L Close
              <br />
              Festac Town, Lagos 102102, Lagos
            </p>
          </div>
        </div>

        {/* Colours of the Day */}
        <div
          className="mt-5 rounded-2xl p-5 text-center border"
          style={{ borderColor: "#E8D5C4", backgroundColor: "#FFFCF9" }}
        >
          <p
            className="text-xs uppercase tracking-[0.35em] mb-4"
            style={{ color: "#9A7B6B" }}
          >
            Colours of the Day
          </p>
          <div className="flex justify-center gap-4 mb-3">
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-9 h-9 rounded-full shadow-md border-2 border-white"
                style={{ backgroundColor: "#D4AF37" }}
              />
              <span className="text-xs" style={{ color: "#9A7B6B" }}>
                Gold
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-9 h-9 rounded-full shadow-md border-2 border-white"
                style={{ backgroundColor: "#8B4513" }}
              />
              <span className="text-xs" style={{ color: "#9A7B6B" }}>
                Brown
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-9 h-9 rounded-full shadow-md border-2 border-white"
                style={{ backgroundColor: "#E8750A" }}
              />
              <span className="text-xs" style={{ color: "#9A7B6B" }}>
                Orange
              </span>
            </div>
          </div>
          <p className="text-sm font-semibold" style={{ color: "#2C1810" }}>
            Gold, Brown &amp; Orange
          </p>
        </div>
      </section>

      {/* ── QR Scanner ── */}
      <section
        className="px-4 py-14 text-center"
        style={{
          background: "linear-gradient(180deg, #FFF9F4 0%, #FDF0E6 100%)",
        }}
      >
        <div className="max-w-sm mx-auto">
          <div className="mb-8">
            <div
              className="w-12 h-px mx-auto mb-5"
              style={{ backgroundColor: "#D4AF37" }}
            />
            <h2
              className="text-3xl sm:text-4xl font-bold mb-3"
              style={{ color: "#2C1810", fontFamily: "Georgia, serif" }}
            >
              Verify Your Invitation
            </h2>
            <p className="text-sm" style={{ color: "#6B4A3A" }}>
              Scan your personal QR code to confirm your attendance
            </p>
            <div
              className="w-12 h-px mx-auto mt-5"
              style={{ backgroundColor: "#D4AF37" }}
            />
          </div>

          <div className="flex flex-col items-center">
            {!scanning ? (
              <QrCode
                src="/free-qr.png"
                size={200}
                alt="Wedding invitation QR code for attendance confirmation"
                className="rounded-xl shadow-lg"
              />
            ) : (
              <div className="w-full max-w-[300px]">
                <div
                  id={scannerContainerId}
                  className="rounded-xl overflow-hidden shadow-lg"
                />
                <button
                  onClick={stopScanner}
                  className="w-full mt-3 py-2 rounded-lg font-inter font-medium text-sm text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {error && (
            <div
              className="mt-4 w-full rounded-lg p-3 text-center text-sm font-inter"
              style={{ backgroundColor: "#FFE5E5", color: "#D32F2F" }}
            >
              {error}
            </div>
          )}

          {!scanning && (
            <button
              onClick={startScanner}
              className="font-inter font-semibold text-white w-full mt-8 py-4 rounded-2xl transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ backgroundColor: "#C07A54" }}
            >
              Scan QR Code
            </button>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="py-8 text-center px-4"
        style={{ backgroundColor: "#2C1810" }}
      >
        <p
          className="text-sm font-medium mb-1"
          style={{ color: "#D4AF37", fontFamily: "Georgia, serif" }}
        >
          Pamela &amp; Oscar · May 23, 2026
        </p>
        <p className="text-xs" style={{ color: "#6B4A3A" }}>
          Powered by Attendly
        </p>
      </footer>
    </main>
  );
}
