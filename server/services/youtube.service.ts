import { fetchJson } from "@/server/lib/fetcher"
import { PostRepository } from "@/server/repositories/post.repository"
import { SocialAccountRepository } from "@/server/repositories/social-account.repository"
import type { PlatformResult, SocialContent, SocialPlatformData } from "@/server/services/social.types"

type YouTubeSearchResponse = {
  items?: Array<{
    id?: { channelId?: string; videoId?: string }
    snippet?: {
      channelId?: string
      channelTitle?: string
      title?: string
      publishedAt?: string
      thumbnails?: {
        default?: { url?: string }
        medium?: { url?: string }
        high?: { url?: string }
      }
    }
  }>
}

type YouTubeChannelResponse = {
  items?: Array<{
    snippet?: {
      title?: string
      customUrl?: string
      thumbnails?: {
        default?: { url?: string }
        medium?: { url?: string }
        high?: { url?: string }
      }
    }
    statistics?: {
      viewCount?: string
    }
  }>
}

type YouTubeVideosResponse = {
  items?: Array<{
    id?: string
    snippet?: {
      title?: string
      publishedAt?: string
      thumbnails?: {
        default?: { url?: string }
        medium?: { url?: string }
        high?: { url?: string }
      }
    }
    statistics?: {
      viewCount?: string
    }
  }>
}

type YouTubeServiceDependencies = {
  socialAccountRepository?: SocialAccountRepository
  postRepository?: PostRepository
  maxContentItems?: number
}

const YOUTUBE_BASE_URL = "https://www.googleapis.com/youtube/v3"
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
  private readonly socialAccountRepository: SocialAccountRepository
  private readonly postRepository: PostRepository
  private readonly maxContentItems: number

  constructor(dependencies: YouTubeServiceDependencies = {}) {
    this.socialAccountRepository =
      dependencies.socialAccountRepository ?? new SocialAccountRepository()
    this.postRepository = dependencies.postRepository ?? new PostRepository()
    this.maxContentItems = dependencies.maxContentItems ?? DEFAULT_MAX_CONTENT_ITEMS
  }

  async fetchByQuery(query: string): Promise<PlatformResult> {
    try {
      const { data, channelId } = await this.fetchChannelData(query)
      await this.persistSnapshot(channelId, data)

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

  private async fetchChannelData(
    query: string
  ): Promise<{ channelId: string; data: SocialPlatformData }> {
    const apiKey = process.env.YOUTUBE_API_KEY

    if (!apiKey) {
      throw new Error("Missing YOUTUBE_API_KEY environment variable")
    }

    const channelLookupUrl = `${YOUTUBE_BASE_URL}/search?part=snippet&type=channel&maxResults=1&q=${encodeURIComponent(
      query
    )}&key=${apiKey}`
    const channelLookup = await fetchJson<YouTubeSearchResponse>(channelLookupUrl)

    const matchedChannel = channelLookup.items?.[0]
    const channelId = matchedChannel?.id?.channelId ?? matchedChannel?.snippet?.channelId

    if (!channelId) {
      throw new Error("No YouTube channel found for this input")
    }

    const channelDetailsUrl = `${YOUTUBE_BASE_URL}/channels?part=snippet,statistics&id=${channelId}&key=${apiKey}`
    const latestVideosUrl = `${YOUTUBE_BASE_URL}/search?part=snippet&type=video&maxResults=${this.maxContentItems}&order=date&channelId=${channelId}&key=${apiKey}`

    const [channelDetails, latestVideos] = await Promise.all([
      fetchJson<YouTubeChannelResponse>(channelDetailsUrl),
      fetchJson<YouTubeSearchResponse>(latestVideosUrl),
    ])

    const channelMeta = channelDetails.items?.[0]
    const latestVideoIds = (latestVideos.items || [])
      .map((item) => item.id?.videoId)
      .filter((videoId): videoId is string => Boolean(videoId))

    let videosWithStats: YouTubeVideosResponse = { items: [] }

    if (latestVideoIds.length > 0) {
      const videosStatsUrl = `${YOUTUBE_BASE_URL}/videos?part=snippet,statistics&id=${latestVideoIds.join(",")}&key=${apiKey}`
      videosWithStats = await fetchJson<YouTubeVideosResponse>(videosStatsUrl)
    }

    const latestContents: SocialContent[] = (videosWithStats.items || []).map((video) => ({
      id: video.id || "",
      title: video.snippet?.title || "Untitled video",
      thumbnailUrl:
        video.snippet?.thumbnails?.medium?.url ||
        video.snippet?.thumbnails?.high?.url ||
        video.snippet?.thumbnails?.default?.url ||
        "",
      publishedAt: video.snippet?.publishedAt || new Date().toISOString(),
      views: toSafeNumber(video.statistics?.viewCount || 0),
      url: `https://www.youtube.com/watch?v=${video.id}`,
    }))

    return {
      channelId,
      data: {
        platform: "youtube",
        accountName: channelMeta?.snippet?.title || matchedChannel?.snippet?.channelTitle || query,
        username: channelMeta?.snippet?.customUrl || query,
        profileImageUrl:
          channelMeta?.snippet?.thumbnails?.high?.url ||
          channelMeta?.snippet?.thumbnails?.medium?.url ||
          channelMeta?.snippet?.thumbnails?.default?.url ||
          "",
        totalViews: toSafeNumber(channelMeta?.statistics?.viewCount || 0),
        latestContents,
      },
    }
  }

  private async persistSnapshot(channelId: string, data: SocialPlatformData): Promise<void> {
    const savedAccount = await this.socialAccountRepository.upsert({
      platform: "youtube",
      externalId: channelId,
      username: data.username,
      accountName: data.accountName,
      profileImageUrl: data.profileImageUrl,
      totalViews: data.totalViews,
    })

    if (!savedAccount?.id) {
      return
    }

    await this.postRepository.replaceLatestByAccountId(savedAccount.id, data.latestContents)
  }
}

export const youtubeService = new YouTubeService()
