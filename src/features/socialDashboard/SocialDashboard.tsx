"use client"

import { Card, CardContent } from "@/components/ui/card"

import { PLATFORM_LABELS, PLATFORM_ORDER } from "./constants/social.constants"
import { InputForm, SocialCard } from "./components"
import { useSocialData } from "./hooks/useSocialData"

export function SocialDashboard() {
  const {
    data,
    platformErrors,
    requestError,
    hasSubmitted,
    submittedQueries,
    validationError,
    isLoading,
    isFetching,
    submitQuery,
    refresh,
  } = useSocialData()

  const cardsAreLoading = isLoading || (isFetching && !requestError)

  return (
    <section className="space-y-6">
      <InputForm
        onSubmit={submitQuery}
        onRefresh={refresh}
        disabled={isLoading}
        canRefresh={hasSubmitted}
        validationError={validationError}
      />

      {!hasSubmitted ? (
        <Card className="border-dashed border-border/80 bg-background/70">
          <CardContent>
            <p className="py-8 text-center text-sm text-muted-foreground">
              Enter separate inputs for TikTok, YouTube, and Instagram to load social data.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {requestError ? (
        <Card className="border-destructive/30 bg-destructive/10">
          <CardContent>
            <p className="py-2 text-sm text-destructive">{requestError}</p>
          </CardContent>
        </Card>
      ) : null}

      {hasSubmitted && submittedQueries ? (
        <p className="text-sm text-muted-foreground">
          Showing results for
          <span className="font-semibold text-foreground"> TikTok: {submittedQueries.tiktokQuery}</span>
          <span className="text-foreground"> | </span>
          <span className="font-semibold text-foreground">YouTube: {submittedQueries.youtubeQuery}</span>
          <span className="text-foreground"> | </span>
          <span className="font-semibold text-foreground">Instagram: {submittedQueries.instagramQuery}</span>
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {PLATFORM_ORDER.map((platform) => (
          <SocialCard
            key={platform}
            platform={platform}
            platformLabel={PLATFORM_LABELS[platform]}
            data={data[platform]}
            error={platformErrors?.[platform]}
            isLoading={hasSubmitted ? cardsAreLoading : false}
          />
        ))}
      </div>
    </section>
  )
}
