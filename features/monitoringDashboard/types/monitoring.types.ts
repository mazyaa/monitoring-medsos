import { z } from "zod"

export const monitoringOverviewSchema = z.object({
  totalAccounts: z.number().nonnegative(),
  totalPosts: z.number().nonnegative(),
  totalViews: z.number().nonnegative(),
  latestSyncAt: z.string().nullable(),
})

export const platformMetricSchema = z.object({
  platform: z.string(),
  accountCount: z.number().nonnegative(),
  postCount: z.number().nonnegative(),
  totalViews: z.number().nonnegative(),
})

export const monitoredAccountSchema = z.object({
  id: z.string(),
  platform: z.string(),
  username: z.string(),
  accountName: z.string(),
  profileImageUrl: z.string(),
  totalViews: z.number().nonnegative(),
  postCount: z.number().nonnegative(),
  latestPostAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
})

export const monitoredPostSchema = z.object({
  id: z.string(),
  platform: z.string(),
  accountName: z.string(),
  username: z.string(),
  title: z.string(),
  thumbnailUrl: z.string(),
  url: z.string().url(),
  views: z.number().nonnegative(),
  publishedAt: z.string().nullable(),
})

export const monitoringDashboardResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    overview: monitoringOverviewSchema,
    platformBreakdown: z.array(platformMetricSchema),
    accounts: z.array(monitoredAccountSchema),
    topPosts: z.array(monitoredPostSchema),
  }),
})

export type MonitoringOverview = z.infer<typeof monitoringOverviewSchema>
export type PlatformMetric = z.infer<typeof platformMetricSchema>
export type MonitoredAccount = z.infer<typeof monitoredAccountSchema>
export type MonitoredPost = z.infer<typeof monitoredPostSchema>
export type MonitoringDashboardResponse = z.infer<typeof monitoringDashboardResponseSchema>
