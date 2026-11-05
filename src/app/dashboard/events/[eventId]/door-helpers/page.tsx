"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useEventCard } from "@/components/admin/event-card-context";
import { Button } from "@/components/ui/button";
import { formatEventDateTime } from "@/lib/timezones";
import {
  useCreateDoorLinkMutation,
  useGetDoorLinksQuery,
  useRevokeDoorLinkMutation,
  type DoorLink,
} from "@/store/eventInvitationApi";

/**
 * Door helpers (T-506): check-in links for people scanning at the door, so the host doesn't
 * share their account. A link can only check guests in to this event; the host can revoke it
 * at any time, and it stops working a day after the event
 */
export default function DoorHelpersPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const timezone = useEventCard()?.timezone ?? "UTC";
  const { data, isLoading, isError } = useGetDoorLinksQuery(eventId);
  const [createDoorLink, { isLoading: creating }] = useCreateDoorLinkMutation();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  // The new link's URL; the API can't return it again, so it's only shown now
  const [created, setCreated] = useState<{ name: string; url: string } | undefined>();

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const { doorLink, url } = await createDoorLink({ eventId, name: name.trim() }).unwrap();
      setCreated({ name: doorLink.name, url });
      setName("");
    } catch {
      setError("Couldn't create the link. Please try again.");
    }
  };

  return (
    <main className="px-6 pt-6 pb-18">
      <div className="mx-auto flex max-w-[760px] flex-col gap-4">
        <p className="text-slate">
          Give each helper their own link. It opens a scanner that can only check guests in: no
          guest list, no dashboard, no sign-in. Revoke it any time; it stops working a day after the
          event.
        </p>

        <form onSubmit={(e) => void create(e)} className="rounded-3xl bg-card p-6">
          <label htmlFor="helper-name" className="mb-1.5 block text-[15px] font-semibold">
            Who is it for?
          </label>
          <div className="flex flex-wrap gap-3">
            <input
              id="helper-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ben, front gate"
              maxLength={80}
              aria-describedby={error ? "helper-error" : undefined}
              className="h-13 min-w-0 flex-[1_1_260px] rounded-[14px] border-[1.5px] border-line bg-card px-4"
            />
            <Button type="submit" loading={creating} disabled={!name.trim()}>
              {creating ? "Creating…" : "Create link"}
            </Button>
          </div>
          {error && (
            <p id="helper-error" role="alert" className="mt-2 text-sm text-danger">
              {error}
            </p>
          )}
        </form>

        {created && <NewLink {...created} onDone={() => setCreated(undefined)} />}

        <section className="rounded-3xl bg-card px-6 py-2">
          <h2 className="sr-only">Links</h2>
          {isLoading ? (
            <p className="py-4 text-slate">Loading…</p>
          ) : isError ? (
            <p className="py-4 text-danger">Couldn&apos;t load the links. Please reload.</p>
          ) : data?.doorLinks.length ? (
            <ul>
              {data.doorLinks.map((link) => (
                <DoorLinkRow key={link.id} eventId={eventId} link={link} timezone={timezone} />
              ))}
            </ul>
          ) : (
            <p className="py-4 text-slate">No links yet.</p>
          )}
        </section>
      </div>
    </main>
  );
}

// Shown once, right after creating: the only time the URL is available
function NewLink({ name, url, onDone }: { name: string; url: string; onDone: () => void }) {
  const [copied, setCopied] = useState<"idle" | "copied" | "failed">("idle");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied("copied");
    } catch {
      setCopied("failed");
    }
  };

  return (
    <div className="animate-pop rounded-3xl bg-lime p-6">
      <p className="font-semibold">Link for {name}</p>
      <p className="mt-1">
        Copy it now and send it to them. For security it won&apos;t be shown again; if it gets lost,
        revoke it and create a new one.
      </p>
      <input
        readOnly
        value={url}
        onFocus={(e) => e.target.select()}
        aria-label="Door helper link"
        className="mt-3 h-12 w-full rounded-xl bg-card px-3.5 font-mono text-sm"
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={() => void copy()}>
          Copy link
        </Button>
        <button type="button" onClick={onDone} className="min-h-11 px-2 font-semibold underline">
          Done
        </button>
        <span role="status" className="font-medium">
          {copied === "copied" && "Copied"}
          {copied === "failed" && "Couldn't copy; select the link and copy it"}
        </span>
      </div>
    </div>
  );
}

function DoorLinkRow({
  eventId,
  link,
  timezone,
}: {
  eventId: string;
  link: DoorLink;
  timezone: string;
}) {
  const [revoke, { isLoading }] = useRevokeDoorLinkMutation();
  const [failed, setFailed] = useState(false);
  // Read the clock once, not on every render
  const [now] = useState(() => Date.now());
  const expired = new Date(link.expiresAt).getTime() <= now;
  const state = link.revokedAt
    ? `Revoked ${formatEventDateTime(new Date(link.revokedAt), timezone)}`
    : expired
      ? "Expired"
      : `Works until ${formatEventDateTime(new Date(link.expiresAt), timezone)}`;

  // Unlike undoing a check-in, this can't be reversed, and the helper may be mid-shift
  const confirmRevoke = async () => {
    if (!window.confirm(`Revoke ${link.name}'s link? It stops working immediately.`)) return;
    setFailed(false);
    try {
      await revoke({ eventId, id: link.id }).unwrap();
    } catch {
      setFailed(true);
    }
  };

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 border-b border-sand py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="font-semibold break-words">{link.name}</p>
        <p className="font-mono text-[13px] text-slate">
          {state} · {link.admitted} {link.admitted === 1 ? "person" : "people"} checked in
        </p>
        {failed && (
          <p role="alert" className="mt-1 text-sm text-danger">
            Couldn&apos;t revoke the link. It still works. Please try again.
          </p>
        )}
      </div>
      {!link.revokedAt && !expired && (
        <Button
          variant="danger"
          size="sm"
          disabled={isLoading}
          aria-label={`Revoke ${link.name}'s link`}
          onClick={() => void confirmRevoke()}
        >
          {isLoading ? "Revoking…" : "Revoke"}
        </Button>
      )}
    </li>
  );
}
