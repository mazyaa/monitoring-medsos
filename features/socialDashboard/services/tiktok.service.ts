import { MAX_CONTENT_ITEMS } from "../constants/social.constants"
import type { SocialPlatformData } from "../types/social.types"
import { normalizePlatformData } from "../utils/normalizeData"

type TikTokVideo = {
  id?: string
  desc?: string
  createTime?: number
  stats?: {
    playCount?: string
  }
  cover?: string
}

type TikTokProfileResponse = {
  user?: {
    nickname?: string
    uniqueId?: string
    avatarThumb?: string
  }
  stats?: {
    playCount?: string
  }
  videos?: TikTokVideo[]
}

function toSeed(input: string): number {
  return input
    .toLowerCase()
    .split("")
    .reduce((seed, char) => seed + char.charCodeAt(0), 0)
}

export async function fetchTikTokData(query: string): Promise<SocialPlatformData> {
  if (query.toLowerCase().includes("fail-tiktok")) {
    throw new Error("TikTok upstream timeout (mocked)")
  }

  if (/(notfound|not-found|404)/i.test(query)) {
    throw new Error("TikTok username not found")
  }

  const username = query.replace(/\s+/g, "").toLowerCase()
  const seed = toSeed(query)
  const shouldReturnEmptyContent = /nocontent|empty/i.test(query)
  const contentCount = shouldReturnEmptyContent ? 0 : (seed % MAX_CONTENT_ITEMS) + 1

  const dynamicVideos: TikTokVideo[] = Array.from({ length: contentCount }, (_, index) => {
    const id = `${Math.abs(seed)}${index + 1}`
    const playCount = String(Math.max(0, 20000 + seed * 9 - index * 1400))

    return {
      id,
      desc: `TikTok clip ${index + 1} from ${query}`,
      createTime: Math.floor((Date.now() - index * 86_400_000) / 1000),
      stats: { playCount },
      cover: "",
    }
  })

  const profile: TikTokProfileResponse = {
    user: {
      nickname: `${query} on TikTok`,
      uniqueId: username,
      avatarThumb: "",
    },
    stats: {
      playCount: String(dynamicVideos.reduce((total, video) => total + Number(video.stats?.playCount || 0), 0)),
    },
    videos: dynamicVideos,
  }

  return normalizePlatformData("tiktok", {
    accountName: profile.user?.nickname || `${query} on TikTok`,
    username: `@${profile.user?.uniqueId || username}`,
    profileImageUrl: profile.user?.avatarThumb || "",
    totalViews: Number(profile.stats?.playCount || 0),
    latestContents: (profile.videos || []).map((video, index) => ({
      id: video.id || `tiktok-${index + 1}`,
      title: video.desc || `TikTok clip ${index + 1} from ${query}`,
      thumbnailUrl: video.cover || "",
      publishedAt: new Date((video.createTime || 0) * 1000 || Date.now()).toISOString(),
      views: Number(video.stats?.playCount || 0),
      url: `https://www.tiktok.com/@${username}/video/${video.id || `tiktok-${index + 1}`}`,
    })),
  })
}
