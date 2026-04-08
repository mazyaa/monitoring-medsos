import type { NextApiRequest, NextApiResponse } from "next"

import {
  socialPlatformRequestSchema,
  type SocialPlatformApiResponse,
} from "@/features/socialDashboard/types/social.types"
import { resolveSocialPlatform } from "@/features/socialDashboard/utils/resolvePlatform"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SocialPlatformApiResponse | { message: string }>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  const parsedBody = socialPlatformRequestSchema.safeParse(req.body)

  if (!parsedBody.success) {
    return res.status(400).json({ message: parsedBody.error.issues[0]?.message || "Invalid request" })
  }

  const result = await resolveSocialPlatform("youtube", parsedBody.data.query)

  return res.status(200).json({
    success: result.data !== null,
    data: result,
  })
}
