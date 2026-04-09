"use client"

import { useQuery } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

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

export function useSocialData(initialQueries: SocialRequestBody | null = null) {
  const [submittedQueries, setSubmittedQueries] = useState<SocialRequestBody | null>(initialQueries)
  const [hasSubmitted, setHasSubmitted] = useState(Boolean(initialQueries))
  const [validationError, setValidationError] = useState<string | null>(null)
  const lastSuccessToastAt = useRef(0)
  const lastErrorToastAt = useRef(0)
  const lastValidationToastMessage = useRef<string | null>(null)

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

  useEffect(() => {
    if (!hasSubmitted) {
      return
    }

    const latestSuccessAt = socialDataQuery.dataUpdatedAt

    if (!latestSuccessAt || latestSuccessAt <= lastSuccessToastAt.current) {
      return
    }

    lastSuccessToastAt.current = latestSuccessAt
    const platformResults = socialDataQuery.data?.data || []

    if (platformResults.length === 0) {
      toast.info("Request completed but no social data was returned")
      return
    }

    const failedPlatforms = platformResults.filter((result) => Boolean(result.error))

    if (failedPlatforms.length === 0) {
      toast.success("Social data fetched successfully")
      return
    }

    if (failedPlatforms.length === platformResults.length) {
      toast.error("Failed to fetch social data from all platforms")
      return
    }

    toast.warning(
      `Fetched with issues on ${failedPlatforms.map((result) => result.platform).join(", ")}`
    )
  }, [hasSubmitted, socialDataQuery.data, socialDataQuery.dataUpdatedAt])

  useEffect(() => {
    if (!hasSubmitted) {
      return
    }

    const latestErrorAt = socialDataQuery.errorUpdatedAt

    if (!latestErrorAt || latestErrorAt <= lastErrorToastAt.current) {
      return
    }

    lastErrorToastAt.current = latestErrorAt
    toast.error(socialDataQuery.error?.message || "Failed to fetch social dashboard data")
  }, [hasSubmitted, socialDataQuery.error, socialDataQuery.errorUpdatedAt])

  const submitQuery = (input: SocialRequestBody) => {
    const parsed = socialRequestSchema.safeParse(input)

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]
      const issuePath = firstIssue?.path?.[0]
      const issueFieldLabel =
        typeof issuePath === "string" && issuePath in INPUT_FIELD_LABELS
          ? INPUT_FIELD_LABELS[issuePath as keyof SocialRequestBody]
          : null

      const validationMessage =
        issueFieldLabel
          ? `${issueFieldLabel}: ${firstIssue?.message}`
          : firstIssue?.message || "Please enter valid input"

      setValidationError(validationMessage)

      if (validationMessage !== lastValidationToastMessage.current) {
        toast.info(validationMessage)
        lastValidationToastMessage.current = validationMessage
      }

      return false
    }

    if (hasSubmitted && submittedQueries && areQueriesEqual(submittedQueries, parsed.data)) {
      void socialDataQuery.refetch()
      return true
    }

    setValidationError(null)
    lastValidationToastMessage.current = null
    setHasSubmitted(true)
    setSubmittedQueries(parsed.data)
    return true
  }

  const clearResults = () => {
    setHasSubmitted(false)
    setSubmittedQueries(null)
    setValidationError(null)
    lastValidationToastMessage.current = null
  }

  const refetchResults = async () => {
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
    refetchResults,
    clearResults,
  }
}
