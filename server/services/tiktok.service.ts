import { PostRepository } from "@/server/repositories/post.repository"
import { SocialAccountRepository } from "@/server/repositories/social-account.repository"
import { TikTokProvider } from "@/server/services/providers/tiktok.provider"
import type { PlatformResult, SocialPlatformData } from "@/server/services/social.types"
import type { SocialPost, SocialProvider } from "@/types/social"

type TikTokServiceDependencies = {
  provider?: SocialProvider
  socialAccountRepository?: SocialAccountRepository
  postRepository?: PostRepository
  maxContentItems?: number
}

const DEFAULT_MAX_CONTENT_ITEMS = 5

function toSafeNumber(value: unknown): number {
  const normalized = typeof value === "string" ? Number(value) : value
  return typeof normalized === "number" && Number.isFinite(normalized) && normalized >= 0
    ? normalized
    : 0
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "string") {
    return error
  }

  return "Unexpected TikTok service error"
}

export class TikTokService {
  private readonly provider: SocialProvider
  private readonly socialAccountRepository: SocialAccountRepository
  private readonly postRepository: PostRepository
  private readonly maxContentItems: number

  constructor(dependencies: TikTokServiceDependencies = {}) {
    this.maxContentItems = dependencies.maxContentItems ?? DEFAULT_MAX_CONTENT_ITEMS
    this.provider = dependencies.provider ?? new TikTokProvider({ maxPosts: this.maxContentItems })
    this.socialAccountRepository =
      dependencies.socialAccountRepository ?? new SocialAccountRepository()
    this.postRepository = dependencies.postRepository ?? new PostRepository()
  }

  async fetchByQuery(query: string): Promise<PlatformResult> {
    try {
      const [profile, stats, posts] = await Promise.all([
        this.provider.getProfile(query),
        this.provider.getStats(query),
        this.provider.getPosts(query),
      ])
      const normalizedPosts = posts.slice(0, this.maxContentItems)
      const data = this.toSocialPlatformData(profile, stats.totalViews, normalizedPosts)

      await this.persistSnapshot(profile.externalId, data, normalizedPosts)

      return {
        platform: "tiktok",
        data,
      }
    } catch (error) {
      return {
        platform: "tiktok",
        data: null,
        error: toErrorMessage(error),
      }
    }
  }

  private toSocialPlatformData(
    profile: { accountName: string; username: string; profileImageUrl: string },
    totalViews: number,
    posts: SocialPost[]
  ): SocialPlatformData {
    const normalizedUsername = profile.username.startsWith("@") ? profile.username : `@${profile.username}`

    return {
      platform: "tiktok",
      accountName: profile.accountName,
      username: normalizedUsername,
      profileImageUrl: profile.profileImageUrl,
      totalViews: toSafeNumber(totalViews),
      latestContents: posts.map((post) => ({
        id: post.id,
        title: post.caption,
        thumbnailUrl: post.mediaUrl,
        publishedAt: post.createdAt.toISOString(),
        views: toSafeNumber(post.views || 0),
        url: post.url || `https://www.tiktok.com/@${normalizedUsername.replace(/^@/, "")}/video/${post.id}`,
      })),
    }
  }

  private async persistSnapshot(
    externalId: string,
    data: SocialPlatformData,
    posts: SocialPost[]
  ): Promise<void> {
    const savedAccount = await this.socialAccountRepository.upsertSocialAccount({
      platform: "tiktok",
      externalId,
      username: data.username,
      accountName: data.accountName,
      profileImageUrl: data.profileImageUrl,
      totalViews: data.totalViews,
    })

    if (!savedAccount?.id) {
      return
    }

    await this.postRepository.savePosts(savedAccount.id, posts)
  }
}

export const tiktokService = new TikTokService()
