import { PostRepository } from "@/server/repositories/post.repository"
import { SocialAccountRepository } from "@/server/repositories/social-account.repository"
import { InstagramProvider } from "@/server/services/providers/instagram.provider"
import type { PlatformResult, SocialPlatformData } from "@/server/services/social.types"
import type { SocialPost, SocialProvider } from "@/types/social"

type InstagramServiceDependencies = {
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

  return "Unexpected Instagram service error"
}

export class InstagramService {
  private readonly provider: SocialProvider
  private readonly socialAccountRepository: SocialAccountRepository
  private readonly postRepository: PostRepository
  private readonly maxContentItems: number

  constructor(dependencies: InstagramServiceDependencies = {}) {
    this.maxContentItems = dependencies.maxContentItems ?? DEFAULT_MAX_CONTENT_ITEMS
    this.provider = dependencies.provider ?? new InstagramProvider({ maxPosts: this.maxContentItems })
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
        platform: "instagram",
        data,
      }
    } catch (error) {
      return {
        platform: "instagram",
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
      platform: "instagram",
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
        url: post.url || `https://www.instagram.com/p/${post.id}`,
      })),
    }
  }

  private async persistSnapshot(
    externalId: string,
    data: SocialPlatformData,
    posts: SocialPost[]
  ): Promise<void> {
    const savedAccount = await this.socialAccountRepository.upsertSocialAccount({
      platform: "instagram",
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

export const instagramService = new InstagramService()
