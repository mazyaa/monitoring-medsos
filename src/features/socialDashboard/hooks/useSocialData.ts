"use client"

import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

import { fetchSocialDashboard } from "../services/social-api.service"
import {
  socialRequestSchema,
  type PlatformKey,
  type PlatformResult,
  type SocialPlatformData,
  type SocialRequestBody,
} from "../types/social.types"

const EMPTY_PLATFORM_DATA: Record<PlatformKey, SocialPlatformData | null> = {
  tiktok: null,
  youtube: null,
  instagram: null,
}

const INPUT_FIELD_LABELS: Record<keyof SocialRequestBody, string> = {
  tiktokQuery: "TikTok input",
  youtubeQuery: "YouTube input",
  instagramQuery: "Instagram input",
}

function areQueriesEqual(previous: SocialRequestBody, next: SocialRequestBody): boolean {
  return (
    previous.tiktokQuery === next.tiktokQuery &&
    previous.youtubeQuery === next.youtubeQuery &&
    previous.instagramQuery === next.instagramQuery
  )
}

function toPlatformDataMap(
  results: PlatformResult[]
): Record<PlatformKey, SocialPlatformData | null> {
  const normalizedData = { ...EMPTY_PLATFORM_DATA }

  for (const result of results) {
    normalizedData[result.platform] = result.data
  }

  return normalizedData
}

function toPlatformErrorMap(results: PlatformResult[]): Partial<Record<PlatformKey, string>> {
  const normalizedErrors: Partial<Record<PlatformKey, string>> = {}

  for (const result of results) {
    if (result.error) {
      normalizedErrors[result.platform] = result.error
    }
  }

  return normalizedErrors
}

export function useSocialData() {
  const [submittedQueries, setSubmittedQueries] = useState<SocialRequestBody | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const socialDataQuery = useQuery({
    queryKey: ["social-dashboard", submittedQueries],
    queryFn: async () => {
      if (!submittedQueries) {
        throw new Error("No social inputs provided")
      }

      return fetchSocialDashboard(submittedQueries)
    },
    enabled: hasSubmitted && submittedQueries !== null,
  })

  const submitQuery = (input: SocialRequestBody) => {
    const parsed = socialRequestSchema.safeParse(input)

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]
      const issuePath = firstIssue?.path?.[0]
      const issueFieldLabel =
        typeof issuePath === "string" && issuePath in INPUT_FIELD_LABELS
          ? INPUT_FIELD_LABELS[issuePath as keyof SocialRequestBody]
          : null

      setValidationError(
        issueFieldLabel ? `${issueFieldLabel}: ${firstIssue?.message}` : firstIssue?.message || "Please enter valid input"
      )
      return false
    }

    if (hasSubmitted && submittedQueries && areQueriesEqual(submittedQueries, parsed.data)) {
      void socialDataQuery.refetch()
      return true
    }

    setValidationError(null)
    setHasSubmitted(true)
    setSubmittedQueries(parsed.data)
    return true
  }

  const refresh = async () => {
    if (!hasSubmitted) {
      return
    }

    await socialDataQuery.refetch()
  }

  const platformResults = socialDataQuery.data?.data || []

  return {
    data: toPlatformDataMap(platformResults),
    platformErrors: toPlatformErrorMap(platformResults),
    requestError: socialDataQuery.error?.message,
    isLoading: socialDataQuery.isLoading,
    isFetching: socialDataQuery.isFetching,
    hasSubmitted,
    submittedQueries,
    validationError,
    submitQuery,
    refresh,
  }
}
