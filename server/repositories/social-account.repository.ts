import { prisma } from "@/server/lib/prisma"
import type { PlatformKey } from "@/server/services/social.types"

type PrismaModel = {
  upsert: (args: unknown) => Promise<unknown>
}

type PrismaClientLike = {
  socialAccount?: PrismaModel
}

export type UpsertSocialAccountInput = {
  platform: PlatformKey
  externalId: string
  username: string
  accountName: string
  profileImageUrl: string
  totalViews: number
}

export type SocialAccountRecord = {
  id: string
  platform: PlatformKey
  externalId: string
  username: string
  accountName: string
  profileImageUrl: string
  totalViews: number
}

export class SocialAccountRepository {
  constructor(private readonly prismaClient: PrismaClientLike = prisma as unknown as PrismaClientLike) {}

  async upsert(input: UpsertSocialAccountInput): Promise<SocialAccountRecord | null> {
    const socialAccountModel = this.prismaClient.socialAccount

    if (!socialAccountModel?.upsert) {
      return null
    }

    try {
      const record = (await socialAccountModel.upsert({
        where: {
          platform_externalId: {
            platform: input.platform,
            externalId: input.externalId,
          },
        },
        create: {
          platform: input.platform,
          externalId: input.externalId,
          username: input.username,
          accountName: input.accountName,
          profileImageUrl: input.profileImageUrl,
          totalViews: input.totalViews,
        },
        update: {
          username: input.username,
          accountName: input.accountName,
          profileImageUrl: input.profileImageUrl,
          totalViews: input.totalViews,
        },
      })) as Record<string, unknown>

      return {
        id: String(record.id ?? ""),
        platform: input.platform,
        externalId: input.externalId,
        username: input.username,
        accountName: input.accountName,
        profileImageUrl: input.profileImageUrl,
        totalViews: input.totalViews,
      }
    } catch {
      // Keep API responses resilient even if Prisma schema has not been provisioned yet.
      return null
    }
  }
}
