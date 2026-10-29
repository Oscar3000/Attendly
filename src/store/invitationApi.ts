/**
 * RTK Query API slice for managing invitation-related API calls
 * The dashboard's event-scoped endpoints are injected from eventInvitationApi.ts (T-308).
 * Only the PIN guest page uses the two endpoints below, until per-invitation links (T-503)
 */
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { InviteDetails, RsvpStatus } from "@/lib/types";

export const invitationApi = createApi({
  reducerPath: "invitationApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/",
  }),
  // Event* tags are per event (id = eventId), used by eventInvitationApi.ts
  tagTypes: ["Invitation", "EventInvitations", "EventMetrics", "EventStatus"],
  endpoints: (builder) => ({
    // Get a single invitation (guest)
    getInvitation: builder.query<{ invitation: InviteDetails }, string>({
      query: (id) => `invitations/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Invitation", id }],
    }),

    // Update RSVP status (guest)
    updateRsvpStatus: builder.mutation<
      { invitation: InviteDetails },
      { id: string; status: RsvpStatus }
    >({
      query: ({ id, status }) => ({
        url: `invitations/${id}`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Invitation", id }],
    }),
  }),
});

export const { useGetInvitationQuery, useUpdateRsvpStatusMutation } = invitationApi;
