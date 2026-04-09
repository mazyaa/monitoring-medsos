import { fetchJson } from "@/server/lib/fetcher"
import type { SocialPost, SocialProfile, SocialProvider, SocialStats } from "@/types/social"

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

type YouTubeProviderDependencies = {
  maxContentItems?: number
}

type ResolvedChannel = {
  channelId: string
  username: string
  accountName: string
  profileImageUrl: string
  totalViews: number
}

const YOUTUBE_BASE_URL = "https://www.googleapis.com/youtube/v3"
const DEFAULT_MAX_CONTENT_ITEMS = 5

function toSafeNumber(value: unknown): number {
  const normalized = typeof value === "string" ? Number(value) : value
  return typeof normalized === "number" && Number.isFinite(normalized) && normalized >= 0
    ? normalized
    : 0
}

function getYouTubeApiKey(): string {
  const apiKey = process.env.YOUTUBE_API_KEY

  if (!apiKey) {
    throw new Error("Missing YOUTUBE_API_KEY environment variable")
  }

  return apiKey
}

export class YouTubeProvider implements SocialProvider {
  private readonly maxContentItems: number
  private readonly channelCache = new Map<string, Promise<ResolvedChannel>>()
  private readonly postsCache = new Map<string, Promise<SocialPost[]>>()

  constructor(dependencies: YouTubeProviderDependencies = {}) {
    this.maxContentItems = dependencies.maxContentItems ?? DEFAULT_MAX_CONTENT_ITEMS
  }

  async getProfile(query: string): Promise<SocialProfile> {
    const channel = await this.resolveChannel(query)

    return {
      externalId: channel.channelId,
      username: channel.username,
      accountName: channel.accountName,
      profileImageUrl: channel.profileImageUrl,
    }
  }

  async getStats(query: string): Promise<SocialStats> {
    const channel = await this.resolveChannel(query)

    return {
      totalViews: channel.totalViews,
    }
  }

  async getPosts(query: string): Promise<SocialPost[]> {
    const normalizedQuery = query.trim().toLowerCase()

    const cachedPosts = this.postsCache.get(normalizedQuery)

    if (cachedPosts) {
      return cachedPosts
    }

    const postsPromise = this.loadPosts(query)
    this.postsCache.set(normalizedQuery, postsPromise)

    try {
      return await postsPromise
    } catch (error) {
      this.postsCache.delete(normalizedQuery)
      throw error
    }
  }

  private async resolveChannel(query: string): Promise<ResolvedChannel> {
    const normalizedQuery = query.trim().toLowerCase()

    const cachedChannel = this.channelCache.get(normalizedQuery)

    if (cachedChannel) {
      return cachedChannel
    }

    const channelPromise = this.loadChannel(query)
    this.channelCache.set(normalizedQuery, channelPromise)

    try {
      return await channelPromise
    } catch (error) {
      this.channelCache.delete(normalizedQuery)
      throw error
    }
  }

  private async loadChannel(query: string): Promise<ResolvedChannel> {
    const apiKey = getYouTubeApiKey()
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
    const channelDetails = await fetchJson<YouTubeChannelResponse>(channelDetailsUrl)
    const channelMeta = channelDetails.items?.[0]

    return {
      channelId,
      username: channelMeta?.snippet?.customUrl || query,
      accountName: channelMeta?.snippet?.title || matchedChannel?.snippet?.channelTitle || query,
      profileImageUrl:
        channelMeta?.snippet?.thumbnails?.high?.url ||
        channelMeta?.snippet?.thumbnails?.medium?.url ||
        channelMeta?.snippet?.thumbnails?.default?.url ||
        "",
      totalViews: toSafeNumber(channelMeta?.statistics?.viewCount || 0),
    }
  }

  private async loadPosts(query: string): Promise<SocialPost[]> {
    const apiKey = getYouTubeApiKey()
    const channel = await this.resolveChannel(query)
    const latestVideosUrl = `${YOUTUBE_BASE_URL}/search?part=snippet&type=video&maxResults=${this.maxContentItems}&order=date&channelId=${channel.channelId}&key=${apiKey}`

    const latestVideos = await fetchJson<YouTubeSearchResponse>(latestVideosUrl)
    const latestVideoIds = (latestVideos.items || [])
      .map((item) => item.id?.videoId)
      .filter((videoId): videoId is string => Boolean(videoId))

    if (latestVideoIds.length === 0) {
      return []
    }

    const videosStatsUrl = `${YOUTUBE_BASE_URL}/videos?part=snippet,statistics&id=${latestVideoIds.join(",")}&key=${apiKey}`
    const videosWithStats = await fetchJson<YouTubeVideosResponse>(videosStatsUrl)

    return (videosWithStats.items || []).map((video) => {
      const id = video.id || ""

      return {
        id,
        caption: video.snippet?.title || "Untitled video",
        mediaUrl:
          video.snippet?.thumbnails?.medium?.url ||
          video.snippet?.thumbnails?.high?.url ||
          video.snippet?.thumbnails?.default?.url ||
          "",
        platform: "youtube",
        views: toSafeNumber(video.statistics?.viewCount || 0),
        createdAt: new Date(video.snippet?.publishedAt || Date.now()),
        url: `https://www.youtube.com/watch?v=${id}`,
      }
    })
  }
}
