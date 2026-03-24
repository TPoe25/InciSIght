// lib/prisma.ts

import { PrismaClient } from "@prisma/client"

// Export the PrismaClient instance
const globalForPrisma = global as any

// Create a new PrismaClient instance
export const prisma =
  globalForPrisma.prisma || new PrismaClient()

// Ensure the PrismaClient instance is not exposed globally if running in a serverless environment
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
