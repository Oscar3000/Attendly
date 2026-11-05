"use client";

import { useEffect } from "react";

const DISMISS_AFTER_MS = 6000;

/**
 * A short message at the bottom of the screen. Keep it mounted and pass the message when there's
 * something to say: a screen reader only announces text added to a live region already on the page
 */
export function Toast({ message, onDismiss }: { message: string | null; onDismiss: () => void }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, DISMISS_AFTER_MS);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  return (
    <div role="status" className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2">
      {message && (
        <div className="flex w-max max-w-[calc(100vw-2rem)] animate-pop items-center gap-3 rounded-full bg-ink py-1.5 pr-2 pl-5 text-paper shadow-lg">
          <span>{message}</span>
          <button
            type="button"
            onClick={onDismiss}
            className="min-h-11 px-3 font-semibold text-lime"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
