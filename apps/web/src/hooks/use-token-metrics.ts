"use client";

import useSWR from "swr";

export type MetricsRange = "1h" | "24h" | "7d" | "30d" | "90d";

export interface TokenSummary {
  total: number;
  input: number;
  output: number;
  reasoning: number;
  cacheRead: number;
  cacheWrite: number;
}

export interface TokenBreakdown {
  name: string;
  value: number;
}

export interface TokenMetrics {
  summary: TokenSummary;
  agents: TokenBreakdown[];
  models: TokenBreakdown[];
  projects: TokenBreakdown[];
  timeline: Array<{
    time: string;
    total_tokens?: number;
    input_tokens?: number;
    output_tokens?: number;
    reasoning_tokens?: number;
    cache_read_tokens?: number;
    cache_write_tokens?: number;
  }>;
}

const fetcher = async (url: string): Promise<TokenMetrics> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch metrics: ${response.statusText}`);
  }
  return response.json();
};

export function useTokenMetrics(range: MetricsRange = "24h") {
  const { data, error, mutate, isLoading } = useSWR<TokenMetrics>(
    `/api/metrics?range=${range}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 30_000,
    }
  );

  return {
    metrics: data,
    isLoading,
    error,
    refresh: mutate,
  };
}
