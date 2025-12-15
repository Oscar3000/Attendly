/**
 * RTK Query API slice for managing invitation-related API calls
 */
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { InviteDetails, AdminMetrics, InvitationTableEntry, CreateInviteForm, RsvpStatus, StatusUpdate } from '@/lib/types';

export const invitationApi = createApi({
  reducerPath: 'invitationApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/',
  }),
  tagTypes: ['Invitation', 'AdminData', 'StatusUpdates'],
  endpoints: (builder) => ({
    // Get single invitation
    getInvitation: builder.query<{ invitation: InviteDetails }, string>({
      query: (id) => `invitations/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Invitation', id }],
    }),

    // Get all invitations (admin)
    getAllInvitations: builder.query<{ invitations: InviteDetails[] }, void>({
      query: () => 'invitations',
      providesTags: ['Invitation'],
    }),

    // Get admin dashboard data
    getAdminData: builder.query<{
      metrics: AdminMetrics;
      invitations: InvitationTableEntry[];
    }, void>({
      query: () => 'admin',
      providesTags: ['AdminData', 'Invitation'],
    }),

    // Get recent status updates
    getStatusUpdates: builder.query<{ statusUpdates: StatusUpdate[] }, void>({
      query: () => 'admin/status',
      providesTags: ['StatusUpdates'],
    }),

    // Create invitation
    createInvitation: builder.mutation<{ invitation: InviteDetails }, CreateInviteForm>({
      query: (invitation) => ({
        url: 'invitations',
        method: 'POST',
        body: invitation,
      }),
      invalidatesTags: ['Invitation', 'AdminData', 'StatusUpdates'],
    }),

    // Update invitation
    updateInvitation: builder.mutation<{ invitation: InviteDetails }, { id: string; data: Partial<CreateInviteForm> }>({
      query: ({ id, data }) => ({
        url: `invitations/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Invitation', id },
        'AdminData',
        'StatusUpdates',
      ],
    }),

    // Update RSVP status
    updateRsvpStatus: builder.mutation<{ invitation: InviteDetails }, { id: string; status: RsvpStatus }>({
      query: ({ id, status }) => ({
        url: `invitations/${id}`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Invitation', id },
        'AdminData',
        'StatusUpdates',
      ],
    }),

    // Delete invitation
    deleteInvitation: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `invitations/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Invitation', id },
        'AdminData',
        'StatusUpdates',
      ],
    }),
  }),
});

export const {
  useGetInvitationQuery,
  useGetAllInvitationsQuery,
  useGetAdminDataQuery,
  useGetStatusUpdatesQuery,
  useCreateInvitationMutation,
  useUpdateInvitationMutation,
  useUpdateRsvpStatusMutation,
  useDeleteInvitationMutation,
} = invitationApi;