"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import QrCode from "@/components/qr-code";

export default function HomePage() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "qr-scanner";

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

      // Extract invitation ID from the scanned URL
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

      // If it looks like an ID directly
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

    // Small delay to let the container render
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop();
      }
    };
  }, []);

  return (
    <main
      className="flex min-h-screen flex-col items-center px-4 py-8 sm:px-6 sm:py-10"
      style={{ backgroundColor: "#FFF9F4" }}
    >
      <div className="flex w-full max-w-sm flex-col items-center sm:max-w-md">
        {/* Brand Header */}
        <header className="mt-8 sm:mt-10">
          <h1
            className="font-inter font-semibold text-center text-2xl sm:text-3xl"
            style={{ color: "#000000" }}
          >
            Attendly
          </h1>
        </header>

        {/* Title */}
        <h2
          className="font-inter font-bold text-center text-3xl sm:text-4xl mt-6 sm:mt-8"
          style={{ color: "#000000" }}
        >
          Scan to Verify
        </h2>

        {/* Subtitle */}
        <p
          className="font-inter font-normal text-center text-base sm:text-lg mt-4 w-[90%] sm:w-[80%]"
          style={{ lineHeight: "26px", color: "#333333" }}
        >
          Scan your wedding invitation to confirm your attendance
        </p>

        {/* QR Code / Scanner Area */}
        <div className="mt-8 sm:mt-10 w-full flex flex-col items-center">
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

        {/* Error Message */}
        {error && (
          <div
            className="mt-4 w-full rounded-lg p-3 text-center text-sm font-inter"
            style={{ backgroundColor: "#FFE5E5", color: "#D32F2F" }}
          >
            {error}
          </div>
        )}

        {/* Scan Button */}
        {!scanning && (
          <button
            onClick={startScanner}
            className="attendly-scan-button font-inter font-medium text-center text-white transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 w-full px-4 sm:w-auto mt-10 sm:mt-12"
            style={{
              borderRadius: "18px",
              backgroundColor: "#C07A54",
              border: "none",
              cursor: "pointer",
            }}
          >
            Scan QR Code
          </button>
        )}
      </div>
    </main>
  );
}
