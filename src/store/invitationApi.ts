/**
 * RTK Query API slice for managing invitation-related API calls
 */
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { InviteDetails, AdminMetrics, InvitationTableEntry, CreateInviteForm, RsvpStatus } from '@/lib/types';

export const invitationApi = createApi({
  reducerPath: 'invitationApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/',
  }),
  tagTypes: ['Invitation', 'AdminData'],
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

    // Create invitation
    createInvitation: builder.mutation<{ invitation: InviteDetails }, CreateInviteForm>({
      query: (invitation) => ({
        url: 'invitations',
        method: 'POST',
        body: invitation,
      }),
      invalidatesTags: ['Invitation', 'AdminData'],
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
      ],
    }),
  }),
});

export const {
  useGetInvitationQuery,
  useGetAllInvitationsQuery,
  useGetAdminDataQuery,
  useCreateInvitationMutation,
  useUpdateInvitationMutation,
  useUpdateRsvpStatusMutation,
  useDeleteInvitationMutation,
} = invitationApi;