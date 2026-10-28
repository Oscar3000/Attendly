/**
 * Prisma client singleton
 * Server-only: importing this from a client component fails the build
 */
import "server-only";
import { PrismaClient } from "@prisma/client";

// Global type for Prisma singleton
declare global {
  var prisma: PrismaClient | undefined;
}

// Singleton pattern for Prisma client
let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  // Prevent multiple instances during development
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

export { prisma };
