import { NextResponse } from "next/server"

import { socialPlatformRequestSchema } from "@/server/services/social.schemas"
import { tiktokService } from "@/server/services/tiktok.service"

export async function POST(request: Request) {
  const payload = await request.json()
  const parsed = socialPlatformRequestSchema.safeParse(payload)

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: parsed.error.issues[0]?.message || "Invalid request",
      },
      {
        status: 400,
      }
    )
  }

  const result = await tiktokService.fetchByQuery(parsed.data.query)

  return NextResponse.json(
    {
      success: result.data !== null,
      data: result,
    },
    {
      status: 501,
    }
  )
}
