/**
 * The RTK Query API slice: base URL and cache tags. Its endpoints are injected from
 * eventInvitationApi.ts (T-308), all scoped to one event
 */
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const invitationApi = createApi({
  reducerPath: "invitationApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/",
  }),
  // Event* tags are per event (id = eventId), used by eventInvitationApi.ts
  tagTypes: ["Invitation", "EventInvitations", "EventMetrics", "EventStatus", "DoorLinks"],
  endpoints: () => ({}),
});
