import { z } from "zod"

const socialQuerySchema = z
  .string()
  .trim()
  .min(2, "Input must contain at least 2 characters")
  .max(100, "Input must contain at most 100 characters")

export const socialPlatformRequestSchema = z.object({
  query: socialQuerySchema,
})

export type SocialPlatformRequestBody = z.infer<typeof socialPlatformRequestSchema>
