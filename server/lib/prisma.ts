import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"

declare global {
  var prismaGlobal: PrismaClient | undefined
  var pgPoolGlobal: Pool | undefined
}

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error("Missing DATABASE_URL environment variable")
}

const pgPool =
  globalThis.pgPoolGlobal ??
  new Pool({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false,
    },
  })

if (process.env.NODE_ENV !== "production") {
  globalThis.pgPoolGlobal = pgPool
}

const adapter = new PrismaPg(pgPool)

const prismaClient =
  globalThis.prismaGlobal ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prismaClient
}

export const prisma = prismaClient
