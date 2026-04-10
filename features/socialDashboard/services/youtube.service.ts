import { youtubeService } from "@/server/services/youtube.service"

import type { SocialPlatformData } from "../types/social.types"

export async function fetchYoutubeData(query: string): Promise<SocialPlatformData> {
  const result = await youtubeService.fetchByQuery(query)

  if (!result.data) {
    throw new Error(result.error || "Failed to fetch YouTube data")
  }

  return result.data
}
