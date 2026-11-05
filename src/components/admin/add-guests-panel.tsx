"use client";

import { useState } from "react";
import { FormError } from "@/components/auth/auth-card";
import { fieldErrorsFrom } from "@/components/events/event-form";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SidePanel } from "@/components/ui/side-panel";
import { TextField } from "@/components/ui/text-field";
import { parseGuestCsv } from "@/lib/guest-csv";
import type { CreateInviteForm, RsvpStatus } from "@/lib/types";
import {
  useBulkCreateEventInvitationsMutation,
  useCreateEventInvitationMutation,
  type BulkCreateResult,
} from "@/store/eventInvitationApi";
import { PlusOnesField, StatusField } from "./guest-fields";

// A new invitation can't start out cancelled
const NEW_GUEST_STATUSES: readonly RsvpStatus[] = ["pending", "confirmed", "declined"];

const MODES = [
  { value: "one", label: "One guest" },
  { value: "list", label: "A whole list" },
] as const;

type Mode = (typeof MODES)[number]["value"];

interface AddGuestsPanelProps {
  eventId: string;
  open: boolean;
  onClose: () => void;
  // One guest was added; shows them
  onCreated: (id: string) => void;
}

/**
 * Adding guests to an event, one at a time or from a CSV
 */
export default function AddGuestsPanel({ eventId, open, onClose, onCreated }: AddGuestsPanelProps) {
  return (
    <SidePanel open={open} onClose={onClose} label="Add guests">
      <AddGuests eventId={eventId} onClose={onClose} onCreated={onCreated} />
    </SidePanel>
  );
}

function AddGuests({ eventId, onClose, onCreated }: Omit<AddGuestsPanelProps, "open">) {
  const [mode, setMode] = useState<Mode>("one");

  return (
    <>
      <h2 className="font-display text-[34px] font-extrabold tracking-tight">Add guests</h2>
      <SegmentedControl
        label="How to add guests"
        options={MODES}
        value={mode}
        onChange={setMode}
        className="flex"
      />
      {mode === "one" ? (
        <OneGuest eventId={eventId} onCreated={onCreated} />
      ) : (
        <GuestList eventId={eventId} onClose={onClose} />
      )}
    </>
  );
}

function OneGuest({ eventId, onCreated }: Pick<AddGuestsPanelProps, "eventId" | "onCreated">) {
  const [form, setForm] = useState<CreateInviteForm>({ name: "", plusOne: 0, status: "pending" });
  const [errors, setErrors] = useState<{ name?: string; form?: string }>({});
  const [create, { isLoading }] = useCreateEventInvitationMutation();

  const set = (changes: Partial<CreateInviteForm>) => {
    setForm((prev) => ({ ...prev, ...changes }));
    setErrors({});
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setErrors({ name: "Enter a name" });
      return;
    }
    try {
      const { invitation } = await create({ eventId, invitation: form }).unwrap();
      onCreated(invitation.id);
    } catch (error) {
      const name = fieldErrorsFrom<"name">(error)?.name;
      setErrors(name ? { name } : { form: "Couldn't add this guest. Please try again." });
    }
  };

  return (
    <form onSubmit={(e) => void submit(e)} noValidate>
      <TextField
        id="new-guest-name"
        label="Name"
        placeholder="Enter name"
        value={form.name}
        onChange={(e) => set({ name: e.target.value })}
        disabled={isLoading}
        error={errors.name}
      />
      <PlusOnesField value={form.plusOne} onChange={(plusOne) => set({ plusOne })} />
      <StatusField
        options={NEW_GUEST_STATUSES}
        value={form.status}
        onChange={(status) => set({ status })}
      />
      <FormError message={errors.form} />
      <Button type="submit" size="lg" loading={isLoading} className="w-full">
        Create invitation
      </Button>
    </form>
  );
}

