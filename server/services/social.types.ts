export const PLATFORM_KEYS = ["youtube", "instagram", "tiktok"] as const

export type PlatformKey = (typeof PLATFORM_KEYS)[number]

export type SocialContent = {
  id: string
  title: string
  thumbnailUrl: string
  publishedAt: string
  views: number
  url: string
}

export type SocialPlatformData = {
  platform: PlatformKey
  accountName: string
  username: string
  profileImageUrl: string
  totalViews: number
  latestContents: SocialContent[]
}

export type PlatformResult = {
  platform: PlatformKey
  data: SocialPlatformData | null
  error?: string
}
