import type { PlatformResult } from "@/server/services/social.types"

export class InstagramService {
  async fetchByQuery(query: string): Promise<PlatformResult> {
    return {
      platform: "instagram",
      data: null,
      error: `Not implemented yet for query: ${query}`,
    }
  }
}

export const instagramService = new InstagramService()
