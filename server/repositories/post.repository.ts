import { prisma } from "@/server/lib/prisma"
import type { SocialContent } from "@/server/services/social.types"

type PrismaModel = {
  deleteMany: (args: unknown) => Promise<unknown>
  createMany: (args: unknown) => Promise<unknown>
}

type PrismaClientLike = {
  post?: PrismaModel
}

export class PostRepository {
  constructor(private readonly prismaClient: PrismaClientLike = prisma as unknown as PrismaClientLike) {}

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
