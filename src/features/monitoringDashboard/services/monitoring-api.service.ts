import {
  monitoringDashboardResponseSchema,
  type MonitoringDashboardResponse,
} from "../types/monitoring.types"

const MONITORING_API_ENDPOINT = "/api/monitoring"

export async function fetchMonitoringDashboard(): Promise<MonitoringDashboardResponse["data"]> {
  const response = await fetch(MONITORING_API_ENDPOINT, {
    method: "GET",
  })

  const payload = await response.json()

  if (!response.ok) {
    const message =
      typeof payload?.message === "string" ? payload.message : "Failed to fetch monitoring data"
    throw new Error(message)
  }

  const parsed = monitoringDashboardResponseSchema.safeParse(payload)

  if (!parsed.success) {
    throw new Error("Received invalid monitoring response format")
  }

  return parsed.data.data
}
