import { Text, View } from "@/components/reactbits/primitives"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type {
  MonitoredAccount,
  MonitoredPost,
  PlatformMetric,
} from "../types/monitoring.types"

type MonitoringDashboardPanelProps = {
  platformBreakdown: PlatformMetric[]
  accounts: MonitoredAccount[]
  topPosts: MonitoredPost[]
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact" }).format(value)
}

function formatDate(value: string | null): string {
  if (!value) {
    return "-"
  }

  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(value))
}

function getPlatformAccent(platform: string): string {
  if (platform === "youtube") {
    return "bg-red-100 text-red-700 border-red-200"
  }

  if (platform === "instagram") {
    return "bg-pink-100 text-pink-700 border-pink-200"
  }

  if (platform === "tiktok") {
    return "bg-sky-100 text-sky-700 border-sky-200"
  }

  return "bg-slate-100 text-slate-700 border-slate-200"
}

export function MonitoringDashboardPanel({
  platformBreakdown,
  accounts,
  topPosts,
}: MonitoringDashboardPanelProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
      <Card className="border-slate-300/70 bg-white/80 shadow-sm">
        <CardHeader>
          <CardTitle>Platform Mapping</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {platformBreakdown.map((platform) => (
              <View key={platform.platform} style={{ display: "flex", rowGap: 8 }}>
                <div className={`inline-flex w-fit rounded-full border px-2 py-1 text-xs font-semibold capitalize ${getPlatformAccent(platform.platform)}`}>
                  {platform.platform}
                </div>
                <Text style={{ fontSize: 13, color: "#475569" }}>Accounts: {platform.accountCount}</Text>
                <Text style={{ fontSize: 13, color: "#475569" }}>Posts: {platform.postCount}</Text>
                <Text style={{ fontSize: 22, fontWeight: "700", color: "#0f172a" }}>
                  {formatNumber(platform.totalViews)}
                </Text>
              </View>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-300/70 bg-white/80 shadow-sm">
        <CardHeader>
          <CardTitle>Top Content (By Views)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada post di database.</p>
            ) : (
              topPosts.map((post) => (
                <a
                  key={post.id}
                  href={post.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-lg border border-border/70 px-3 py-2 transition hover:bg-slate-50"
                >
                  <p className="line-clamp-1 text-sm font-medium text-foreground">{post.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {post.accountName} • {post.platform} • {formatNumber(post.views)} views
                  </p>
                </a>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-300/70 bg-white/80 shadow-sm xl:col-span-2">
        <CardHeader>
          <CardTitle>Account Monitoring Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-170 text-left text-sm">
              <thead>
                <tr className="border-b border-border/70 text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="pb-2 font-semibold">Account</th>
                  <th className="pb-2 font-semibold">Platform</th>
                  <th className="pb-2 font-semibold">Posts</th>
                  <th className="pb-2 font-semibold">Views</th>
                  <th className="pb-2 font-semibold">Latest Post</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.id} className="border-b border-border/50">
                    <td className="py-3">
                      <p className="font-medium text-foreground">{account.accountName}</p>
                      <p className="text-xs text-muted-foreground">{account.username}</p>
                    </td>
                    <td className="py-3 capitalize">{account.platform}</td>
                    <td className="py-3">{account.postCount}</td>
                    <td className="py-3">{formatNumber(account.totalViews)}</td>
                    <td className="py-3">{formatDate(account.latestPostAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
