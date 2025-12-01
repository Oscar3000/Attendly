'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardHeader from '@/components/admin/dashboard-header';
import InvitationCounter from '@/components/admin/invitation-counter';
import StatusUpdates from '@/components/admin/status-updates';
import MetricsChart from '@/components/admin/metrics-chart';
import InvitationsTable from '@/components/admin/invitations-table';
import { DashboardMetrics, StatusUpdate, InvitationTableEntry } from '@/lib/types';

// Create static timestamps to avoid impure Date.now() calls during render
const twoHoursAgo = new Date('2025-12-01T10:00:00Z');
const yesterday = new Date('2025-11-30T12:00:00Z');

export default function AdminDashboard() {
  const router = useRouter();
  const [metrics] = useState<DashboardMetrics>({
    totalInvitations: 287,
    pendingCount: 160,
    confirmedCount: 110,
    rescindedCount: 60
  });

  const [statusUpdates] = useState<StatusUpdate[]>([
    {
      id: '1',
      guestName: 'John Doe',
      status: 'confirmed',
      timestamp: twoHoursAgo
    },
    {
      id: '2',
      guestName: 'John Doe',
      status: 'rescinded',
      timestamp: yesterday
    }
  ]);

  const [invitations] = useState<InvitationTableEntry[]>([
    {
      id: '1',
      name: 'Anna Smith',
      status: 'confirmed',
      email: 'anna@example.com',
      createdAt: new Date()
    },
    {
      id: '2',
      name: 'John Doe',
      status: 'pending',
      email: 'john@example.com',
      createdAt: new Date()
    },
    {
      id: '3',
      name: 'Jane Doe',
      status: 'rescinded',
      email: 'jane@example.com',
      createdAt: new Date()
    },
    {
      id: '4',
      name: 'Mark Spencer',
      status: 'pending',
      email: 'mark@example.com',
      createdAt: new Date()
    }
  ]);

  const handleCreateInvite = () => {
    router.push('/admin/create-invite');
  };

  const handleEditInvitation = (id: string) => {
    router.push(`/admin/edit-invite/${id}`);
  };

  return (
    <div 
      className="min-h-screen p-6"
      style={{ backgroundColor: '#FFF9F4' }}
    >
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