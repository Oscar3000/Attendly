"use client";

import { useEffect, useEffectEvent, useId } from "react";
import { Html5Qrcode } from "html5-qrcode";

/**
 * The device's back camera, reading QR codes (T-505). Reports the first code it reads; unmount
 * it to stop the camera, and mount it again to scan the next one
 */
export function QrCamera({
  onScan,
  onUnavailable,
}: {
  onScan: (text: string) => void;
  // No camera, or permission refused
  onUnavailable: () => void;
}) {
  // html5-qrcode finds its container by id
  const id = useId();
  const scanned = useEffectEvent(onScan);
  const unavailable = useEffectEvent(onUnavailable);

  useEffect(() => {
    const scanner = new Html5Qrcode(id, { verbose: false });
    let reported = false;
    const started = scanner.start(
      { facingMode: "environment" },
      // The size of the frame drawn over the video
      { fps: 10, qrbox: { width: 240, height: 240 } },
      (text) => {
        if (reported) return;
        reported = true;
        scanned(text);
      },
      () => {}, // called for every frame without a code
    );
    started.catch(() => unavailable());

    // Stop only once started, or the camera would stay on after a quick unmount
    return () => {
      started
        .then(() => scanner.stop())
        .then(() => scanner.clear())
        .catch(() => {});
    };
  }, [id]);

  return (
    <div className="relative min-h-88 flex-1 overflow-hidden rounded-[28px] bg-graphite">
      {/* Out of the flow, so a tall video can't stretch the page. Centred, so the area the
          scanner reads sits under the frame; the frame replaces the library's own overlay */}
      <div className="absolute inset-0 flex items-center">
        <div id={id} className="w-full [&_#qr-shaded-region]:hidden!" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
        <div className="relative size-60 rounded-[28px] border-[3px] border-paper">
          <div className="absolute inset-x-3 top-1/2 h-[3px] animate-sweep rounded-full bg-lime" />
        </div>
      </div>
      <p className="absolute inset-x-3 bottom-4 text-center text-sm">
        <span className="inline-block rounded-2xl bg-ink/75 px-3 py-1.5 text-paper">
          Scan each guest&apos;s QR code at the entrance
        </span>
      </p>
    </div>
  );
}
