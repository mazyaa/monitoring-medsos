import { prisma } from "@/server/lib/prisma"
import type { SocialContent } from "@/server/services/social.types"
import type { PlatformKey, SocialPost } from "@/types/social"

type PrismaModel = {
  deleteMany: (args: unknown) => Promise<unknown>
  createMany: (args: unknown) => Promise<unknown>
  findMany?: (args: unknown) => Promise<unknown>
}

type PrismaClientLike = {
  post?: PrismaModel
}

export class PostRepository {
  constructor(private readonly prismaClient: PrismaClientLike = prisma as unknown as PrismaClientLike) {}

  async savePosts(accountId: string, posts: SocialPost[]): Promise<void> {
    const postModel = this.prismaClient.post

    if (!postModel?.deleteMany || !postModel?.createMany) {
      return
    }

    try {
      await postModel.deleteMany({
        where: { socialAccountId: accountId },
      })

      if (posts.length === 0) {
        return
      }

      await postModel.createMany({
        data: posts.map((post) => ({
          socialAccountId: accountId,
          externalId: post.id,
          title: post.caption,
          thumbnailUrl: post.mediaUrl,
          publishedAt: post.createdAt,
          views: Number.isFinite(post.views || 0) ? Number(post.views || 0) : 0,
          url: post.url || "https://example.com",
        })),
      })
    } catch {
      // The repository intentionally fails softly until Prisma schema is fully available.
    }
  }

  async getPostsByPlatform(platform: PlatformKey): Promise<SocialPost[]> {
    const postModel = this.prismaClient.post

    if (!postModel?.findMany) {
      return []
    }

    try {
      const records = (await postModel.findMany({
        where: {
          socialAccount: {
            platform,
          },
        },
        orderBy: [{ publishedAt: "desc" }],
      })) as Array<Record<string, unknown>>

      return records.map((record) => ({
        id: String(record.externalId ?? record.id ?? ""),
        caption: String(record.title ?? "Untitled"),
        mediaUrl: String(record.thumbnailUrl ?? ""),
        platform,
        views:
          typeof record.views === "number"
            ? record.views
            : Number.isFinite(Number(record.views))
              ? Number(record.views)
              : 0,
        createdAt:
          record.publishedAt instanceof Date
            ? record.publishedAt
            : new Date(String(record.publishedAt ?? Date.now())),
        url: String(record.url ?? "https://example.com"),
      }))
    } catch {
      return []
    }
  }

  async replaceLatestByAccountId(accountId: string, posts: SocialContent[]): Promise<void> {
    const postModel = this.prismaClient.post

    if (!postModel?.deleteMany || !postModel?.createMany) {
      return
    }

    try {
      await postModel.deleteMany({
        where: { socialAccountId: accountId },
      })

      if (posts.length > 0) {
        await postModel.createMany({
          data: posts.map((post) => ({
            socialAccountId: accountId,
            externalId: post.id,
            title: post.title,
            thumbnailUrl: post.thumbnailUrl,
            publishedAt: new Date(post.publishedAt),
            views: post.views,
            url: post.url,
          })),
        })
      }
    } catch {
      // The repository intentionally fails softly until Prisma schema is fully available.
    }
  }
}
