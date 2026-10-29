/**
 * Metrics repository
 * Dashboard aggregates and recent activity, always for one event (T-306)
 */
import "server-only";
import { prisma } from "@/server/db/client";
import type { AdminMetrics, StatusUpdate, PrismaRsvpStatus, StatusUpdateSelect } from "@/lib/types";
import { convertPrismaStatus } from "@/lib/utils";

export const metricsRepo = {
  // Get an event's metrics
  async getAdminMetrics(eventId: string): Promise<AdminMetrics> {
    const [total, confirmed, pending, declined, plusOneAgg] = await Promise.all([
      prisma.invitation.count({ where: { eventId } }),
      prisma.invitation.count({ where: { eventId, status: "CONFIRMED" } }),
      prisma.invitation.count({ where: { eventId, status: "PENDING" } }),
      prisma.invitation.count({ where: { eventId, status: "DECLINED" } }),
      prisma.invitation.aggregate({ where: { eventId }, _sum: { plusOne: true } }),
    ]);

    const totalPlusOnes = plusOneAgg._sum.plusOne ?? 0;

    return {
      totalInvitations: total,
      totalGuests: total + totalPlusOnes,
      confirmedRsvps: confirmed,
      pendingRsvps: pending,
      declinedRsvps: declined,
      attendanceRate: total > 0 ? Math.round((confirmed / total) * 100) : 0,
    };
  },

  // Get an event's recent status updates (last 5 invitations with recent updates)
  async getRecentStatusUpdates(eventId: string): Promise<StatusUpdate[]> {
    const recentUpdates = await prisma.invitation.findMany({
      where: { eventId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        status: true,
        updatedAt: true,
      },
    });

    return recentUpdates.map((invitation: StatusUpdateSelect) => ({
      id: invitation.id,
      name: invitation.name,
      status: convertPrismaStatus(invitation.status as PrismaRsvpStatus),
      timestamp: invitation.updatedAt,
    }));
  },
};
