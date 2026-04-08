import { instagramService } from "@/server/services/instagram.service"

export async function syncInstagramAccount(query: string) {
  return instagramService.fetchByQuery(query)
}
