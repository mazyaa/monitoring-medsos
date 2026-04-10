import { NextResponse } from "next/server"

import { prisma } from "@/server/lib/prisma"

export const runtime = "nodejs"

function toIsoString(value: Date | null): string | null {
  if (!value) {
    return null
  }

  return value.toISOString()
}

export async function GET() {
  try {
    const socialAccounts = await prisma.socialAccount.findMany({
      orderBy: [{ totalViews: "desc" }, { updatedAt: "desc" }],
      include: {
        posts: {
          orderBy: [{ publishedAt: "desc" }],
        },
      },
    })

    const totalAccounts = socialAccounts.length
    const totalPosts = socialAccounts.reduce((sum, account) => sum + account.posts.length, 0)
    const totalViews = socialAccounts.reduce((sum, account) => sum + account.totalViews, 0)

    const latestSyncAt = socialAccounts.reduce<Date | null>((latest, account) => {
      if (!latest || account.updatedAt > latest) {
        return account.updatedAt
      }

      return latest
    }, null)

    const platformMap = new Map<string, { accountCount: number; postCount: number; totalViews: number }>()

    for (const account of socialAccounts) {
      const current = platformMap.get(account.platform) || {
        accountCount: 0,
        postCount: 0,
        totalViews: 0,
      }

      platformMap.set(account.platform, {
        accountCount: current.accountCount + 1,
        postCount: current.postCount + account.posts.length,
        totalViews: current.totalViews + account.totalViews,
      })
    }

    const platformBreakdown = Array.from(platformMap.entries())
      .map(([platform, metrics]) => ({
        platform,
        accountCount: metrics.accountCount,
        postCount: metrics.postCount,
        totalViews: metrics.totalViews,
      }))
      .sort((first, second) => second.totalViews - first.totalViews)

    const accounts = socialAccounts.map((account) => ({
      id: account.id,
      platform: account.platform,
      username: account.username,
      accountName: account.accountName,
      profileImageUrl: account.profileImageUrl,
      totalViews: account.totalViews,
      postCount: account.posts.length,
      latestPostAt: toIsoString(account.posts[0]?.publishedAt || null),
      updatedAt: toIsoString(account.updatedAt),
    }))

    const topPosts = socialAccounts
      .flatMap((account) =>
        account.posts.map((post) => ({
          id: post.id,
          platform: account.platform,
          accountName: account.accountName,
          username: account.username,
          title: post.title,
          thumbnailUrl: post.thumbnailUrl,
          url: post.url,
          views: post.views,
          publishedAt: toIsoString(post.publishedAt),
        }))
      )
      .sort((first, second) => second.views - first.views)
      .slice(0, 8)

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalAccounts,
          totalPosts,
          totalViews,
          latestSyncAt: toIsoString(latestSyncAt),
        },
        platformBreakdown,
        accounts,
        topPosts,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load monitoring data"

    return NextResponse.json(
      {
        success: false,
        message,
      },
      {
        status: 500,
      }
    )
  }
}
