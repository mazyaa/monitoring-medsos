import type { PlatformResult } from "@/server/services/social.types"

export class TikTokService {
  async fetchByQuery(query: string): Promise<PlatformResult> {
    return {
      platform: "tiktok",
      data: null,
      error: `Not implemented yet for query: ${query}`,
    }
  }
}

export const tiktokService = new TikTokService()
