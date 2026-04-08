"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

import { InputForm } from "./components"
import { socialRequestSchema, type SocialRequestBody } from "./types/social.types"

const INPUT_FIELD_LABELS: Record<keyof SocialRequestBody, string> = {
  tiktokQuery: "TikTok input",
  youtubeQuery: "YouTube input",
  instagramQuery: "Instagram input",
}

export function SocialInputPage() {
  const router = useRouter()
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (queries: SocialRequestBody) => {
    const parsed = socialRequestSchema.safeParse(queries)

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]
      const issuePath = firstIssue?.path?.[0]
      const issueFieldLabel =
        typeof issuePath === "string" && issuePath in INPUT_FIELD_LABELS
          ? INPUT_FIELD_LABELS[issuePath as keyof SocialRequestBody]
          : null

      const message =
        issueFieldLabel
          ? `${issueFieldLabel}: ${firstIssue?.message}`
          : firstIssue?.message || "Please enter valid input"

      setValidationError(message)
      toast.info(message)
      return false
    }

    setValidationError(null)
    setIsSubmitting(true)

    const searchParams = new URLSearchParams(parsed.data)
    router.push(`/social/dashboard?${searchParams.toString()}`)

    return true
  }

  return (
    <section className="space-y-6">
      <Card className="border-border/80 bg-background/80">
        <CardHeader>
          <CardTitle>Input Social Query</CardTitle>
          <CardDescription>
            Fill TikTok, YouTube, and Instagram query, then open dashboard page to fetch and inspect results.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InputForm
            onSubmit={handleSubmit}
            disabled={isSubmitting}
            showRefresh={false}
            submitLabel="Open Dashboard"
            validationError={validationError}
          />
        </CardContent>
      </Card>
    </section>
  )
}
