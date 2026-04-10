import { API_SOCIAL_ENDPOINT } from "../constants/social.constants"
import {
  socialApiResponseSchema,
  type SocialApiResponse,
  type SocialRequestBody,
} from "../types/social.types"

export async function fetchSocialDashboard(queries: SocialRequestBody): Promise<SocialApiResponse> {
  const response = await fetch(API_SOCIAL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(queries),
  })

  const payload = await response.json()

  if (!response.ok) {
    const message =
      typeof payload?.message === "string" ? payload.message : "Failed to fetch social data"
    throw new Error(message)
  }

  const parsed = socialApiResponseSchema.safeParse(payload)

  if (!parsed.success) {
    throw new Error("Received invalid API response format")
  }

  return parsed.data
}
