"use client";

import useSWR from "swr";

export type MetricsRange =
  | "5m"
  | "30m"
  | "1h"
  | "3h"
  | "6h"
  | "12h"
  | "24h"
  | "7d"
  | "30d"
  | "90d"
  | "365d";

export type TokenSummary = {
  total: number;
  input: number;
  output: number;
  reasoning: number;
  cacheRead: number;
  cacheWrite: number;
  billable: number;
  additions: number;
  deletions: number;
  filesChanged: number;
};

export type TokenSummaryChanges = {
  total: number;
  input: number;
  output: number;
  reasoning: number;
  cacheRead: number;
  cacheWrite: number;
  billable: number;
  additions: number;
  deletions: number;
  filesChanged: number;
};

export type TokenBreakdown = {
  name: string;
  value: number;
};

export type TokenMetrics = {
  summary: TokenSummary;
  changes: TokenSummaryChanges;
  previousSummary: TokenSummary;
  agents: TokenBreakdown[];
  models: TokenBreakdown[];
  projects: TokenBreakdown[];
  timeline: Array<{
    time: string;
    total_tokens?: number;
    input_tokens?: number;
    output_tokens?: number;
    billable_tokens?: number;
    reasoning_tokens?: number;
    cache_read_tokens?: number;
    cache_write_tokens?: number;
    additions?: number;
    deletions?: number;
    files_changed?: number;
  }>;
};

const fetcher = async (url: string): Promise<TokenMetrics> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch metrics: ${response.statusText}`);
  }
  return response.json();
};

export function useTokenMetrics(range: MetricsRange = "3h") {
  const { data, error, mutate, isLoading } = useSWR<TokenMetrics>(
    `/api/metrics?range=${range}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 5000,
    }
  );

  return {
    metrics: data,
    isLoading,
    error,
    refresh: mutate,
  };
}
