"use client"

import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
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

const ACCOUNTS_PER_PAGE = 8
function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact" }).format(value)
}

function formatDate(value: string | null): string {
  if (!value) {
    return "-"
  }

  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(value))
}

export function MonitoringDashboardPanel({
  accounts,
  topPosts,
}: MonitoringDashboardPanelProps) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(accounts.length / ACCOUNTS_PER_PAGE))
  const safeCurrentPage = Math.min(currentPage, totalPages)

  const paginatedAccounts = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ACCOUNTS_PER_PAGE
    return accounts.slice(startIndex, startIndex + ACCOUNTS_PER_PAGE)
  }, [accounts, safeCurrentPage])

  const startItem = accounts.length === 0 ? 0 : (safeCurrentPage - 1) * ACCOUNTS_PER_PAGE + 1
  const endItem = Math.min(safeCurrentPage * ACCOUNTS_PER_PAGE, accounts.length)

  return (
    <div className="grid gap-4 w-full md:grid-cols-2 lg:grid-cols-3">
      <Card className="border-border/80 bg-card/85 shadow-sm backdrop-blur-sm">
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
                  className="block rounded-lg border border-border/80 bg-background/40 px-3 py-2 transition hover:bg-accent/50"
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

      <Card className="border-border/80 bg-card/85 shadow-sm backdrop-blur-sm xl:col-span-2">
        <CardHeader>
          <CardTitle>Account Monitoring</CardTitle>
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
                {paginatedAccounts.length === 0 ? (
                  <tr className="border-b border-border/50">
                    <td colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                      No accounts found.
                    </td>
                  </tr>
                ) : (
                  paginatedAccounts.map((account) => (
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
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Showing {startItem}-{endItem} of {accounts.length} accounts
            </p>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={safeCurrentPage === 1}
                onClick={() => {
                  setCurrentPage((previous) => Math.max(1, Math.min(previous, totalPages) - 1))
                }}
              >
                Previous
              </Button>

              <span className="min-w-24 text-center text-xs text-muted-foreground">
                Page {safeCurrentPage} / {totalPages}
              </span>

              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={safeCurrentPage === totalPages}
                onClick={() => {
                  setCurrentPage((previous) => Math.min(totalPages, Math.min(previous, totalPages) + 1))
                }}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
