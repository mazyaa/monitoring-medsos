import {
  DEFAULT_CONTENT_THUMBNAIL,
  DEFAULT_PROFILE_IMAGES,
  MAX_CONTENT_ITEMS,
} from "../constants/social.constants"
import type {
  PlatformKey,
  PlatformResult,
  SocialApiResponse,
  SocialContent,
  SocialPlatformData,
} from "../types/social.types"

function toNumber(value: unknown): number {
  const normalized = typeof value === "string" ? Number(value) : value
  return typeof normalized === "number" && Number.isFinite(normalized) && normalized >= 0
    ? normalized
    : 0
}

export function normalizePlatformData(
  platform: PlatformKey,
  payload: Omit<SocialPlatformData, "platform" | "latestContents"> & {
    latestContents: Array<Partial<SocialContent>>
  }
): SocialPlatformData {
  return {
    platform,
    accountName: payload.accountName,
    username: payload.username,
    profileImageUrl: payload.profileImageUrl || DEFAULT_PROFILE_IMAGES[platform],
    totalViews: toNumber(payload.totalViews),
    latestContents: payload.latestContents.slice(0, MAX_CONTENT_ITEMS).map((content, index) => ({
      id: content.id || `${platform}-${index}`,
      title: content.title || "Untitled content",
      thumbnailUrl: content.thumbnailUrl || DEFAULT_CONTENT_THUMBNAIL,
      publishedAt: content.publishedAt || new Date(0).toISOString(),
      views: toNumber(content.views),
      url: content.url || "https://example.com",
    })),
  }
}

export function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "string") {
    return error
  }

  return "Unexpected platform error"
}

export function buildSocialApiResponse(results: PlatformResult[]): SocialApiResponse {
  const success = results.some((result) => result.data !== null)

  return {
    success,
    data: results,
  }
}
