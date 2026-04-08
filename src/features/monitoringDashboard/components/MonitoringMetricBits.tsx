import { Text, Touchable, View } from "@/components/reactbits/primitives"

type MonitoringMetricBitsProps = {
  label: string
  value: string
  tone?: "slate" | "teal" | "amber"
}

const TONE_CLASSES: Record<NonNullable<MonitoringMetricBitsProps["tone"]>, string> = {
  slate: "from-slate-100 to-slate-50 border-slate-300/80",
  teal: "from-teal-100 to-emerald-50 border-teal-300/80",
  amber: "from-amber-100 to-orange-50 border-amber-300/80",
}

export function MonitoringMetricBits({
  label,
  value,
  tone = "slate",
}: MonitoringMetricBitsProps) {
  return (
    <Touchable>
      <div className={`rounded-2xl border bg-linear-to-br p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${TONE_CLASSES[tone]}`}>
        <View style={{ display: "flex", rowGap: 4 }}>
          <Text style={{ fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: "#475569" }}>
            {label}
          </Text>
          <Text style={{ fontSize: 28, fontWeight: "700", color: "#0f172a" }}>{value}</Text>
        </View>
      </div>
    </Touchable>
  )
}
