import { fetchInstagramData } from "../services/instagram.service"
import { fetchTikTokData } from "../services/tiktok.service"
import { fetchYoutubeData } from "../services/youtube.service"
import type { PlatformKey, PlatformResult, SocialRequestBody } from "../types/social.types"
import { normalizeErrorMessage } from "./normalizeData"

const PLATFORM_LABELS: Record<PlatformKey, string> = {
  tiktok: "TikTok",
  youtube: "YouTube",
  instagram: "Instagram",
}

const PLATFORM_FETCHERS: Record<PlatformKey, (query: string) => Promise<PlatformResult["data"]>> = {
  tiktok: fetchTikTokData,
  youtube: fetchYoutubeData,
  instagram: fetchInstagramData,
}

function isUsernameNotFoundError(message: string): boolean {
  return /(not found|no .* found|username .* not found|404)/i.test(message)
}

function toPlatformErrorMessage(platform: PlatformKey, query: string, message: string): string {
  if (isUsernameNotFoundError(message)) {
    return `Username \"${query}\" tidak ditemukan di ${PLATFORM_LABELS[platform]}`
  }

  return message
}

export async function resolveSocialPlatform(
  platform: PlatformKey,
  query: string
): Promise<PlatformResult> {
  try {
    const data = await PLATFORM_FETCHERS[platform](query)
    return { platform, data }
  } catch (error) {
    const normalizedMessage = normalizeErrorMessage(error)

    return {
      platform,
      data: null,
      error: toPlatformErrorMessage(platform, query, normalizedMessage),
    }
  }
}

export async function resolveAllSocialPlatforms(
  queries: SocialRequestBody
): Promise<PlatformResult[]> {
  return Promise.all([
    resolveSocialPlatform("tiktok", queries.tiktokQuery),
    resolveSocialPlatform("youtube", queries.youtubeQuery),
    resolveSocialPlatform("instagram", queries.instagramQuery),
  ])
}
