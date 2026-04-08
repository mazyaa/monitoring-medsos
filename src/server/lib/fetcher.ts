export class FetcherError extends Error {
  readonly status: number
  readonly details?: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.name = "FetcherError"
    this.status = status
    this.details = details
  }
}

type FetchJsonOptions = RequestInit & {
  body?: BodyInit | Record<string, unknown>
}

function parsePayloadBody(body?: BodyInit | Record<string, unknown>): BodyInit | undefined {
  if (body === undefined) {
    return undefined
  }

  if (typeof body === "string" || body instanceof FormData || body instanceof URLSearchParams) {
    return body
  }

  if (
    body instanceof Blob ||
    body instanceof ReadableStream ||
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body)
  ) {
    return body
  }

  return JSON.stringify(body)
}

export async function fetchJson<T>(url: string, options: FetchJsonOptions = {}): Promise<T> {
  const headers = new Headers(options.headers)
  const payloadBody = parsePayloadBody(options.body)

  if (payloadBody && typeof options.body === "object" && !(options.body instanceof FormData)) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json")
    }
  }

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json")
  }

  const response = await fetch(url, {
    ...options,
    headers,
    body: payloadBody,
    cache: options.cache ?? "no-store",
  })

  const textPayload = await response.text()

  let jsonPayload: unknown = null
  if (textPayload.length > 0) {
    try {
      jsonPayload = JSON.parse(textPayload)
    } catch {
      if (!response.ok) {
        throw new FetcherError(
          `Request failed with status ${response.status} and non-JSON body`,
          response.status,
          textPayload
        )
      }

      throw new FetcherError("Response payload is not valid JSON", response.status, textPayload)
    }
  }

  if (!response.ok) {
    const message =
      typeof (jsonPayload as { message?: unknown })?.message === "string"
        ? ((jsonPayload as { message: string }).message as string)
        : `Request failed with status ${response.status}`

    throw new FetcherError(message, response.status, jsonPayload)
  }

  return jsonPayload as T
}
