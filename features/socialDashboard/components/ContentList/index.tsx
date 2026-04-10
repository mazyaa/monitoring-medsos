import type { SocialContent } from "../../types/social.types"

type ContentListProps = {
  items: SocialContent[]
  emptyMessage?: string | null
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact" }).format(value)
}

export function ContentList({ items, emptyMessage = "Tidak ada konten untuk saat ini." }: ContentListProps) {
  if (items.length === 0) {
    if (emptyMessage === null) {
      return null
    }

    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id} className="rounded-lg border border-border/70 p-3">
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="line-clamp-1 text-sm font-medium text-foreground hover:underline"
          >
            {item.title}
          </a>
          <p className="mt-1 text-xs text-muted-foreground">Views: {formatNumber(item.views)}</p>
        </li>
      ))}
    </ul>
  )
}
