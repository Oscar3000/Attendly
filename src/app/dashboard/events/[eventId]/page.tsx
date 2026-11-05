"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import InvitationsTable from "@/components/admin/invitations-table";
import CheckInPanel from "@/components/admin/check-in-panel";
import RepliesCard, { type ReplyGroup } from "@/components/admin/replies-card";
import { Button } from "@/components/ui/button";
import { DashboardMetrics, InvitationTableEntry } from "@/lib/types";
import { useGetEventInvitationsQuery, useGetEventMetricsQuery } from "@/store/eventInvitationApi";

const GROUP_LABELS: Record<ReplyGroup, string> = {
  confirmed: "Confirmed",
  pending: "Pending",
  declined: "Declined",
};

export default function EventDashboard() {
  const router = useRouter();
  const { eventId } = useParams<{ eventId: string }>();
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [group, setGroup] = useState<ReplyGroup | null>(null);
  const limit = 10;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  // Choosing the selected group again clears it
  const handleSelectGroup = (next: ReplyGroup | null) => {
    setGroup(next === group ? null : next);
    setCurrentPage(1);
  };

  // RTK Query hooks, all scoped to this event
  const {
    data: listData,
    isLoading: listLoading,
    isError: listError,
    isFetching: listFetching,
  } = useGetEventInvitationsQuery({
    eventId,
    page: currentPage,
    limit,
    search: debouncedSearch,
    status: group ?? undefined,
  });
  const {
    data: metricsData,
    isLoading: metricsLoading,
    isError: metricsError,
  } = useGetEventMetricsQuery(eventId);
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

  const invitations: InvitationTableEntry[] = listData?.invitations ?? [];

  const handleEditInvitation = (id: string) => {
    router.push(`/dashboard/events/${eventId}/edit-invite/${id}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-slate">
        <span
          aria-hidden="true"
          className="size-11 animate-spin rounded-full border-4 border-sand border-t-ink"
        />
        Loading your event…
      </div>
    );
  }

  if (isError) {
    return (
      <div role="alert" className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <p>Couldn&apos;t load this event.</p>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="px-6 pt-6 pb-18">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <RepliesCard metrics={metrics} selected={group} onSelect={handleSelectGroup} />
          <CheckInPanel eventId={eventId} />
        </div>

        <InvitationsTable
          invitations={invitations}
          onEdit={handleEditInvitation}
          pagination={listData?.pagination}
          onPageChange={setCurrentPage}
          search={search}
          onSearchChange={handleSearchChange}
          filterLabel={group ? GROUP_LABELS[group] : undefined}
          onClearFilter={() => handleSelectGroup(null)}
          loading={listFetching}
        />
      </div>
    </div>
  );
}
