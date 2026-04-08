"use client"

import { Card, CardContent } from "@/components/ui/card"

import { useMonitoringDashboard } from "./hooks/useMonitoringDashboard"
import { MonitoringDashboardPanel } from "./components/MonitoringDashboardPanel"
import { MonitoringHeaderBits } from "./components/MonitoringHeaderBits"
import { MonitoringMetricBits } from "./components/MonitoringMetricBits"

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact" }).format(value)
}

export function MonitoringDashboard() {
  const { data, isLoading, isFetching, error, refresh } = useMonitoringDashboard()

  return (
    <section className="space-y-5">
      <MonitoringHeaderBits
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
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="h-28 animate-pulse bg-muted" />
          <Card className="h-28 animate-pulse bg-muted" />
          <Card className="h-28 animate-pulse bg-muted" />
        </div>
      ) : null}

      {data ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <MonitoringMetricBits
              label="Total Accounts"
              value={String(data.overview.totalAccounts)}
              tone="slate"
            />
            <MonitoringMetricBits
              label="Total Posts"
              value={String(data.overview.totalPosts)}
              tone="teal"
            />
            <MonitoringMetricBits
              label="Total Views"
              value={formatNumber(data.overview.totalViews)}
              tone="amber"
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
