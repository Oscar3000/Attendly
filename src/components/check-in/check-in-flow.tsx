"use client";

import { useState } from "react";
import {
  CHECK_IN_FAILED,
  checkInMessage,
  type CheckInGuest,
  type CheckInMessage,
  type CheckInResponse,
} from "@/lib/check-in";
import { QrCamera } from "./qr-camera";

type Step =
  | { step: "scanning" }
  | { step: "checking" }
  // More than one person can still come in: how many are here now?
  | { step: "choose"; code: string; guest: CheckInGuest; count: number }
  | { step: "result"; message: CheckInMessage };

interface CheckInFlowProps {
  // The check-in API: the host's (T-504) or a door helper's (T-507)
  endpoint: string;
  // The event's time zone, for "last check-in at 7:42 PM"
  timezone: string;
  onAdmitted?: () => void;
}

/**
 * Door check-in (T-505): scan a guest's QR code (or type it), choose how many people are
 * coming in when the invitation admits more than one, then a full-screen green or red answer
 */
export function CheckInFlow({ endpoint, timezone, onAdmitted }: CheckInFlowProps) {
  const [state, setState] = useState<Step>({ step: "scanning" });
  const [cameraUnavailable, setCameraUnavailable] = useState(false);
  const [typed, setTyped] = useState("");

  // Undefined when the request fails or the answer isn't a check-in result (e.g. signed out)
  async function send(body: object): Promise<CheckInResponse | undefined> {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json: unknown = await response.json();
      return json && typeof json === "object" && "result" in json
        ? (json as CheckInResponse)
        : undefined;
    } catch {
      return undefined;
    }
  }

  function show(response: CheckInResponse | undefined) {
    const message =
      response && response.result !== "ready"
        ? checkInMessage(response, timezone)
        : CHECK_IN_FAILED;
    if (response?.result === "admitted") onAdmitted?.();
    // A buzz the helper notices without looking: one for in, a double for stop
    navigator.vibrate?.(message.tone === "ok" ? 100 : [200, 100, 200]);
    setState({ step: "result", message });
  }

  async function admit(code: string, count: number) {
    setState({ step: "checking" });
    show(await send({ code, count }));
  }

  // Look the ticket up first, so nobody is admitted before the helper says how many are here
  async function scanned(code: string) {
    setState({ step: "checking" });
    const response = await send({ code, preview: true });
    if (response?.result !== "ready") return show(response);

    const left = response.guest.admits - response.guest.admitted;
    if (left === 1) return admit(code, 1);
    setState({ step: "choose", code, guest: response.guest, count: left });
  }

  const scanNext = () => {
    setTyped("");
    setState({ step: "scanning" });
  };

  if (state.step === "result") {
    const { tone, title, detail } = state.message;
    return (
      <div
        role="alert"
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center px-6 text-center text-white ${
          tone === "ok" ? "bg-green-600" : "bg-red-600"
        }`}
      >
        <p className="text-6xl" aria-hidden="true">
          {tone === "ok" ? "✓" : "✕"}
        </p>
        <h2 className="mt-4 text-4xl font-bold">{title}</h2>
        <p className="mt-3 max-w-md text-lg">{detail}</p>
        <button
          onClick={scanNext}
          className="mt-10 w-full max-w-xs rounded-xl bg-white py-4 text-lg font-semibold text-gray-900"
          autoFocus
        >
          Scan next
        </button>
      </div>
    );
  }

  if (state.step === "checking") {
    return (
      <div className="flex flex-col items-center py-20 text-gray-600" aria-live="polite">
        <div className="mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-gray-900" />
        Checking…
      </div>
    );
  }

  if (state.step === "choose") {
    const { code, guest, count } = state;
    const left = guest.admits - guest.admitted;
    const setCount = (next: number) =>
      setState({ ...state, count: Math.min(left, Math.max(1, next)) });
    return (
      <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900">{guest.name}</h2>
        <p className="mt-1 text-gray-600">
          Admits {guest.admits}
          {guest.admitted > 0 && ` · ${guest.admitted} already in`}
        </p>
        <p className="mt-6 font-medium text-gray-900">How many are coming in now?</p>
        <div className="mt-3 flex items-center justify-center gap-6">
          <StepButton label="One fewer" onClick={() => setCount(count - 1)} disabled={count <= 1}>
            −
          </StepButton>
          <span className="w-12 text-4xl font-bold text-gray-900" aria-live="polite">
            {count}
          </span>
          <StepButton label="One more" onClick={() => setCount(count + 1)} disabled={count >= left}>
            +
          </StepButton>
        </div>
        <button
          onClick={() => admit(code, count)}
          className="mt-6 w-full rounded-xl bg-green-600 py-4 text-lg font-semibold text-white"
        >
          Admit {count}
        </button>
        <button onClick={scanNext} className="mt-3 w-full py-2 text-gray-600">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {cameraUnavailable ? (
        <p className="rounded-xl bg-[#FFF4E5] p-4 text-sm text-[#8A5300]">
          The camera isn&apos;t available. Allow camera access in your browser settings and reload,
          or type the code below.
        </p>
      ) : (
        <QrCamera onScan={scanned} onUnavailable={() => setCameraUnavailable(true)} />
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (typed.trim()) void scanned(typed);
        }}
        className="rounded-2xl bg-white p-4 shadow-sm"
      >
        <label htmlFor="ticket-code" className="text-sm font-medium text-gray-700">
          Or paste the ticket link or code
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="ticket-code"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-[#C07A54] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            disabled={!typed.trim()}
          >
            Check
          </button>
        </div>
      </form>
    </div>
  );
}

function StepButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="h-14 w-14 rounded-full border border-gray-300 text-3xl text-gray-900 disabled:opacity-30"
    >
      {children}
    </button>
  );
}
