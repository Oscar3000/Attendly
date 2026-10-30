/**
 * Event-scoped endpoints (T-308), injected into invitationApi so they share its cache
 * Every endpoint takes eventId and calls /api/events/[eventId]/...; cache tags carry the event,
 * so a change in one event never refetches another event's data
 * Used by the event dashboard under /dashboard/events/[eventId] (T-309), plus createEvent
 * for /dashboard/events/new (T-310), updateEvent for the settings page (T-402) and the door
 * helper links (T-506)
 */
import type {
  AdminMetrics,
  CreateInviteForm,
  InvitationTableEntry,
  InviteDetails,
  RsvpStatus,
  StatusUpdate,
} from "@/lib/types";
import type { FamilyLine, PaletteColor } from "@/lib/event-content";
import type { ThemeId } from "@/lib/themes";
import { invitationApi } from "./invitationApi";

type EventArg = { eventId: string };
type InvitationArg = EventArg & { id: string };

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// The fields a host fills in; dates are datetime-local values on the event's wall clock
export interface CreateEventForm {
  title: string;
  type: "WEDDING" | "BIRTHDAY" | "CORPORATE" | "OTHER";
  date: string;
  timezone: string;
  venueName: string;
  venueAddress: string;
  rsvpDeadline: string;
}

// Everything on the settings page; blank text clears a field
export interface EventSettingsForm extends CreateEventForm {
  hostNames: string;
  headline: string;
  tagline: string;
  dressCode: string;
  notes: string;
  familyLines: FamilyLine[];
  colorPalette: PaletteColor[];
  theme: ThemeId;
}

export interface BulkCreateResult {
  created: { row: number; name: string; id: string }[];
  failed: { row: number; name: string; error: string }[];
  summary: { total: number; createdCount: number; failedCount: number };
}

// Tags for one event's lists, metrics and status updates, plus one invitation
export const eventTags = {
  invitations: (eventId: string) => ({ type: "EventInvitations" as const, id: eventId }),
  metrics: (eventId: string) => ({ type: "EventMetrics" as const, id: eventId }),
  status: (eventId: string) => ({ type: "EventStatus" as const, id: eventId }),
  invitation: (id: string) => ({ type: "Invitation" as const, id }),
  doorLinks: (eventId: string) => ({ type: "DoorLinks" as const, id: eventId }),
};

// A door helper's check-in link (T-506), as the API returns it
export interface DoorLink {
  id: string;
  name: string;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
  // People it has checked in
  admitted: number;
}

// What a write in an event makes stale: that event's list, metrics and status updates,
// and the invitation itself when there is one
export function staleAfterWrite(eventId: string, invitationId?: string) {
  return [
    eventTags.invitations(eventId),
    eventTags.metrics(eventId),
    eventTags.status(eventId),
    ...(invitationId ? [eventTags.invitation(invitationId)] : []),
  ];
}

const base = (eventId: string) => `events/${encodeURIComponent(eventId)}`;

