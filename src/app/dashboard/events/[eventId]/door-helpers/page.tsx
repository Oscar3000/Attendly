"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEventCard } from "@/components/admin/event-card-context";
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
    <main className="min-h-screen bg-[#FFF9F4] px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <Link
          href={`/dashboard/events/${eventId}/check-in`}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Check in guests
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">Door helpers</h1>
        <p className="mb-6 text-sm text-gray-600">
          Give each helper their own link. It opens a scanner that can only check guests in: no
          guest list, no dashboard, no sign-in. Revoke it any time; it stops working a day after the
          event.
        </p>

        <form onSubmit={create} className="rounded-2xl bg-white p-5 shadow-sm">
          <label htmlFor="helper-name" className="text-sm font-medium text-gray-700">
            Who is it for?
          </label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              id="helper-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ben, front gate"
              maxLength={80}
              className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2"
            />
            <button
              type="submit"
              disabled={creating || !name.trim()}
              className="rounded-lg bg-[#C07A54] px-4 py-2 font-medium text-white disabled:opacity-50"
            >
              {creating ? "Creating…" : "Create link"}
            </button>
          </div>
          {error && (
            <p role="alert" className="mt-2 text-sm text-[#D32F2F]">
              {error}
            </p>
          )}
        </form>

        {created && <NewLink {...created} onDone={() => setCreated(undefined)} />}

        <h2 className="mt-8 mb-3 text-lg font-semibold text-gray-900">Links</h2>
        {isLoading ? (
          <p className="text-gray-600">Loading…</p>
        ) : isError ? (
          <p className="text-[#D32F2F]">Couldn&apos;t load the links. Please reload.</p>
        ) : data?.doorLinks.length ? (
          <ul className="space-y-3">
            {data.doorLinks.map((link) => (
              <DoorLinkRow key={link.id} eventId={eventId} link={link} timezone={timezone} />
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">No links yet.</p>
        )}
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
    <div className="mt-4 rounded-2xl border-2 border-green-600 bg-white p-5">
      <p className="font-semibold text-gray-900">Link for {name}</p>
      <p className="mt-1 text-sm text-gray-600">
        Copy it now and send it to them. For security it won&apos;t be shown again; if it gets lost,
        revoke it and create a new one.
      </p>
      <input
        readOnly
        value={url}
        onFocus={(e) => e.target.select()}
        aria-label="Door helper link"
        className="mt-3 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 font-mono text-sm"
      />
      <div className="mt-3 flex items-center gap-3">
        <button onClick={copy} className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white">
          Copy link
        </button>
        <button onClick={onDone} className="px-2 py-2 text-gray-600">
          Done
        </button>
        <span role="status" className="text-sm text-gray-600">
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
  // Read the clock once, not on every render
  const [now] = useState(() => Date.now());
  const expired = new Date(link.expiresAt).getTime() <= now;
  const state = link.revokedAt
    ? `Revoked ${formatEventDateTime(new Date(link.revokedAt), timezone)}`
    : expired
      ? "Expired"
      : `Works until ${formatEventDateTime(new Date(link.expiresAt), timezone)}`;

  const confirmRevoke = () => {
    if (window.confirm(`Revoke ${link.name}'s link? It stops working immediately.`)) {
      void revoke({ eventId, id: link.id });
    }
  };

  return (
    <li className="flex flex-col gap-2 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-medium text-gray-900">{link.name}</p>
        <p className="text-sm text-gray-600">
          {state} · {link.admitted} {link.admitted === 1 ? "person" : "people"} checked in
        </p>
      </div>
      {!link.revokedAt && !expired && (
        <button
          onClick={confirmRevoke}
          disabled={isLoading}
          className="self-start rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 sm:self-auto"
        >
          {isLoading ? "Revoking…" : "Revoke"}
        </button>
      )}
    </li>
  );
}
