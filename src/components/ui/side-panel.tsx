"use client";

import { useEffect, useRef } from "react";

interface SidePanelProps {
  open: boolean;
  onClose: () => void;
  // Names the panel for screen readers
  label: string;
  children: React.ReactNode;
}

/**
 * A panel that slides in from the right. A modal <dialog> traps focus, closes on Escape and
 * hands focus back when it closes. The children unmount with it, so their state starts fresh
 */
export function SidePanel({ open, onClose, label, children }: SidePanelProps) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (open && !element?.open) element?.showModal();
    if (!open && element?.open) element.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      aria-label={label}
      // Also fires when `open` turning false closes it, which isn't the user asking to close
      onClose={() => open && onClose()}
      // The padding is on the child, so a click that lands on the dialog itself is the backdrop
      onClick={(e) => e.target === dialog.current && onClose()}
      className="ml-auto h-dvh max-h-none w-[min(460px,100%)] max-w-none bg-paper text-ink backdrop:bg-ink/50 open:animate-panel-in"
    >
      {open && (
        <div className="flex min-h-full flex-col gap-4 p-6">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 px-2 font-semibold text-ink underline"
            >
              Close
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
