import { z } from "zod"

export const PLATFORM_KEYS = ["tiktok", "youtube", "instagram"] as const

export type PlatformKey = (typeof PLATFORM_KEYS)[number]

const socialQueryInputSchema = z
  .string()
  .trim()
  .min(2, "Input must contain at least 2 characters")
  .max(100)

export const socialRequestSchema = z.object({
  tiktokQuery: socialQueryInputSchema,
  youtubeQuery: socialQueryInputSchema,
  instagramQuery: socialQueryInputSchema,
})

export const socialPlatformRequestSchema = z.object({
  query: socialQueryInputSchema,
})

export const socialContentSchema = z.object({
  id: z.string(),
  title: z.string(),
  thumbnailUrl: z.string().url(),
  publishedAt: z.string(),
  views: z.number().nonnegative(),
  url: z.string().url(),
})

export const socialPlatformDataSchema = z.object({
  platform: z.enum(PLATFORM_KEYS),
  accountName: z.string(),
  username: z.string(),
  profileImageUrl: z.string().url(),
  totalViews: z.number().nonnegative(),
  latestContents: z.array(socialContentSchema).max(5),
})

export const platformResultSchema = z.object({
  platform: z.enum(PLATFORM_KEYS),
  data: socialPlatformDataSchema.nullable(),
  error: z.string().optional(),
})

export const socialApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(platformResultSchema),
})

export const socialPlatformApiResponseSchema = z.object({
  success: z.boolean(),
  data: platformResultSchema,
})

export type SocialRequestBody = z.infer<typeof socialRequestSchema>
export type SocialPlatformRequestBody = z.infer<typeof socialPlatformRequestSchema>
export type SocialContent = z.infer<typeof socialContentSchema>
export type SocialPlatformData = z.infer<typeof socialPlatformDataSchema>
export type SocialApiResponse = z.infer<typeof socialApiResponseSchema>
export type SocialPlatformApiResponse = z.infer<typeof socialPlatformApiResponseSchema>
export type PlatformResult = z.infer<typeof platformResultSchema>
