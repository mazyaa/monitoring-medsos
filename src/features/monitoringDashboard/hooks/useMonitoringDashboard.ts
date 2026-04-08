"use client"

import { useQuery } from "@tanstack/react-query"

import { fetchMonitoringDashboard } from "../services/monitoring-api.service"

export function useMonitoringDashboard() {
  const monitoringQuery = useQuery({
    queryKey: ["monitoring-dashboard"],
    queryFn: fetchMonitoringDashboard,
    staleTime: 20 * 1000,
  })

  return {
    data: monitoringQuery.data,
    isLoading: monitoringQuery.isLoading,
    isFetching: monitoringQuery.isFetching,
    error: monitoringQuery.error?.message,
    refresh: monitoringQuery.refetch,
  }
}
