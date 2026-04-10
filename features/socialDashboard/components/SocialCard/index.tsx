import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import { ContentList } from "../ContentList"
import type { PlatformKey, SocialPlatformData } from "../../types/social.types"

type SocialCardProps = {
  platform: PlatformKey
  platformLabel: string
  data: SocialPlatformData | null
  error?: string
  isLoading?: boolean
}

function formatViews(views: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact" }).format(views)
}

export function SocialCard({ platform, platformLabel, data, error, isLoading = false }: SocialCardProps) {
  const showLatestPostLabel =
    (data?.latestContents.length || 0) === 0 &&
    (platform === "tiktok" || platform === "instagram")

  return (
    <Card className="h-full border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle>{platformLabel}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : null}

        {!isLoading && error ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {!isLoading && !error && !data ? (
          <p className="text-sm text-muted-foreground">No data found for this platform.</p>
        ) : null}

        {!isLoading && data ? (
          <>
            <div className="flex items-center gap-3">
              {/* Dynamic external URLs from multiple providers are shown as-is. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.profileImageUrl}
                alt={`${data.accountName} avatar`}
                className="size-12 rounded-full border border-border object-cover"
              />
              <div>
                <p className="font-semibold text-foreground">{data.accountName}</p>
                <p className="text-sm text-muted-foreground">{data.username}</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Total views: <span className="font-semibold text-foreground">{formatViews(data.totalViews)}</span>
            </p>

            {showLatestPostLabel ? (
              <p className="inline-flex w-fit rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                Belum ada postingan terbaru
              </p>
            ) : null}

            <ContentList items={data.latestContents} emptyMessage={showLatestPostLabel ? null : undefined} />
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}
