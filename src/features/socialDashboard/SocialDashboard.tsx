"use client"

import { Card, CardContent } from "@/components/ui/card"

import { PLATFORM_LABELS, PLATFORM_ORDER } from "./constants/social.constants"
import { InputForm, SocialCard } from "./components"
import { useSocialData } from "./hooks/useSocialData"
import type { SocialRequestBody } from "./types/social.types"

type SocialDashboardProps = {
  initialQueries?: SocialRequestBody | null
  showInputForm?: boolean
}

export function SocialDashboard({
  initialQueries = null,
  showInputForm = true,
}: SocialDashboardProps) {
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
    refetchResults,
    clearResults,
  } = useSocialData(initialQueries)

  const cardsAreLoading = isLoading || (isFetching && !requestError)

  return (
    <section className="space-y-6">
      {showInputForm ? (
        <InputForm
          onSubmit={submitQuery}
          onRefetch={refetchResults}
          onClearResults={clearResults}
          disabled={isLoading}
          canRefetch={hasSubmitted}
          canClearResults={hasSubmitted}
          validationError={validationError}
          initialQueries={submittedQueries || undefined}
        />
      ) : null}

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

      {hasSubmitted ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {PLATFORM_ORDER.map((platform) => (
            <SocialCard
              key={platform}
              platform={platform}
              platformLabel={PLATFORM_LABELS[platform]}
              data={data[platform]}
              error={platformErrors?.[platform]}
              isLoading={cardsAreLoading}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}