function GuestList({ eventId, onClose }: Pick<AddGuestsPanelProps, "eventId" | "onClose">) {
  const [csv, setCsv] = useState("");
  const [status, setStatus] = useState<RsvpStatus>("pending");
  const [result, setResult] = useState<BulkCreateResult | null>(null);
  const [failed, setFailed] = useState(false);
  const [bulkCreate, { isLoading }] = useBulkCreateEventInvitationsMutation();
  const { rows, errors } = parseGuestCsv(csv);

  const chooseFile = async (file: File | undefined) => {
    if (file) setCsv(await file.text());
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFailed(false);
    try {
      setResult(await bulkCreate({ eventId, status, rows }).unwrap());
    } catch {
      setFailed(true);
    }
  };

  if (result) {
    return (
      <ListResult
        result={result}
        onAddMore={() => {
          setCsv("");
          setStatus("pending");
          setResult(null);
        }}
        onClose={onClose}
      />
    );
  }

  return (
    <form onSubmit={(e) => void submit(e)} noValidate className="flex flex-col gap-4">
      <div>
        <label htmlFor="guest-csv" className="mb-1.5 block text-[15px] font-semibold">
          Paste a CSV
        </label>
        <textarea
          id="guest-csv"
          rows={6}
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          placeholder={"Ada Obi, 1\nBola Ade, 0"}
          aria-describedby="guest-csv-help"
          className="w-full resize-y rounded-[14px] border-2 border-dashed border-line bg-card px-4 py-3.5 font-mono text-[15px]"
        />
        <p id="guest-csv-help" className="mt-1.5 text-[15px] text-slate">
          One row per guest: name, then plus-ones (optional). A header row is optional. Wrap names
          containing commas in double quotes. Guests get your event&apos;s date and venue.
        </p>
      </div>

      <div>
        <label htmlFor="guest-file" className="mb-1.5 block text-[15px] font-semibold">
          Or choose a file
        </label>
        <input
          id="guest-file"
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => void chooseFile(e.target.files?.[0])}
          className="block w-full text-[15px] text-slate file:mr-3 file:min-h-11 file:cursor-pointer file:rounded-full file:border-0 file:bg-ink file:px-4 file:font-semibold file:text-paper"
        />
      </div>

      {errors.length > 0 && (
        <div role="status" className="rounded-[14px] bg-ember/15 p-3.5">
          <p className="mb-1 text-[15px] font-semibold">These rows will be skipped:</p>
          <ul className="max-h-32 list-disc overflow-y-auto pl-5 text-[15px]">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {rows.length > 0 && (
        <div>
          <p className="mb-1.5 font-mono text-[13px] text-slate">
            Preview: {rows.length} {rows.length === 1 ? "guest" : "guests"}
          </p>
          <ul className="flex max-h-60 flex-col gap-1 overflow-y-auto">
            {rows.map(({ name, plusOne }, i) => (
              <li
                key={`${name}-${i}`}
                className="flex animate-pop justify-between gap-3 rounded-xl bg-card px-3.5 py-2.5"
              >
                <span className="min-w-0 font-semibold break-words">{name}</span>
                <span className="shrink-0 font-mono text-sm text-slate">Admits {plusOne + 1}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <StatusField
        legend="Initial status"
        options={NEW_GUEST_STATUSES}
        value={status}
        onChange={setStatus}
      />
      <FormError message={failed ? "Couldn't add this list. Please try again." : undefined} />
      <Button type="submit" size="lg" loading={isLoading} disabled={rows.length === 0}>
        {rows.length > 0
          ? `Add ${rows.length} ${rows.length === 1 ? "guest" : "guests"}`
          : "Add guests"}
      </Button>
    </form>
  );
}

function ListResult({
  result,
  onAddMore,
  onClose,
}: {
  result: BulkCreateResult;
  onAddMore: () => void;
  onClose: () => void;
}) {
  const { summary, failed } = result;

  return (
    <div className="flex flex-col gap-4">
      <p role="status" className="rounded-[14px] bg-lime p-3.5 font-semibold">
        Created {summary.createdCount} of {summary.total}{" "}
        {summary.total === 1 ? "invitation" : "invitations"}.
      </p>
      {failed.length > 0 && (
        <div className="rounded-[14px] bg-danger/10 p-3.5 text-danger">
          <p className="mb-1 font-semibold">
            {failed.length} {failed.length === 1 ? "row" : "rows"} failed:
          </p>
          <ul className="max-h-40 list-disc overflow-y-auto pl-5 text-[15px]">
            {failed.map(({ row, name, error }) => (
              <li key={row}>
                Row {row} ({name || "no name"}): {error}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={onClose}>
          Done
        </Button>
        <Button variant="outline" onClick={onAddMore}>
          Add another list
        </Button>
      </div>
    </div>
  );
}
