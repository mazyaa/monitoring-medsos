import { youtubeService } from "@/server/services/youtube.service"

export async function syncYoutubeChannel(query: string) {
  return youtubeService.fetchByQuery(query)
}
