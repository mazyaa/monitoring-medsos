"use client"

import { useQuery } from "@tanstack/react-query"
import { useEffect, useRef } from "react"
import { toast } from "sonner"

import { fetchMonitoringDashboard } from "../services/monitoring-api.service"

export function useMonitoringDashboard() {
  const lastSuccessToastAt = useRef(0)
  const lastErrorToastAt = useRef(0)

  const monitoringQuery = useQuery({
    queryKey: ["monitoring-dashboard"],
    queryFn: fetchMonitoringDashboard,
    staleTime: 20 * 1000,
  })

  useEffect(() => {
    const latestSuccessAt = monitoringQuery.dataUpdatedAt

    if (!latestSuccessAt || latestSuccessAt <= lastSuccessToastAt.current) {
      return
    }

    lastSuccessToastAt.current = latestSuccessAt
    toast.success("Monitoring data fetched successfully")
  }, [monitoringQuery.dataUpdatedAt])

  useEffect(() => {
    const latestErrorAt = monitoringQuery.errorUpdatedAt

    if (!latestErrorAt || latestErrorAt <= lastErrorToastAt.current) {
      return
    }

    lastErrorToastAt.current = latestErrorAt
    toast.error(monitoringQuery.error?.message || "Failed to fetch monitoring data")
  }, [monitoringQuery.error, monitoringQuery.errorUpdatedAt])

  return {
    data: monitoringQuery.data,
    isLoading: monitoringQuery.isLoading,
    isFetching: monitoringQuery.isFetching,
    error: monitoringQuery.error?.message,
    refresh: monitoringQuery.refetch,
  }
}