export const eventInvitationApi = invitationApi.injectEndpoints({
  endpoints: (builder) => ({
    // The events list is server-rendered, so nothing in this cache needs invalidating
    createEvent: builder.mutation<{ event: { id: string; slug: string } }, CreateEventForm>({
      query: (body) => ({ url: "events", method: "POST", body }),
    }),

    // Invitations show the event's date and venue, so cached invitations are refetched
    updateEvent: builder.mutation<
      { event: { id: string } },
      EventArg & { settings: EventSettingsForm }
    >({
      query: ({ eventId, settings }) => ({ url: base(eventId), method: "PUT", body: settings }),
      invalidatesTags: (_result, _error, { eventId }) => [
        eventTags.invitations(eventId),
        "Invitation",
      ],
    }),

    // The cover image (T-406): a multipart upload, re-encoded server-side
    uploadEventCover: builder.mutation<{ coverImageUrl: string }, EventArg & { file: File }>({
      query: ({ eventId, file }) => {
        const body = new FormData();
        body.set("file", file);
        return { url: `${base(eventId)}/cover`, method: "POST", body };
      },
    }),

    removeEventCover: builder.mutation<{ coverImageUrl: null }, EventArg>({
      query: ({ eventId }) => ({ url: `${base(eventId)}/cover`, method: "DELETE" }),
    }),

    // Paginated invitation list for the dashboard table
    getEventInvitations: builder.query<
      { invitations: InvitationTableEntry[]; pagination: Pagination },
      EventArg & { page?: number; limit?: number; search?: string }
    >({
      query: ({ eventId, page = 1, limit = 10, search = "" }) => {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search) params.set("search", search);
        return `${base(eventId)}/invitations?${params.toString()}`;
      },
      providesTags: (result, _error, { eventId }) => [
        eventTags.invitations(eventId),
        ...(result?.invitations ?? []).map((invitation) => eventTags.invitation(invitation.id)),
      ],
    }),

    getEventMetrics: builder.query<{ metrics: AdminMetrics }, string>({
      query: (eventId) => `${base(eventId)}/metrics`,
      providesTags: (_result, _error, eventId) => [eventTags.metrics(eventId)],
    }),

    getEventStatusUpdates: builder.query<{ statusUpdates: StatusUpdate[] }, string>({
      query: (eventId) => `${base(eventId)}/status`,
      providesTags: (_result, _error, eventId) => [eventTags.status(eventId)],
    }),

    getEventInvitation: builder.query<{ invitation: InviteDetails }, InvitationArg>({
      query: ({ eventId, id }) => `${base(eventId)}/invitations/${encodeURIComponent(id)}`,
      providesTags: (_result, _error, { id }) => [eventTags.invitation(id)],
    }),

    createEventInvitation: builder.mutation<
      { invitation: InviteDetails },
      EventArg & { invitation: CreateInviteForm }
    >({
      query: ({ eventId, invitation }) => ({
        url: `${base(eventId)}/invitations`,
        method: "POST",
        body: invitation,
      }),
      invalidatesTags: (_result, _error, { eventId }) => staleAfterWrite(eventId),
    }),

    bulkCreateEventInvitations: builder.mutation<
      BulkCreateResult,
      EventArg & { status?: RsvpStatus; rows: { name: string; plusOne?: number }[] }
    >({
      query: ({ eventId, ...body }) => ({
        url: `${base(eventId)}/invitations/bulk`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { eventId }) => staleAfterWrite(eventId),
    }),

    updateEventInvitation: builder.mutation<
      { invitation: InviteDetails },
      InvitationArg & { data: Partial<CreateInviteForm> }
    >({
      query: ({ eventId, id, data }) => ({
        url: `${base(eventId)}/invitations/${encodeURIComponent(id)}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_result, _error, { eventId, id }) => staleAfterWrite(eventId, id),
    }),

    updateEventRsvpStatus: builder.mutation<
      { invitation: InviteDetails },
      InvitationArg & { status: RsvpStatus }
    >({
      query: ({ eventId, id, status }) => ({
        url: `${base(eventId)}/invitations/${encodeURIComponent(id)}`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (_result, _error, { eventId, id }) => staleAfterWrite(eventId, id),
    }),

    // Door helper links (T-506). Creating one returns its URL, which can't be fetched again
    getDoorLinks: builder.query<{ doorLinks: DoorLink[] }, string>({
      query: (eventId) => `${base(eventId)}/door-links`,
      providesTags: (_result, _error, eventId) => [eventTags.doorLinks(eventId)],
    }),

    createDoorLink: builder.mutation<
      { doorLink: DoorLink; url: string },
      EventArg & { name: string }
    >({
      query: ({ eventId, name }) => ({
        url: `${base(eventId)}/door-links`,
        method: "POST",
        body: { name },
      }),
      invalidatesTags: (_result, _error, { eventId }) => [eventTags.doorLinks(eventId)],
    }),

    revokeDoorLink: builder.mutation<{ doorLink: DoorLink }, EventArg & { id: string }>({
      query: ({ eventId, id }) => ({
        url: `${base(eventId)}/door-links/${encodeURIComponent(id)}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { eventId }) => [eventTags.doorLinks(eventId)],
    }),

    deleteEventInvitation: builder.mutation<{ message: string }, InvitationArg>({
      query: ({ eventId, id }) => ({
        url: `${base(eventId)}/invitations/${encodeURIComponent(id)}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { eventId, id }) => staleAfterWrite(eventId, id),
    }),
  }),
});

export const {
  useCreateEventMutation,
  useUpdateEventMutation,
  useUploadEventCoverMutation,
  useRemoveEventCoverMutation,
  useGetEventInvitationsQuery,
  useGetEventMetricsQuery,
  useGetEventStatusUpdatesQuery,
  useGetEventInvitationQuery,
  useCreateEventInvitationMutation,
  useBulkCreateEventInvitationsMutation,
  useUpdateEventInvitationMutation,
  useUpdateEventRsvpStatusMutation,
  useDeleteEventInvitationMutation,
  useGetDoorLinksQuery,
  useCreateDoorLinkMutation,
  useRevokeDoorLinkMutation,
} = eventInvitationApi;
