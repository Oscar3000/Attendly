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

  return <div id={id} className="w-full overflow-hidden rounded-xl bg-black" />;
}
