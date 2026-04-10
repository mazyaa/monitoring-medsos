import type { PlatformKey } from "../types/social.types"

export const MAX_CONTENT_ITEMS = 5

export const PLATFORM_LABELS: Record<PlatformKey, string> = {
  tiktok: "TikTok",
  youtube: "YouTube",
  instagram: "Instagram",
}

export const PLATFORM_ORDER: PlatformKey[] = ["tiktok", "youtube", "instagram"]

export const DEFAULT_PROFILE_IMAGES: Record<PlatformKey, string> = {
  tiktok: "https://placehold.co/80x80?text=TT",
  youtube: "https://placehold.co/80x80?text=YT",
  instagram: "https://placehold.co/80x80?text=IG",
}

export const DEFAULT_CONTENT_THUMBNAIL = "https://placehold.co/160x90?text=Content"
