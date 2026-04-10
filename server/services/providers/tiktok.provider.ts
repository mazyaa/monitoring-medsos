import { getDatasetItems, runActor } from "@/server/lib/apify"
import type { SocialPost, SocialProfile, SocialProvider, SocialStats } from "@/types/social"

import {
  normalizeHandle,
  pickFirstNumber,
  pickFirstString,
  sortPostsByLatestDeterministic,
  toDateOrNull,
  toSafeNumber,
} from "./provider.utils"

type TikTokProviderDependencies = {
  actorId?: string
  maxPosts?: number
  fetchWindowSize?: number
}

type TikTokSnapshot = {
  profile: SocialProfile
  stats: SocialStats
  posts: SocialPost[]
}

const DEFAULT_ACTOR_ID = "clockworks/tiktok-scraper"
const DEFAULT_MAX_POSTS = 5
const DEFAULT_FETCH_WINDOW_SIZE = 50
const DEFAULT_PROFILE_IMAGE = "https://placehold.co/80x80?text=TT"
const DEFAULT_MEDIA_URL = "https://placehold.co/160x90?text=TT"

export class TikTokProvider implements SocialProvider {
  private readonly actorId: string
  private readonly maxPosts: number
  private readonly fetchWindowSize: number
  private readonly snapshotCache = new Map<string, Promise<TikTokSnapshot>>()

  constructor(dependencies: TikTokProviderDependencies = {}) {
    this.actorId = dependencies.actorId || process.env.APIFY_TIKTOK_ACTOR_ID || DEFAULT_ACTOR_ID
    this.maxPosts = dependencies.maxPosts ?? DEFAULT_MAX_POSTS
    this.fetchWindowSize =
      dependencies.fetchWindowSize ??
      Number(process.env.APIFY_TIKTOK_FETCH_WINDOW_SIZE || DEFAULT_FETCH_WINDOW_SIZE)
  }

  async getProfile(query: string): Promise<SocialProfile> {
    const snapshot = await this.getSnapshot(query)
    return snapshot.profile
  }

  async getStats(query: string): Promise<SocialStats> {
    const snapshot = await this.getSnapshot(query)
    return snapshot.stats
  }

  async getPosts(query: string, limit = this.maxPosts): Promise<SocialPost[]> {
    const snapshot = await this.getSnapshot(query)
    return snapshot.posts.slice(0, Math.max(1, limit))
  }

  private async getSnapshot(query: string): Promise<TikTokSnapshot> {
    const normalizedQuery = normalizeHandle(query)
    const cacheKey = normalizedQuery || query.trim().toLowerCase()
    const cachedSnapshot = this.snapshotCache.get(cacheKey)

    if (cachedSnapshot) {
      return cachedSnapshot
    }

    const snapshotPromise = this.fetchSnapshot(normalizedQuery)
    this.snapshotCache.set(cacheKey, snapshotPromise)

    try {
      return await snapshotPromise
    } catch (error) {
      this.snapshotCache.delete(cacheKey)
      throw error
    }
  }

  private async fetchSnapshot(query: string): Promise<TikTokSnapshot> {
    if (!query) {
      throw new Error("TikTok query is empty")
    }

    const input = {
      profiles: [query],
      resultsPerPage: Math.max(this.fetchWindowSize, this.maxPosts),
      maxItems: Math.max(this.fetchWindowSize, this.maxPosts),
      shouldDownloadVideos: false,
      shouldDownloadCovers: false,
      shouldDownloadSubtitles: false,
    }

    const run = await runActor(this.actorId, input)

    if (!run.defaultDatasetId) {
      throw new Error("TikTok actor run completed without dataset id")
    }

    const items = await getDatasetItems(run.defaultDatasetId)

    if (items.length === 0) {
      throw new Error("TikTok username not found")
    }

    const firstItem = items[0]
    const resolvedUsername = normalizeHandle(
      pickFirstString(firstItem, [
        "authorMeta.name",
        "authorMeta.nickName",
        "author.username",
        "author.uniqueId",
        "authorMeta.userName",
      ]) || query
    )

    const profile: SocialProfile = {
      externalId:
        pickFirstString(firstItem, [
          "authorMeta.id",
          "author.id",
          "authorMeta.secUid",
          "authorMeta.userId",
        ]) || resolvedUsername,
      username: `@${resolvedUsername}`,
      accountName:
        pickFirstString(firstItem, [
          "authorMeta.nickName",
          "author.nickname",
          "authorMeta.name",
          "author.name",
        ]) || `@${resolvedUsername}`,
      profileImageUrl:
        pickFirstString(firstItem, [
          "authorMeta.avatar",
          "author.avatarThumb",
          "author.avatarMedium",
          "authorMeta.avatarThumb",
        ]) || DEFAULT_PROFILE_IMAGE,
    }

    const normalizedPosts = items.map((item, index) => {
        const id =
          pickFirstString(item, ["id", "awemeId", "aweme_id", "videoId", "video.id"]) ||
          `tiktok-${index + 1}`
        const mediaUrl =
          pickFirstString(item, [
            "videoMeta.coverUrl",
            "video.cover",
            "video.dynamicCover",
            "video.originCover",
            "covers.default",
          ]) || DEFAULT_MEDIA_URL

        const likes = pickFirstNumber(item, ["diggCount", "stats.diggCount", "likes", "likeCount"])
        const comments = pickFirstNumber(item, ["commentCount", "stats.commentCount", "comments", "comment_count"])
        const views = pickFirstNumber(item, ["playCount", "stats.playCount", "stats.play_count", "views"])
        const createdAt =
          toDateOrNull(
            pickFirstString(item, ["createTimeISO", "createTime", "create_time", "timestamp"]) ||
              pickFirstNumber(item, ["createTime", "create_time", "timestamp"])
          ) ?? new Date(0)
        const hasTimestamp = createdAt.getTime() > 0

        return {
          post: {
            id,
            caption:
              pickFirstString(item, ["text", "desc", "description", "title"]) ||
              `TikTok post ${index + 1} by @${resolvedUsername}`,
            mediaUrl,
            platform: "tiktok" as const,
            likes: likes ?? undefined,
            comments: comments ?? undefined,
            views: views ?? undefined,
            createdAt,
            url:
              pickFirstString(item, ["webVideoUrl", "url", "shareUrl", "videoUrl"]) ||
              `https://www.tiktok.com/@${resolvedUsername}/video/${id}`,
          },
          id,
          createdAt,
          hasTimestamp,
        }
      })
    const posts = sortPostsByLatestDeterministic(normalizedPosts)
      .map((entry) => entry.post)
      .slice(0, this.maxPosts)

    const totalViewsFromItems = posts.reduce((sum, post) => sum + toSafeNumber(post.views || 0), 0)

    return {
      profile,
      stats: {
        totalViews:
          toSafeNumber(
            pickFirstNumber(firstItem, [
              "authorStats.videoPlayCount",
              "authorStats.playCount",
              "author.stats.playCount",
              "stats.totalViews",
            ])
          ) || totalViewsFromItems,
      },
      posts,
    }
  }
}
