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

type InstagramProviderDependencies = {
  actorId?: string
  maxPosts?: number
  fetchWindowSize?: number
}

type InstagramSnapshot = {
  profile: SocialProfile
  stats: SocialStats
  posts: SocialPost[]
}

const DEFAULT_ACTOR_ID = "apify/instagram-scraper"
const DEFAULT_MAX_POSTS = 5
const DEFAULT_FETCH_WINDOW_SIZE = 50
const DEFAULT_PROFILE_IMAGE = "https://placehold.co/80x80?text=IG"
const DEFAULT_MEDIA_URL = "https://placehold.co/160x90?text=IG"

export class InstagramProvider implements SocialProvider {
  private readonly actorId: string
  private readonly maxPosts: number
  private readonly fetchWindowSize: number
  private readonly snapshotCache = new Map<string, Promise<InstagramSnapshot>>()

  constructor(dependencies: InstagramProviderDependencies = {}) {
    this.actorId = dependencies.actorId || process.env.APIFY_INSTAGRAM_ACTOR_ID || DEFAULT_ACTOR_ID
    this.maxPosts = dependencies.maxPosts ?? DEFAULT_MAX_POSTS
    this.fetchWindowSize =
      dependencies.fetchWindowSize ??
      Number(process.env.APIFY_INSTAGRAM_FETCH_WINDOW_SIZE || DEFAULT_FETCH_WINDOW_SIZE)
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

  private async getSnapshot(query: string): Promise<InstagramSnapshot> {
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

  private async fetchSnapshot(query: string): Promise<InstagramSnapshot> {
    if (!query) {
      throw new Error("Instagram query is empty")
    }

    const input = {
      directUrls: [`https://www.instagram.com/${query}/`],
      resultsType: "posts",
      resultsLimit: Math.max(this.fetchWindowSize, this.maxPosts),
      addParentData: true,
    }

    const run = await runActor(this.actorId, input)

    if (!run.defaultDatasetId) {
      throw new Error("Instagram actor run completed without dataset id")
    }

    const items = await getDatasetItems(run.defaultDatasetId)

    if (items.length === 0) {
      throw new Error("Instagram username not found")
    }

    const firstItem = items[0]
    const resolvedUsername = normalizeHandle(
      pickFirstString(firstItem, [
        "ownerUsername",
        "username",
        "owner.username",
        "user.username",
        "author.username",
      ]) || query
    )

    const profile: SocialProfile = {
      externalId:
        pickFirstString(firstItem, ["ownerId", "owner.id", "userId", "ownerPk", "id"]) ||
        resolvedUsername,
      username: `@${resolvedUsername}`,
      accountName:
        pickFirstString(firstItem, [
          "ownerFullName",
          "fullName",
          "owner.fullName",
          "user.fullName",
          "displayName",
        ]) || `@${resolvedUsername}`,
      profileImageUrl:
        pickFirstString(firstItem, [
          "ownerProfilePicUrl",
          "profilePicUrl",
          "owner.profilePicUrl",
          "user.profilePicUrl",
        ]) || DEFAULT_PROFILE_IMAGE,
    }

    const normalizedPosts = items.map((item, index) => {
        const id =
          pickFirstString(item, ["id", "shortCode", "shortcode", "code", "postId", "pk"]) ||
          `instagram-${index + 1}`
        const mediaUrl =
          pickFirstString(item, [
            "displayUrl",
            "display_url",
            "imageUrl",
            "videoUrl",
            "thumbnailUrl",
            "videoThumbnailUrl",
          ]) || DEFAULT_MEDIA_URL

        const likes = pickFirstNumber(item, [
          "likesCount",
          "likes",
          "likeCount",
          "edge_liked_by.count",
          "edge_media_preview_like.count",
        ])
        const comments = pickFirstNumber(item, ["commentsCount", "comments", "commentCount", "edge_media_to_comment.count"])
        const views = pickFirstNumber(item, ["videoViewCount", "videoPlayCount", "viewsCount", "playCount"])
        const createdAt =
          toDateOrNull(
            pickFirstString(item, ["timestamp", "takenAtTimestamp", "takenAt", "createdAt", "publishedAt"]) ||
              pickFirstNumber(item, ["timestamp", "takenAtTimestamp", "takenAt", "createdAt", "publishedAt"])
          ) ?? new Date(0)
        const hasTimestamp = createdAt.getTime() > 0

        return {
          post: {
            id,
            caption:
              pickFirstString(item, ["caption", "captionText", "title", "text"]) ||
              `Instagram post ${index + 1} by @${resolvedUsername}`,
            mediaUrl,
            platform: "instagram" as const,
            likes: likes ?? undefined,
            comments: comments ?? undefined,
            views: views ?? undefined,
            createdAt,
            url: pickFirstString(item, ["url", "postUrl", "permalink"]) || `https://www.instagram.com/p/${id}`,
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
              "ownerVideoViewCount",
              "owner.videoViewCount",
              "stats.totalViews",
              "stats.videoViewCount",
            ])
          ) || totalViewsFromItems,
      },
      posts,
    }
  }
}
