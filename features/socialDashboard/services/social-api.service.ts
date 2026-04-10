import {
  type PlatformKey,
  socialPlatformApiResponseSchema,
  socialApiResponseSchema,
  type SocialApiResponse,
  type SocialPlatformApiResponse,
  type SocialRequestBody,
} from "../types/social.types"

const PLATFORM_ENDPOINTS: Record<PlatformKey, string> = {
  youtube: "/api/youtube",
  instagram: "/api/instagram",
  tiktok: "/api/tiktok",
}

async function fetchPlatform(platform: PlatformKey, query: string): Promise<SocialPlatformApiResponse["data"]> {
  const response = await fetch(PLATFORM_ENDPOINTS[platform], {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  })

  const payload = await response.json()

  if (!response.ok) {
    const message =
      typeof payload?.message === "string"
        ? payload.message
        : typeof payload?.data?.error === "string"
          ? payload.data.error
          : `Failed to fetch ${platform} data`
    throw new Error(message)
  }

  const parsed = socialPlatformApiResponseSchema.safeParse(payload)

  if (!parsed.success) {
    throw new Error(`Received invalid ${platform} API response format`)
  }

  return parsed.data.data
}

export async function fetchSocialDashboard(queries: SocialRequestBody): Promise<SocialApiResponse> {
  const [tiktok, youtube, instagram] = await Promise.all([
    fetchPlatform("tiktok", queries.tiktokQuery),
    fetchPlatform("youtube", queries.youtubeQuery),
    fetchPlatform("instagram", queries.instagramQuery),
  ])

  const payload: SocialApiResponse = {
    success: [tiktok, youtube, instagram].some((result) => result.data !== null),
    data: [tiktok, youtube, instagram],
  }

  const parsed = socialApiResponseSchema.safeParse(payload)

  if (!parsed.success) {
    throw new Error("Received invalid API response format")
  }

  return parsed.data
}
