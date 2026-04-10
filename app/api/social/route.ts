import { NextResponse } from "next/server"

import { socialRequestSchema } from "@/features/socialDashboard/types/social.types"
import { buildSocialApiResponse } from "@/features/socialDashboard/utils/normalizeData"
import { resolveAllSocialPlatforms } from "@/features/socialDashboard/utils/resolvePlatform"

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const parsedBody = socialRequestSchema.safeParse(payload)

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          message: parsedBody.error.issues[0]?.message || "Invalid request",
        },
        {
          status: 400,
        }
      )
    }

    const results = await resolveAllSocialPlatforms(parsedBody.data)
    const normalizedResponse = buildSocialApiResponse(results)

    return NextResponse.json(normalizedResponse, {
      status: 200,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch social data"

    return NextResponse.json(
      {
        message,
      },
      {
        status: 500,
      }
    )
  }
}