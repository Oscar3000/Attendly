"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import QrCode from "@/components/qr-code";

const SCANNER_CONTAINER_ID = "qr-scanner";

export default function QrScanner() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);

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
      const scanner = new Html5Qrcode(SCANNER_CONTAINER_ID);
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
                id={SCANNER_CONTAINER_ID}
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
  );
}
