import { tiktokService } from "@/server/services/tiktok.service"

export async function syncTikTokAccount(query: string) {
  return tiktokService.fetchByQuery(query)
}
