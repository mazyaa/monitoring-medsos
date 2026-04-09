export const PLATFORM_KEYS = ["youtube", "instagram", "tiktok"] as const

export type SocialPlatform = (typeof PLATFORM_KEYS)[number]
export type PlatformKey = SocialPlatform

export type SocialPost = {
  id: string
  caption: string
  mediaUrl: string
  platform: SocialPlatform
  likes?: number
  comments?: number
  views?: number
  createdAt: Date
  url?: string
}

export type SocialProfile = {
  externalId: string
  username: string
  accountName: string
  profileImageUrl: string
}

export type SocialStats = {
  totalViews: number
}

export type SocialProvider = {
  getPosts(query: string, limit?: number): Promise<SocialPost[]>
  getProfile(query: string): Promise<SocialProfile>
  getStats(query: string): Promise<SocialStats>
}

export type SocialContent = {
  id: string
  title: string
  thumbnailUrl: string
  publishedAt: string
  views: number
  url: string
}

export type SocialPlatformData = {
  platform: SocialPlatform
  accountName: string
  username: string
  profileImageUrl: string
  totalViews: number
  latestContents: SocialContent[]
}

export type PlatformResult = {
  platform: SocialPlatform
  data: SocialPlatformData | null
  error?: string
}
