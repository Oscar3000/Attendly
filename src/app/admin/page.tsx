"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/admin/dashboard-header";
import InvitationCounter from "@/components/admin/invitation-counter";
import StatusUpdates from "@/components/admin/status-updates";
import MetricsChart from "@/components/admin/metrics-chart";
import InvitationsTable from "@/components/admin/invitations-table";
import {
  DashboardMetrics,
  StatusUpdate,
  InvitationTableEntry,
} from "@/lib/types";

// Create static timestamps to avoid impure Date.now() calls during render
const twoHoursAgo = new Date("2025-12-01T10:00:00Z");
const yesterday = new Date("2025-11-30T12:00:00Z");

export default function AdminDashboard() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalInvitations: 0,
    pendingCount: 0,
    confirmedCount: 0,
    rescindedCount: 0,
  });
  const [invitations, setInvitations] = useState<InvitationTableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock status updates (these would typically come from a real-time feed)
  const [statusUpdates] = useState<StatusUpdate[]>([
    {
      id: "1",
      name: "John Doe",
      status: "confirmed",
      timestamp: twoHoursAgo,
    },
    {
      id: "2",
      name: "John Doe",
      status: "rescinded",
      timestamp: yesterday,
    },
  ]);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/admin");

        if (!response.ok) {
          throw new Error("Failed to fetch admin data");
        }

        const data = await response.json();

        // Transform API metrics to dashboard metrics format
        const dashboardMetrics: DashboardMetrics = {
          totalInvitations: data.metrics.totalInvitations,
          pendingCount: data.metrics.pendingRsvps,
          confirmedCount: data.metrics.confirmedRsvps,
          rescindedCount: data.metrics.declinedRsvps,
        };

        // Transform API invitations to table format
        const tableInvitations: InvitationTableEntry[] = data.invitations.map(
          (inv: InvitationTableEntry) => ({
            id: inv.id,
            name: inv.name,
            status: inv.status === "declined" ? "rescinded" : inv.status, // Map declined to rescinded for UI
            createdAt: new Date(inv.createdAt),
          }),
        );

        setMetrics(dashboardMetrics);
        setInvitations(tableInvitations);
      } catch (err) {
        setError("Failed to load admin data");
        console.error("Error fetching admin data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

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

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#FFF9F4" }}
      >
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
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
            <StatusUpdates updates={statusUpdates} />
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
