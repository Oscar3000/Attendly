/**
 * Event-scoped endpoints (T-308), injected into invitationApi so they share its cache
 * Every endpoint takes eventId and calls /api/events/[eventId]/...; cache tags carry the event,
 * so a change in one event never refetches another event's data
 * The dashboard switches to these in T-309, which then removes the old admin endpoints
 */
import type {
  AdminMetrics,
  CreateInviteForm,
  InvitationTableEntry,
  InviteDetails,
  RsvpStatus,
  StatusUpdate,
} from "@/lib/types";
import { invitationApi } from "./invitationApi";

type EventArg = { eventId: string };
type InvitationArg = EventArg & { id: string };

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
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
};

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
  useGetEventInvitationsQuery,
  useGetEventMetricsQuery,
  useGetEventStatusUpdatesQuery,
  useGetEventInvitationQuery,
  useCreateEventInvitationMutation,
  useBulkCreateEventInvitationsMutation,
  useUpdateEventInvitationMutation,
  useUpdateEventRsvpStatusMutation,
  useDeleteEventInvitationMutation,
} = eventInvitationApi;
