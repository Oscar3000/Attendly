"use client";


import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/admin/dashboard-header";
import InvitationCounter from "@/components/admin/invitation-counter";
import StatusUpdates from "@/components/admin/status-updates";
import MetricsChart from "@/components/admin/metrics-chart";
import InvitationsTable from "@/components/admin/invitations-table";
import {
  DashboardMetrics,
  InvitationTableEntry,
} from "@/lib/types";
import { useGetAdminDataQuery, useGetStatusUpdatesQuery } from "@/store/invitationApi";



export default function AdminDashboard() {
  const router = useRouter();
  
  // RTK Query hooks
  const {
    data: adminData,
    isLoading: loading,
    isError,
  } = useGetAdminDataQuery();

  const {
    data: statusUpdatesData,
  } = useGetStatusUpdatesQuery();

  // Transform API data to dashboard format
  const metrics: DashboardMetrics = adminData ? {
    totalInvitations: adminData.metrics.totalInvitations,
    pendingCount: adminData.metrics.pendingRsvps,
    confirmedCount: adminData.metrics.confirmedRsvps,
    rescindedCount: adminData.metrics.declinedRsvps,
  } : {
    totalInvitations: 0,
    pendingCount: 0,
    confirmedCount: 0,
    rescindedCount: 0,
  };

  const invitations: InvitationTableEntry[] = adminData ? 
    adminData.invitations.map((inv) => ({
      ...inv,
      status: inv.status === 'declined' ? 'rescinded' : inv.status, // Map declined to rescinded for UI
    })) : [];

  const handleCreateInvite = () => {
    router.push("/admin/create-invite");
  };

  const handleEditInvitation = (id: string) => {
    router.push(`/admin/edit-invite/${id}`);
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
    <div className="min-h-screen p-6" style={{ backgroundColor: "#FFF9F4" }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <DashboardHeader onCreateInvite={handleCreateInvite} />

        {/* Top Row - Counter and Status Updates */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Left Column - Counter */}
          <div>
            <InvitationCounter totalInvitations={metrics.totalInvitations} />
          </div>

          {/* Right Column - Status Updates */}
          <div>
            <StatusUpdates updates={statusUpdatesData?.statusUpdates || []} />
          </div>
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
          />
        </div>
      </div>
    </div>
  );
}
