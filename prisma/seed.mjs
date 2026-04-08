import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"

const databaseUrl = process.env.DATABASE_URL || process.env.DIRECT_URL

if (!databaseUrl) {
  throw new Error("Missing DIRECT_URL or DATABASE_URL environment variable")
}

const adapter = new PrismaPg(
  new Pool({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false,
    },
  })
)

const prisma = new PrismaClient({ adapter })

async function ensureSupabaseMigrationTable() {
  await prisma.$executeRawUnsafe('CREATE SCHEMA IF NOT EXISTS "supabase_migrations";')

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "supabase_migrations"."schema_migrations" (
      "version" TEXT PRIMARY KEY,
      "name" TEXT,
      "statements" TEXT[],
      "inserted_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)
}

async function ensureSchema() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "social_accounts" (
      "id" TEXT PRIMARY KEY,
      "platform" TEXT NOT NULL,
      "externalId" TEXT NOT NULL,
      "username" TEXT NOT NULL,
      "accountName" TEXT NOT NULL,
      "profileImageUrl" TEXT NOT NULL,
      "totalViews" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `)

  await prisma.$executeRawUnsafe(
    'CREATE UNIQUE INDEX IF NOT EXISTS "social_accounts_platform_externalId_key" ON "social_accounts" ("platform", "externalId");'
  )
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "social_accounts_platform_idx" ON "social_accounts" ("platform");'
  )

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "posts" (
      "id" TEXT PRIMARY KEY,
      "socialAccountId" TEXT NOT NULL,
      "externalId" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "thumbnailUrl" TEXT NOT NULL,
      "publishedAt" TIMESTAMP(3) NOT NULL,
      "views" INTEGER NOT NULL DEFAULT 0,
      "url" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "posts_socialAccountId_fkey"
        FOREIGN KEY ("socialAccountId") REFERENCES "social_accounts" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    );
  `)

  await prisma.$executeRawUnsafe(
    'CREATE UNIQUE INDEX IF NOT EXISTS "posts_socialAccountId_externalId_key" ON "posts" ("socialAccountId", "externalId");'
  )
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "posts_socialAccountId_idx" ON "posts" ("socialAccountId");'
  )
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "posts_publishedAt_idx" ON "posts" ("publishedAt");'
  )
}

function makePosts(platform, username, count) {
  const now = Date.now()

  return Array.from({ length: count }, (_, index) => {
    const ordinal = index + 1

    return {
      externalId: `${platform}-${username}-${ordinal}`,
      title: `${platform.toUpperCase()} sample content #${ordinal}`,
      thumbnailUrl: `https://placehold.co/320x180?text=${platform}+${ordinal}`,
      publishedAt: new Date(now - index * 86400000),
      views: 1000 * ordinal,
      url:
        platform === "youtube"
          ? `https://www.youtube.com/watch?v=${platform}${ordinal}`
          : platform === "instagram"
            ? `https://www.instagram.com/p/${platform}${ordinal}/`
            : `https://www.tiktok.com/@${username}/video/${platform}${ordinal}`,
    }
  })
}

async function seedAccount({
  platform,
  externalId,
  username,
  accountName,
  profileImageUrl,
  totalViews,
  postCount,
}) {
  const account = await prisma.socialAccount.upsert({
    where: {
      platform_externalId: {
        platform,
        externalId,
      },
    },
    update: {
      username,
      accountName,
      profileImageUrl,
      totalViews,
    },
    create: {
      platform,
      externalId,
      username,
      accountName,
      profileImageUrl,
      totalViews,
    },
  })

  await prisma.post.deleteMany({
    where: { socialAccountId: account.id },
  })

  await prisma.post.createMany({
    data: makePosts(platform, username, postCount).map((post) => ({
      socialAccountId: account.id,
      externalId: post.externalId,
      title: post.title,
      thumbnailUrl: post.thumbnailUrl,
      publishedAt: post.publishedAt,
      views: post.views,
      url: post.url,
    })),
  })
}

async function main() {
  await ensureSupabaseMigrationTable()
  await ensureSchema()

  await seedAccount({
    platform: "youtube",
    externalId: "UC_SAMPLE_YT",
    username: "sample-youtube",
    accountName: "Sample YouTube Channel",
    profileImageUrl: "https://placehold.co/80x80?text=YT",
    totalViews: 150000,
    postCount: 5,
  })

  await seedAccount({
    platform: "instagram",
    externalId: "IG_SAMPLE_01",
    username: "sample.instagram",
    accountName: "Sample Instagram Account",
    profileImageUrl: "https://placehold.co/80x80?text=IG",
    totalViews: 64000,
    postCount: 4,
  })

  await seedAccount({
    platform: "tiktok",
    externalId: "TT_SAMPLE_01",
    username: "sample.tiktok",
    accountName: "Sample TikTok Creator",
    profileImageUrl: "https://placehold.co/80x80?text=TT",
    totalViews: 89000,
    postCount: 4,
  })

  console.log("Seed completed successfully")
}

main()
  .catch((error) => {
    console.error("Seed failed", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
