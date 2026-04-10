type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readPathSegment(source: unknown, segment: string): unknown {
  if (Array.isArray(source)) {
    const index = Number(segment)

    if (!Number.isInteger(index)) {
      return undefined
    }

    return source[index]
  }

  if (!isRecord(source)) {
    return undefined
  }

  const indexedMatch = /^([^\[\]]+)\[(\d+)\]$/.exec(segment)

  if (indexedMatch) {
    const [, key, indexText] = indexedMatch
    const nestedValue = source[key]

    if (!Array.isArray(nestedValue)) {
      return undefined
    }

    const index = Number(indexText)
    return nestedValue[index]
  }

  return source[segment]
}

export function getPathValue(payload: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((source, segment) => readPathSegment(source, segment), payload)
}

export function pickFirstString(payload: unknown, paths: string[]): string | null {
  for (const path of paths) {
    const value = getPathValue(payload, path)

    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim()
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value)
    }
  }

  return null
}

export function pickFirstNumber(payload: unknown, paths: string[]): number | null {
  for (const path of paths) {
    const value = getPathValue(payload, path)

    if (typeof value === "number" && Number.isFinite(value)) {
      return value
    }

    if (typeof value === "string") {
      const normalized = Number(value)

      if (Number.isFinite(normalized)) {
        return normalized
      }
    }
  }

  return null
}

export function toSafeNumber(value: unknown): number {
  const normalized = typeof value === "string" ? Number(value) : value

  if (typeof normalized !== "number" || !Number.isFinite(normalized) || normalized < 0) {
    return 0
  }

  return normalized
}

export function normalizeHandle(value: string): string {
  return value.trim().toLowerCase().replace(/^@+/, "")
}

export function toDateOrNull(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const epochMs = value > 10_000_000_000 ? value : value * 1_000
    const date = new Date(epochMs)
    return Number.isNaN(date.getTime()) ? null : date
  }

  if (typeof value === "string") {
    const trimmed = value.trim()

    if (!trimmed) {
      return null
    }

    const maybeNumber = Number(trimmed)

    if (Number.isFinite(maybeNumber) && trimmed.length >= 10) {
      return toDateOrNull(maybeNumber)
    }

    const parsed = new Date(trimmed)

    if (!Number.isNaN(parsed.getTime())) {
      return parsed
    }
  }

  return null
}

export function toDate(value: unknown): Date {
  return toDateOrNull(value) ?? new Date()
}

type SortablePost = {
  id: string
  createdAt: Date
  hasTimestamp: boolean
}

export function sortPostsByLatestDeterministic<T extends SortablePost>(posts: readonly T[]): T[] {
  const sorted = [...posts]

  sorted.sort((first, second) => {
    if (first.hasTimestamp !== second.hasTimestamp) {
      return first.hasTimestamp ? -1 : 1
    }

    const timestampDiff = second.createdAt.getTime() - first.createdAt.getTime()

    if (timestampDiff !== 0) {
      return timestampDiff
    }

    return first.id.localeCompare(second.id)
  })

  return sorted
}
