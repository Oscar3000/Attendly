"use client";

import { QrCode } from "@/components/qr-code";

/**
 * Home page component - QR Code scan verification page
 * Matches the provided design specifications exactly
 */
export default function HomePage() {
  const handleScanClick = () => {
    // TODO: Implement QR code scanning functionality
    console.log("Scan QR Code clicked");
  };

  return (
    <main
      className="flex min-h-screen flex-col items-center px-4 py-8 sm:px-6 sm:py-10"
      style={{ backgroundColor: "#FFF9F4" }}
    >
      <div className="flex w-full max-w-sm flex-col items-center sm:max-w-md">
        {/* Brand Header - 40px margin top */}
        <header style={{ marginTop: "40px" }}>
          <h1
            className="font-inter font-semibold text-center"
            style={{
              fontSize: "32px",
              color: "#000000",
            }}
          >
            Attendly
          </h1>
        </header>

        {/* Title - 32px margin top */}
        <h2
          className="font-inter font-bold text-center"
          style={{
            fontSize: "36px",
            color: "#000000",
            marginTop: "32px",
          }}
        >
          Scan to Verify
        </h2>

        {/* Subtitle - 16px margin top, 80% width */}
        <p
          className="font-inter font-normal text-center"
          style={{
            fontSize: "18px",
            lineHeight: "26px",
            color: "#333333",
            marginTop: "16px",
            width: "80%",
          }}
        >
          Scan your wedding invitation to confirm your attendance
        </p>

        {/* QR Code - 40px margin top, 12px corner radius */}
        <div className="flex justify-center" style={{ marginTop: "40px" }}>
          <QrCode
            src="/free-qr.png"
            size={200}
            alt="Wedding invitation QR code for attendance confirmation"
            className="rounded-xl shadow-lg"
          />
        </div>

        {/* Scan Button - 50px margin top, responsive specifications */}
        <button
          onClick={handleScanClick}
          className="attendly-scan-button font-inter font-medium text-center text-white transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 w-full px-4 sm:w-auto"
          style={{
            borderRadius: "18px",
            backgroundColor: "#C07A54",
            marginTop: "50px",
            border: "none",
            cursor: "pointer",
          }}
        >
          Scan QR Code
        </button>
      </div>
    </main>
  );
}
