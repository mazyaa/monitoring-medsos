"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { SocialRequestBody } from "../../types/social.types"

type InputFormProps = {
  onSubmit: (queries: SocialRequestBody) => boolean | Promise<boolean>
  onRefresh: () => void
  disabled?: boolean
  canRefresh?: boolean
  validationError?: string | null
}

export function InputForm({
  onSubmit,
  onRefresh,
  disabled = false,
  canRefresh = false,
  validationError,
}: InputFormProps) {
  const [queries, setQueries] = useState<SocialRequestBody>({
    tiktokQuery: "",
    youtubeQuery: "",
    instagramQuery: "",
  })

  const handleInputChange =
    (field: keyof SocialRequestBody) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setQueries((previous) => ({
        ...previous,
        [field]: event.target.value,
      }))
    }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (disabled) {
      return
    }

    await onSubmit(queries)
  }

  const canSubmit =
    Object.values(queries).every((query) => query.trim().length >= 2) && !disabled

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="grid gap-3 md:grid-cols-3">
        <Input
          value={queries.tiktokQuery}
          onChange={handleInputChange("tiktokQuery")}
          placeholder="TikTok username or keyword"
          className="h-10"
        />
        <Input
          value={queries.youtubeQuery}
          onChange={handleInputChange("youtubeQuery")}
          placeholder="YouTube channel keyword"
          className="h-10"
        />
        <Input
          value={queries.instagramQuery}
          onChange={handleInputChange("instagramQuery")}
          placeholder="Instagram username or keyword"
          className="h-10"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" size="lg" disabled={!canSubmit}>
          Fetch Data
        </Button>
        <Button type="button" size="lg" variant="outline" onClick={onRefresh} disabled={!canRefresh || disabled}>
          Refresh
        </Button>
      </div>
      {validationError ? <p className="text-sm text-destructive">{validationError}</p> : null}
    </form>
  )
}
