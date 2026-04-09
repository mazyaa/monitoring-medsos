"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SocialRequestBody } from "../../types/social.types";

type InputFormProps = {
  onSubmit: (queries: SocialRequestBody) => boolean | Promise<boolean>;
  onRefetch?: () => void | Promise<void>;
  onClearResults?: () => void | Promise<void>;
  disabled?: boolean;
  canRefetch?: boolean;
  canClearResults?: boolean;
  showRefetch?: boolean;
  showClearResults?: boolean;
  submitLabel?: string;
  initialQueries?: SocialRequestBody;
  validationError?: string | null;
};

export function InputForm({
  onSubmit,
  onRefetch,
  onClearResults,
  disabled = false,
  canRefetch = false,
  canClearResults = false,
  showRefetch = true,
  showClearResults = true,
  submitLabel = "Fetch Data",
  initialQueries,
  validationError,
}: InputFormProps) {
  const resolveInitialQueries = (): SocialRequestBody => ({
    tiktokQuery: initialQueries?.tiktokQuery || "",
    youtubeQuery: initialQueries?.youtubeQuery || "",
    instagramQuery: initialQueries?.instagramQuery || "",
  });

  const [queries, setQueries] = useState<SocialRequestBody>(() =>
    resolveInitialQueries(),
  );

  const handleInputChange =
    (field: keyof SocialRequestBody) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setQueries((previous) => ({
        ...previous,
        [field]: event.target.value,
      }));
    };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (disabled) {
      return;
    }

    await onSubmit(queries);
  };

  const emptyQueries: SocialRequestBody = {
    tiktokQuery: "",
    youtubeQuery: "",
    instagramQuery: "",
  };

  const handleClearInput = () => {
    if (disabled) {
      return;
    }

    setQueries(emptyQueries);
  };

  const canSubmit =
    Object.values(queries).every((query) => query.trim().length >= 2) &&
    !disabled;

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

      <div className="flex pt-3 gap-3 flex-col justify-between lg:flex-row">
        <div className="flex gap-3 flex-col lg:flex-row">
          <Button type="submit" size="lg" disabled={!canSubmit}>
            {submitLabel}
          </Button>
          {showRefetch ? (
            <Button
              type="button"
              size="lg"
              className="bg-green-600"
              onClick={() => {
                if (!onRefetch) {
                  return;
                }

                void onRefetch();
              }}
              disabled={!canRefetch || disabled}
            >
              Refetch Data
            </Button>
          ) : null}
        </div>
        {showClearResults ? (
          <Button
            type="button"
            size="lg"
            variant="outline"
            onClick={() => {
              handleClearInput();
              if (!onClearResults) {
                return;
              }

              void onClearResults();
            }}
            disabled={!canClearResults || disabled}
          >
            Remove Results
          </Button>
        ) : null}
      </div>
      {validationError ? (
        <p className="text-sm text-destructive">{validationError}</p>
      ) : null}
    </form>
  );
}
