"use client";

import QrCode from "@/components/qr-code";

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
          style={{
            lineHeight: "26px",
            color: "#333333",
          }}
        >
          Scan your wedding invitation to confirm your attendance
        </p>

        {/* QR Code */}
        <div className="flex justify-center mt-8 sm:mt-10">
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
      </div>
    </main>
  );
}
