"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardHeader from "@/components/admin/dashboard-header";
import InvitationCounter from "@/components/admin/invitation-counter";
import StatusUpdates from "@/components/admin/status-updates";
import MetricsChart from "@/components/admin/metrics-chart";
import InvitationsTable from "@/components/admin/invitations-table";
import CheckInPanel from "@/components/admin/check-in-panel";
import { DashboardMetrics, InvitationTableEntry } from "@/lib/types";
import {
  useGetEventInvitationsQuery,
  useGetEventMetricsQuery,
  useGetEventStatusUpdatesQuery,
} from "@/store/eventInvitationApi";

export default function EventDashboard() {
  const router = useRouter();
  const { eventId } = useParams<{ eventId: string }>();
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const limit = 10;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  // RTK Query hooks, all scoped to this event
  const {
    data: listData,
    isLoading: listLoading,
    isError: listError,
  } = useGetEventInvitationsQuery({ eventId, page: currentPage, limit, search: debouncedSearch });
  const {
    data: metricsData,
    isLoading: metricsLoading,
    isError: metricsError,
  } = useGetEventMetricsQuery(eventId);
  const { data: statusUpdatesData } = useGetEventStatusUpdatesQuery(eventId);
  const loading = listLoading || metricsLoading;
  const isError = listError || metricsError;

  // Transform API data to dashboard format
  const metrics: DashboardMetrics = metricsData
    ? {
        totalInvitations: metricsData.metrics.totalInvitations,
        totalGuests: metricsData.metrics.totalGuests,
        pendingCount: metricsData.metrics.pendingRsvps,
        confirmedCount: metricsData.metrics.confirmedRsvps,
        rescindedCount: metricsData.metrics.declinedRsvps,
      }
    : {
        totalInvitations: 0,
        totalGuests: 0,
        pendingCount: 0,
        confirmedCount: 0,
        rescindedCount: 0,
      };

  const invitations: InvitationTableEntry[] = listData
    ? listData.invitations.map((inv) => ({
        ...inv,
        status: inv.status === "declined" ? "rescinded" : inv.status, // Map declined to rescinded for UI
      }))
    : [];

  const handleCreateInvite = () => {
    router.push(`/dashboard/events/${eventId}/create-invite`);
  };

  const handleEditInvitation = (id: string) => {
    router.push(`/dashboard/events/${eventId}/edit-invite/${id}`);
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#FFF9F4" }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#FFF9F4" }}
      >
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load admin data</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-4 sm:p-6" style={{ backgroundColor: "#FFF9F4" }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <DashboardHeader eventId={eventId} onCreateInvite={handleCreateInvite} />

        {/* Top Row - Counter and Status Updates */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Left Column - Counter */}
          <div>
            <InvitationCounter
              totalInvitations={metrics.totalInvitations}
              totalGuests={metrics.totalGuests}
            />
          </div>

          {/* Right Column - Status Updates */}
          <div>
            <StatusUpdates updates={statusUpdatesData?.statusUpdates || []} />
          </div>
        </div>

        {/* Door check-ins (T-509) */}
        <div className="mb-6">
          <CheckInPanel eventId={eventId} />
        </div>

        {/* Middle Row - Metrics Chart */}
        <div className="mb-6">
          <MetricsChart metrics={metrics} />
        </div>

        {/* Bottom Row - Invitations Table */}
        <div>
          <InvitationsTable
            invitations={invitations}
            onEdit={handleEditInvitation}
            pagination={listData?.pagination}
            onPageChange={setCurrentPage}
            search={search}
            onSearchChange={handleSearchChange}
          />
        </div>
      </div>
    </div>
  );
}
