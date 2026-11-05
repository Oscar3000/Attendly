"use client";

import { useState } from "react";
import {
  CHECK_IN_FAILED,
  checkInMessage,
  type CheckInGuest,
  type CheckInMessage,
  type CheckInResponse,
} from "@/lib/check-in";
import { Button } from "@/components/ui/button";
import { CheckInResult } from "./check-in-result";
import { QrCamera } from "./qr-camera";
import { useLetInCount } from "./use-let-in-count";

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
  // Above the title: who is scanning, or what the page is
  label: string;
  title: string;
  // A link back to where the scanner was opened from
  back?: React.ReactNode;
  // Below the scanner
  footer?: React.ReactNode;
  onAdmitted?: () => void;
}

/**
 * Door check-in (T-505): scan a guest's QR code (or type it), choose how many people are
 * coming in when the invitation admits more than one, then a full-screen lime or red answer
 */
export function CheckInFlow({
  endpoint,
  timezone,
  label,
  title,
  back,
  footer,
  onAdmitted,
}: CheckInFlowProps) {
  const [state, setState] = useState<Step>({ step: "scanning" });
  const [cameraUnavailable, setCameraUnavailable] = useState(false);
  const [typed, setTyped] = useState("");
  const [letIn, addLetIn] = useLetInCount(`let-in:${endpoint}`);

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
    if (response?.result === "admitted") {
      addLetIn(response.count);
      onAdmitted?.();
    }
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
    const { tone } = state.message;
    return (
      <CheckInResult message={state.message}>
        <Button
          onClick={scanNext}
          variant={tone === "ok" ? "secondary" : "light"}
          size="lg"
          className="mt-8 w-full"
          autoFocus
        >
          Scan next
        </Button>
      </CheckInResult>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col bg-ink text-paper">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 p-5">
        {back}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[13px] text-mist">{label}</p>
            <h1 className="mt-0.5 font-display text-[28px] leading-tight font-extrabold tracking-tight break-words">
              {title}
            </h1>
          </div>
          <p className="shrink-0 font-mono text-[13px] text-lime">{letIn} let in</p>
        </div>

        {state.step === "checking" && (
          <div
            className="flex flex-1 flex-col items-center justify-center gap-4 text-mist"
            aria-live="polite"
          >
            <span className="size-11 animate-spin rounded-full border-4 border-graphite border-t-lime" />
            Checking…
          </div>
        )}

        {state.step === "choose" && (
          <ChooseCount
            guest={state.guest}
            count={state.count}
            onChange={(count) => setState({ ...state, count })}
            onAdmit={() => admit(state.code, state.count)}
            onCancel={scanNext}
          />
        )}

        {state.step === "scanning" && (
          <>
            {cameraUnavailable ? (
              <p className="rounded-2xl bg-graphite p-4 text-sm">
                The camera isn&apos;t available. Allow camera access in your browser settings and
                reload, or type the code below.
              </p>
            ) : (
              <QrCamera onScan={scanned} onUnavailable={() => setCameraUnavailable(true)} />
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (typed.trim()) void scanned(typed);
              }}
            >
              <label htmlFor="ticket-code" className="text-sm text-mist">
                Or paste the ticket link or code
              </label>
              <div className="mt-1.5 flex gap-2">
                <input
                  id="ticket-code"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  autoComplete="off"
                  className="min-h-13 min-w-0 flex-1 rounded-[14px] border-[1.5px] border-mist bg-transparent px-4 text-paper"
                />
                <Button type="submit" variant="light" disabled={!typed.trim()}>
                  Check
                </Button>
              </div>
            </form>
            {footer}
          </>
        )}
      </div>
    </main>
  );
}

function ChooseCount({
  guest,
  count,
  onChange,
  onAdmit,
  onCancel,
}: {
  guest: CheckInGuest;
  count: number;
  onChange: (count: number) => void;
  onAdmit: () => void;
  onCancel: () => void;
}) {
  const left = guest.admits - guest.admitted;
  const setCount = (next: number) => onChange(Math.min(left, Math.max(1, next)));
  return (
    <div className="flex flex-1 flex-col justify-center gap-7 text-center">
      <div>
        <p className="font-mono text-[13px] text-mist">
          Admits {guest.admits}
          {guest.admitted > 0 && ` · ${guest.admitted} already in`}
        </p>
        <h2 className="mt-1 font-display text-[clamp(1.75rem,8vw,2.5rem)] leading-[1.05] font-extrabold tracking-tight [overflow-wrap:anywhere]">
          {guest.name}
        </h2>
        <p className="mt-2 text-lg text-mist">How many are coming in now?</p>
      </div>
      <div className="flex items-center justify-center gap-6">
        <StepButton label="One fewer" onClick={() => setCount(count - 1)} disabled={count <= 1}>
          −
        </StepButton>
        <span
          className="min-w-22 font-display text-8xl leading-none font-extrabold"
          aria-live="polite"
        >
          {count}
        </span>
        <StepButton label="One more" onClick={() => setCount(count + 1)} disabled={count >= left}>
          +
        </StepButton>
      </div>
      <div className="flex flex-col gap-2">
        <Button onClick={onAdmit} variant="admit" size="lg">
          Admit {count}
        </Button>
        <Button onClick={onCancel} variant="ghost">
          Cancel
        </Button>
      </div>
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
      className="size-18 rounded-full border-2 border-paper text-[32px] text-paper disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}
