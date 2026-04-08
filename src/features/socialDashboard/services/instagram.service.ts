import { MAX_CONTENT_ITEMS } from "../constants/social.constants"
import type { SocialPlatformData } from "../types/social.types"
import { normalizePlatformData } from "../utils/normalizeData"

const INSTAGRAM_GRAPH_BASE_URL = "https://graph.facebook.com/v20.0"

type InstagramMediaItem = {
  id?: string
  caption?: string
  media_url?: string
  permalink?: string
  timestamp?: string
  views?: string
}

type InstagramProfileResponse = {
  accountName?: string
  username?: string
  profilePictureUrl?: string
  media?: InstagramMediaItem[]
}

type InstagramGraphError = {
  error?: {
    message?: string
  }
}

type InstagramGraphProfileResponse = {
  id?: string
  username?: string
  name?: string
  profile_picture_url?: string
}

type InstagramGraphMediaResponse = {
  data?: Array<{
    id?: string
    caption?: string
    media_type?: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM"
    media_product_type?: "FEED" | "REELS" | "STORY" | "AD"
    media_url?: string
    thumbnail_url?: string
    timestamp?: string
    permalink?: string
    like_count?: number
    comments_count?: number
    video_view_count?: number
    children?: {
      data?: Array<{
        media_url?: string
        thumbnail_url?: string
      }>
    }
  }>
}

function toSeed(input: string): number {
  return input
    .toLowerCase()
    .split("")
    .reduce((seed, char) => seed + char.charCodeAt(0), 0)
}

function normalizeHandle(value: string): string {
  return value.trim().toLowerCase().replace(/^@/, "")
}

function isSameInstagramAccount(query: string, username?: string): boolean {
  const normalizedQuery = normalizeHandle(query)
  const normalizedUsername = normalizeHandle(username || "")

  if (!normalizedQuery || !normalizedUsername) {
    return true
  }

  return normalizedQuery === normalizedUsername
}

async function fetchInstagramGraphJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  })

  const payload = (await response.json()) as T & InstagramGraphError

  if (!response.ok) {
    throw new Error(payload.error?.message || `Instagram request failed with status ${response.status}`)
  }

  return payload
}

async function fetchInstagramGraphData(query: string): Promise<SocialPlatformData> {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN
  const businessAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID

  if (!accessToken || !businessAccountId) {
    throw new Error("Missing Instagram Graph API credentials")
  }

  const profileUrl = `${INSTAGRAM_GRAPH_BASE_URL}/${businessAccountId}?fields=id,username,name,profile_picture_url&access_token=${accessToken}`
  const mediaUrl = `${INSTAGRAM_GRAPH_BASE_URL}/${businessAccountId}/media?fields=id,caption,media_type,media_product_type,media_url,thumbnail_url,timestamp,permalink,like_count,comments_count,video_view_count,children%7Bmedia_url,thumbnail_url%7D&limit=${MAX_CONTENT_ITEMS}&access_token=${accessToken}`

  const [profile, mediaResponse] = await Promise.all([
    fetchInstagramGraphJson<InstagramGraphProfileResponse>(profileUrl),
    fetchInstagramGraphJson<InstagramGraphMediaResponse>(mediaUrl),
  ])

  if (!isSameInstagramAccount(query, profile.username)) {
    throw new Error("Instagram username not found")
  }

  const filteredMedia = (mediaResponse.data || []).filter((item) => {
    const mediaProductType = item.media_product_type

    if (!mediaProductType) {
      return true
    }

    return mediaProductType === "FEED" || mediaProductType === "REELS"
  })

  const normalizedMedia = filteredMedia.map((item, index) => {
    const fallbackAsset = item.children?.data?.[0]
    const isVideo = item.media_type === "VIDEO"
    const interactionViews = Number(item.like_count || 0) * 20 + Number(item.comments_count || 0) * 40
    const computedViews = Number(item.video_view_count || 0)

    return {
      id: item.id || `instagram-${index + 1}`,
      title: item.caption || `Instagram post ${index + 1} by ${query}`,
      thumbnailUrl: item.thumbnail_url || item.media_url || fallbackAsset?.thumbnail_url || fallbackAsset?.media_url || "",
      publishedAt: item.timestamp || new Date().toISOString(),
      views: isVideo ? Math.max(computedViews, interactionViews) : interactionViews,
      url: item.permalink || `https://www.instagram.com/${normalizeHandle(profile.username || query)}`,
    }
  })

  return normalizePlatformData("instagram", {
    accountName: profile.name || profile.username || query,
    username: `@${profile.username || normalizeHandle(query)}`,
    profileImageUrl: profile.profile_picture_url || "",
    totalViews: normalizedMedia.reduce((total, item) => total + Number(item.views || 0), 0),
    latestContents: normalizedMedia,
  })
}

function buildMockInstagramData(query: string): SocialPlatformData {
  const username = query.replace(/\s+/g, "").toLowerCase()
  const seed = toSeed(query)
  const shouldReturnEmptyContent = /nocontent|empty/i.test(query)
  const contentCount = shouldReturnEmptyContent ? 0 : (seed % MAX_CONTENT_ITEMS) + 1

  const dynamicMedia: InstagramMediaItem[] = Array.from({ length: contentCount }, (_, index) => {
    const id = `${Math.abs(seed)}-${index + 1}`
    const views = String(Math.max(0, 14000 + seed * 8 - index * 1100))

    return {
      id,
      caption: `Instagram post ${index + 1} by ${query}`,
      media_url: "",
      permalink: `https://www.instagram.com/p/${id}`,
      timestamp: new Date(Date.now() - index * 102_000_000).toISOString(),
      views,
    }
  })

  const profile: InstagramProfileResponse = {
    accountName: `${query} on Instagram`,
    username,
    profilePictureUrl: "",
    media: dynamicMedia,
  }

  return normalizePlatformData("instagram", {
    accountName: profile.accountName || `${query} on Instagram`,
    username: `@${profile.username || username}`,
    profileImageUrl: profile.profilePictureUrl || "",
    totalViews: (profile.media || []).reduce((total, item) => total + Number(item.views || 0), 0),
    latestContents: (profile.media || []).map((item, index) => ({
      id: item.id || `instagram-${index + 1}`,
      title: item.caption || `Instagram post ${index + 1} by ${query}`,
      thumbnailUrl: item.media_url || "",
      publishedAt: item.timestamp || new Date().toISOString(),
      views: Number(item.views || 0),
      url: item.permalink || `https://www.instagram.com/${username}`,
    })),
  })
}

export async function fetchInstagramData(query: string): Promise<SocialPlatformData> {
  if (query.toLowerCase().includes("fail-instagram")) {
    throw new Error("Instagram API is currently unavailable (mocked)")
  }

  if (/(notfound|not-found|404)/i.test(query)) {
    throw new Error("Instagram username not found")
  }

  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN
  const businessAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID

  if (accessToken && businessAccountId) {
    return fetchInstagramGraphData(query)
  }

  return buildMockInstagramData(query)
}
