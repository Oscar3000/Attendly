"use client";

import { useState } from "react";
import { FormError } from "@/components/auth/auth-card";
import { fieldErrorsFrom } from "@/components/events/event-form";
import { Button, buttonClasses } from "@/components/ui/button";
import { SidePanel } from "@/components/ui/side-panel";
import { TextField } from "@/components/ui/text-field";
import { TicketCard } from "@/components/ui/ticket-card";
import { downloadQRCode, shareQRCodeAsImage } from "@/lib/invitation-image";
import { shareLinks } from "@/lib/share-links";
import type { CreateInviteForm, InviteDetails, RsvpStatus } from "@/lib/types";
import {
  useGetEventInvitationQuery,
  useUpdateEventInvitationMutation,
} from "@/store/eventInvitationApi";
import { useEventCard } from "./event-card-context";
import { PlusOnesField, StatusField } from "./guest-fields";

const STATUSES: readonly RsvpStatus[] = ["pending", "confirmed", "declined", "rescinded"];

interface GuestPanelProps {
  eventId: string;
  // The guest to show; the panel is closed without one
  guestId: string | null;
  onClose: () => void;
}

/**
 * One guest: their ticket, ways to send it, and their details to edit
 */
export default function GuestPanel({ eventId, guestId, onClose }: GuestPanelProps) {
  return (
    <SidePanel open={guestId !== null} onClose={onClose} label="Guest">
      {guestId && <GuestDetails eventId={eventId} guestId={guestId} />}
    </SidePanel>
  );
}

function GuestDetails({ eventId, guestId }: { eventId: string; guestId: string }) {
  const { data, isLoading } = useGetEventInvitationQuery({ eventId, id: guestId });
  const invitation = data?.invitation;

  if (isLoading) return <p className="text-slate">Loading…</p>;
  // Also a link to someone in another event, or a guest who's gone
  if (!invitation) return <p role="alert">We couldn&apos;t find this guest.</p>;

  return (
    <>
      <TicketCard
        notchColor="var(--color-paper)"
        stub={
          <div className="flex justify-center p-6">
            {/* eslint-disable-next-line @next/next/no-img-element -- a generated data: URL */}
            <img
              src={invitation.qrCode}
              alt={`QR code for ${invitation.name}`}
              width={180}
              height={180}
            />
          </div>
        }
      >
        <div className="p-6">
          <p className="font-mono text-[13px] text-slate">Admits {(invitation.plusOne ?? 0) + 1}</p>
          <h2 className="mt-1 font-display text-[clamp(1.75rem,7vw,2.125rem)] leading-tight font-extrabold tracking-tight [overflow-wrap:anywhere]">
            {invitation.name}
          </h2>
        </div>
      </TicketCard>
      <ShareActions invitation={invitation} />
      <GuestForm key={invitation.id} eventId={eventId} invitation={invitation} />
    </>
  );
}

function ShareActions({ invitation }: { invitation: InviteDetails }) {
  const event = useEventCard();
  const [copy, setCopy] = useState<"idle" | "copied" | "failed">("idle");
  const ticketUrl = invitation.ticketUrl ?? "";
  const { email, whatsApp } = shareLinks(
    invitation.eventType ?? "OTHER",
    invitation.name,
    ticketUrl,
  );
  // The guest and event drawn on the invitation image (T-408)
  const imageInput = event && {
    guest: { name: invitation.name, plusOne: invitation.plusOne ?? 0 },
    event,
  };
  const action = buttonClasses({ variant: "outline", size: "sm" });

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(ticketUrl);
      setCopy("copied");
    } catch {
      // Clipboard access can be refused (permissions, an insecure origin)
      setCopy("failed");
    }
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" size="sm" onClick={() => void copyLink()}>
          {copy === "copied" ? "Copied" : "Copy ticket link"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            void downloadQRCode(
              invitation.qrCode ?? "",
              `invitation-qr-${invitation.name}`,
              imageInput,
            )
          }
        >
          Download image
        </Button>
        <a href={whatsApp} target="_blank" rel="noopener" className={action}>
          WhatsApp
        </a>
        <a href={email} className={action}>
          Email
        </a>
        {imageInput && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => void shareQRCodeAsImage(invitation.qrCode ?? "", imageInput)}
          >
            Share image
          </Button>
        )}
        <a href={ticketUrl} target="_blank" rel="noopener" className={action}>
          Open ticket
        </a>
      </div>
      <p role="status" className="mt-2 text-sm text-danger empty:hidden">
        {copy === "failed" && "Couldn't copy. Open the ticket and copy its address."}
      </p>
    </div>
  );
}

function GuestForm({ eventId, invitation }: { eventId: string; invitation: InviteDetails }) {
  const [form, setForm] = useState<CreateInviteForm>({
    name: invitation.name,
    plusOne: invitation.plusOne ?? 0,
    status: invitation.status,
  });
  const [errors, setErrors] = useState<{ name?: string; form?: string }>({});
  const [saved, setSaved] = useState(false);
  const [statusChanged, setStatusChanged] = useState(false);
  const [update, { isLoading }] = useUpdateEventInvitationMutation();

  const set = (changes: Partial<CreateInviteForm>) => {
    setForm((prev) => ({ ...prev, ...changes }));
    setErrors({});
    setSaved(false);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setErrors({ name: "Enter a name" });
      return;
    }
    try {
      // Only a status the host chose: the guest may have checked in since this form opened, and
      // saving a stale "pending" would wipe that check-in
      const { status, ...details } = form;
      const data = statusChanged ? { ...details, status } : details;
      await update({ eventId, id: invitation.id, data }).unwrap();
      setSaved(true);
    } catch (error) {
      const name = fieldErrorsFrom<"name">(error)?.name;
      setErrors(name ? { name } : { form: "Couldn't save. Please try again." });
    }
  };

  return (
    <form onSubmit={(e) => void save(e)} noValidate className="border-t border-line pt-4">
      <TextField
        id="guest-name"
        label="Name"
        value={form.name}
        onChange={(e) => set({ name: e.target.value })}
        disabled={isLoading}
        error={errors.name}
      />

      <PlusOnesField value={form.plusOne} onChange={(plusOne) => set({ plusOne })} />
      <StatusField
        options={STATUSES}
        value={form.status}
        onChange={(status) => {
          set({ status });
          setStatusChanged(true);
        }}
      />

      <FormError message={errors.form} />
      <div className="flex items-center gap-3">
        <Button type="submit" loading={isLoading}>
          Save changes
        </Button>
        <span role="status" className="font-medium">
          {saved && "Saved"}
        </span>
      </div>
    </form>
  );
}
