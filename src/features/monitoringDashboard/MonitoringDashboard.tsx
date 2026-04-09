"use client"

import { useMemo } from "react"

import MagicBento from "@/components/MagicBento"
import { Card, CardContent } from "@/components/ui/card"

import { useMonitoringDashboard } from "./hooks/useMonitoringDashboard"
import { MonitoringDashboardPanel } from "./components/MonitoringDashboardPanel"
import { MonitoringHeader } from "./components/MonitoringHeader"

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact" }).format(value)
}

const defaultBentoPlatforms = [
  { key: "youtube", label: "YouTube", title: "YouTube" },
  { key: "instagram", label: "Instagram", title: "Instagram" },
  { key: "tiktok", label: "TikTok", title: "TikTok" },
]

export function MonitoringDashboard() {
  const { data, isLoading, isFetching, error, refresh } = useMonitoringDashboard()

  const bentoItems = useMemo(() => {
    const platformMap = new Map(
      (data?.platformBreakdown ?? []).map((platform) => [platform.platform.toLowerCase(), platform])
    )

    return defaultBentoPlatforms.map((defaultPlatform) => {
      const platform = platformMap.get(defaultPlatform.key)

      if (!platform) {
        return {
          color: "#0b1220",
          label: defaultPlatform.label,
          title: defaultPlatform.title,
          description: "No synced account yet",
        }
      }

      return {
        color: "#0b1220",
        label: defaultPlatform.label,
        title: defaultPlatform.title,
        description: `${platform.accountCount} accounts • ${platform.postCount} posts • ${formatNumber(platform.totalViews)} views`,
      }
    })
  }, [data])

  return (
    <section className="space-y-4 sm:space-y-5">
      <MonitoringHeader
        onRefresh={() => {
          void refresh()
        }}
        refreshing={isFetching}
        lastSyncAt={data?.overview.latestSyncAt || null}
      />

      {error ? (
        <Card className="border-destructive/40 bg-destructive/10">
          <CardContent>
            <p className="py-2 text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      ) : null}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="h-28 animate-pulse bg-muted" />
          <Card className="h-28 animate-pulse bg-muted" />
          <Card className="h-28 animate-pulse bg-muted" />
        </div>
      ) : null}

      {data ? (
        <>
          <div className="rounded-2xl border border-slate-300/70 bg-slate-950/95 p-2 sm:p-3">
            <MagicBento
              items={bentoItems}
              textAutoHide={true}
              enableStars
              enableSpotlight
              enableBorderGlow={true}
              enableTilt={false}
              enableMagnetism={false}
              clickEffect
              spotlightRadius={400}
              particleCount={12}
              glowColor="132, 0, 255"
              disableAnimations={false}
            />
          </div>

          <MonitoringDashboardPanel
            platformBreakdown={data.platformBreakdown}
            accounts={data.accounts}
            topPosts={data.topPosts}
          />
        </>
      ) : null}
    </section>
  )
}
