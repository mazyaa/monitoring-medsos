import { PostRepository } from "@/server/repositories/post.repository"
import { SocialAccountRepository } from "@/server/repositories/social-account.repository"
import type { PlatformResult, SocialPlatformData } from "@/server/services/social.types"
import { YouTubeProvider } from "@/server/services/providers/youtube.provider"
import type { SocialPost, SocialProvider } from "@/types/social"

type YouTubeServiceDependencies = {
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

  return "Unexpected YouTube service error"
}

export class YouTubeService {
  private readonly provider: SocialProvider
  private readonly socialAccountRepository: SocialAccountRepository
  private readonly postRepository: PostRepository
  private readonly maxContentItems: number

  constructor(dependencies: YouTubeServiceDependencies = {}) {
    this.maxContentItems = dependencies.maxContentItems ?? DEFAULT_MAX_CONTENT_ITEMS
    this.provider = dependencies.provider ?? new YouTubeProvider({ maxContentItems: this.maxContentItems })
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
        platform: "youtube",
        data,
      }
    } catch (error) {
      return {
        platform: "youtube",
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
    return {
      platform: "youtube",
      accountName: profile.accountName,
      username: profile.username,
      profileImageUrl: profile.profileImageUrl,
      totalViews: toSafeNumber(totalViews),
      latestContents: posts.map((post) => ({
        id: post.id,
        title: post.caption,
        thumbnailUrl: post.mediaUrl,
        publishedAt: post.createdAt.toISOString(),
        views: toSafeNumber(post.views || 0),
        url: post.url || `https://www.youtube.com/watch?v=${post.id}`,
      })),
    }
  }

  private async persistSnapshot(
    externalId: string,
    data: SocialPlatformData,
    posts: SocialPost[]
  ): Promise<void> {
    const savedAccount = await this.socialAccountRepository.upsertSocialAccount({
      platform: "youtube",
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

export const youtubeService = new YouTubeService()
