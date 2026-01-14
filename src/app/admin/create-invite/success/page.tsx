"use client";

import { Suspense } from "react";
import { SuccessPageContent } from "./content";

export default function InviteSuccessPage() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <SuccessPageContent />
    </Suspense>
  );
}

function LoadingPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "#FFF9F4" }}
    >
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading invitation...</p>
      </div>
    </div>
  );
}
