// ============================================================
// prismaClient.js — Singleton del cliente Prisma
// Garantiza una sola instancia del PrismaClient durante
// el ciclo de vida del servidor (patrón Singleton).
// ============================================================

import { PrismaClient } from "@prisma/client";

// En desarrollo, evitar múltiples instancias por hot-reload de nodemon
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development"
    ? ["query", "info", "warn", "error"]
    : ["error"],
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
