import type { NextApiRequest, NextApiResponse } from "next"

import type { SocialApiResponse } from "@/features/socialDashboard/types/social.types"
import { socialRequestSchema } from "@/features/socialDashboard/types/social.types"
import { buildSocialApiResponse } from "@/features/socialDashboard/utils/normalizeData"
import { resolveAllSocialPlatforms } from "@/features/socialDashboard/utils/resolvePlatform"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SocialApiResponse | { message: string }>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  const parsedBody = socialRequestSchema.safeParse(req.body)

  if (!parsedBody.success) {
    return res.status(400).json({ message: parsedBody.error.issues[0]?.message || "Invalid request" })
  }

  const results = await resolveAllSocialPlatforms(parsedBody.data)
  const normalizedResponse = buildSocialApiResponse(results)

  return res.status(200).json(normalizedResponse)
}
