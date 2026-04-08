import { Touchable, View } from "@/components/reactbits/primitives"

import { Button } from "@/components/ui/button"

type MonitoringHeaderBitsProps = {
  onRefresh: () => void
  refreshing: boolean
  lastSyncAt: string | null
}

function formatLastSync(value: string | null): string {
  if (!value) {
    return "No synchronization timestamp"
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export function MonitoringHeaderBits({ onRefresh, refreshing, lastSyncAt }: MonitoringHeaderBitsProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-300/70 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_60%,#334155_100%)] p-6 text-white shadow-lg">
      <View style={{ display: "flex", rowGap: 10 }}>
        <div className="inline-flex w-fit rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold tracking-[0.18em] uppercase">
          ReactBits Monitoring
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">Operational Social Monitoring</h2>
        <p className="max-w-2xl text-sm text-slate-100/90">
          Pantau performa akun lintas platform langsung dari data database yang telah tersinkronisasi.
        </p>
      </View>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm">
          Last sync: {formatLastSync(lastSyncAt)}
        </div>

        {/* Touchable from local ReactBits-style primitives is used as the interaction shell, while Button keeps existing design system behavior. */}
        <Touchable onPress={onRefresh}>
          <div>
            <Button type="button" size="lg" className="bg-white text-slate-900 hover:bg-slate-100" disabled={refreshing}>
              {refreshing ? "Refreshing..." : "Refresh Monitoring"}
            </Button>
          </div>
        </Touchable>
      </div>
    </div>
  )
}
