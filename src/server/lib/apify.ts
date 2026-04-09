import { FetcherError, fetchJson } from "@/server/lib/fetcher"

const APIFY_BASE_URL = (process.env.APIFY_BASE_URL || "https://api.apify.com/v2").replace(/\/$/, "")
const DEFAULT_WAIT_TIMEOUT_MS = 120_000
const DEFAULT_POLL_INTERVAL_MS = 2_000

type ApifyApiEnvelope<T> = {
  data: T
}

type ApifyRunStatus =
  | "READY"
  | "RUNNING"
  | "SUCCEEDED"
  | "FAILED"
  | "ABORTED"
  | "TIMING-OUT"
  | "TIMED-OUT"

export type ApifyActorRun = {
  id: string
  status: ApifyRunStatus
  defaultDatasetId?: string
}

type RunActorOptions = {
  timeoutMs?: number
  pollIntervalMs?: number
}

function getApifyToken(): string {
  const token = process.env.APIFY_TOKEN

  if (!token) {
    throw new Error("Missing APIFY_TOKEN environment variable")
  }

  return token
}

function toActorPath(actorId: string): string {
  const normalizedActorId = actorId.trim()

  if (!normalizedActorId) {
    throw new Error("Actor id is required")
  }

  // Apify actor ids often use "username/actor-name" and must be passed as a single encoded segment.
  return encodeURIComponent(normalizedActorId)
}

function isRunCompleted(status: ApifyRunStatus): boolean {
  return status === "SUCCEEDED" || status === "FAILED" || status === "ABORTED" || status === "TIMED-OUT"
}

async function getRunById(runId: string): Promise<ApifyActorRun> {
  const token = getApifyToken()
  const endpoint = `${APIFY_BASE_URL}/actor-runs/${encodeURIComponent(runId)}?token=${encodeURIComponent(token)}`
  const payload = await fetchJson<ApifyApiEnvelope<ApifyActorRun>>(endpoint)

  return payload.data
}

async function waitForRunCompletion(
  runId: string,
  timeoutMs: number,
  pollIntervalMs: number
): Promise<ApifyActorRun> {
  const startedAt = Date.now()

  while (Date.now() - startedAt <= timeoutMs) {
    const run = await getRunById(runId)

    if (isRunCompleted(run.status)) {
      if (run.status !== "SUCCEEDED") {
        throw new Error(`Apify run ${run.id} ended with status ${run.status}`)
      }

      return run
    }

    await new Promise<void>((resolve) => {
      setTimeout(resolve, pollIntervalMs)
    })
  }

  throw new Error(`Apify run ${runId} did not complete within ${timeoutMs}ms`)
}

export async function runActor(
  actorId: string,
  input: Record<string, unknown>,
  options: RunActorOptions = {}
): Promise<ApifyActorRun> {
  const token = getApifyToken()
  const timeoutMs = options.timeoutMs ?? DEFAULT_WAIT_TIMEOUT_MS
  const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS

  const actorPath = toActorPath(actorId)
  const endpoint = `${APIFY_BASE_URL}/acts/${actorPath}/runs?token=${encodeURIComponent(token)}`

  let payload: ApifyApiEnvelope<ApifyActorRun>

  try {
    payload = await fetchJson<ApifyApiEnvelope<ApifyActorRun>>(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    })
  } catch (error) {
    if (error instanceof FetcherError && error.status === 404) {
      throw new Error(`Apify actor "${actorId}" not found`)
    }

    throw error
  }

  const startedRun = payload.data

  if (!startedRun?.id) {
    throw new Error("Apify actor run did not return a valid run id")
  }

  if (isRunCompleted(startedRun.status)) {
    if (startedRun.status !== "SUCCEEDED") {
      throw new Error(`Apify run ${startedRun.id} ended with status ${startedRun.status}`)
    }

    return startedRun
  }

  return waitForRunCompletion(startedRun.id, timeoutMs, pollIntervalMs)
}

export async function getDatasetItems(datasetId: string): Promise<unknown[]> {
  const token = getApifyToken()
  const endpoint = `${APIFY_BASE_URL}/datasets/${encodeURIComponent(datasetId)}/items?token=${encodeURIComponent(
    token
  )}&clean=true`

  return fetchJson<unknown[]>(endpoint)
}
