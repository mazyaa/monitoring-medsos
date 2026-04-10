import { NextResponse } from "next/server"

import {
  socialRequestSchema,
  type SocialApiResponse,
} from "@/features/socialDashboard/types/social.types"
import { instagramService } from "@/server/services/instagram.service"
import { tiktokService } from "@/server/services/tiktok.service"
import { youtubeService } from "@/server/services/youtube.service"

export const runtime = "nodejs"
export const maxDuration = 60

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

    const results = await Promise.all([
      tiktokService.fetchByQuery(parsedBody.data.tiktokQuery),
      youtubeService.fetchByQuery(parsedBody.data.youtubeQuery),
      instagramService.fetchByQuery(parsedBody.data.instagramQuery),
    ])

    const normalizedResponse: SocialApiResponse = {
      success: results.some((result) => result.data !== null),
      data: results,
    }

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