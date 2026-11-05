/**
 * Metrics repository
 * Dashboard aggregates, always for one event (T-306)
 */
import "server-only";
import { prisma } from "@/server/db/client";
import type { AdminMetrics } from "@/lib/types";

export const metricsRepo = {
  // Get an event's metrics
  async getAdminMetrics(eventId: string): Promise<AdminMetrics> {
    const [total, confirmed, pending, declined, plusOneAgg] = await Promise.all([
      prisma.invitation.count({ where: { eventId } }),
      prisma.invitation.count({ where: { eventId, status: "CONFIRMED" } }),
      prisma.invitation.count({ where: { eventId, status: "PENDING" } }),
      // A cancelled invitation isn't coming either, so the three counts add up to the total
      prisma.invitation.count({ where: { eventId, status: { in: ["DECLINED", "RESCINDED"] } } }),
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
};
