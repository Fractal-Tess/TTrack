"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  XAxis,
} from "@workspace/ui/components/chart";
import { useMemo, useState } from "react";
import type { TokenMetrics } from "@/hooks/use-token-metrics";

const chartConfig = {
  views: {
    label: "Tokens",
  },
  total_tokens: {
    label: "Total",
    color: "var(--chart-1)",
  },
  input_tokens: {
    label: "Input",
    color: "var(--chart-2)",
  },
  output_tokens: {
    label: "Output",
    color: "var(--chart-3)",
  },
  billable_tokens: {
    label: "Billable",
    color: "var(--chart-4)",
  },
  cache_read_tokens: {
    label: "Cached",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

type TimelineChartProps = {
  metrics: TokenMetrics | null;
  isLoading?: boolean;
  rangeLabel?: string;
};

export function TimelineChart({
  metrics,
  isLoading,
  rangeLabel,
}: TimelineChartProps) {
  const [activeChart, setActiveChart] =
    useState<keyof typeof chartConfig>("total_tokens");

  const formattedData = useMemo(() => {
    if (!metrics?.timeline) {
      return [];
    }
    return metrics.timeline.map((item) => ({
      time: item.time,
      total_tokens: item.total_tokens || 0,
      input_tokens: item.input_tokens || 0,
      output_tokens: item.output_tokens || 0,
      billable_tokens: item.billable_tokens || 0,
      cache_read_tokens: item.cache_read_tokens || 0,
    }));
  }, [metrics?.timeline]);

  const totals = useMemo(
    () => ({
      total_tokens: formattedData.reduce(
        (acc, curr) => acc + curr.total_tokens,
        0
      ),
      input_tokens: formattedData.reduce(
        (acc, curr) => acc + curr.input_tokens,
        0
      ),
      output_tokens: formattedData.reduce(
        (acc, curr) => acc + curr.output_tokens,
        0
      ),
      billable_tokens: formattedData.reduce(
        (acc, curr) => acc + curr.billable_tokens,
        0
      ),
      cache_read_tokens: formattedData.reduce(
        (acc, curr) => acc + curr.cache_read_tokens,
        0
      ),
    }),
    [formattedData]
  );

  if (isLoading) {
    return (
      <div className="flex h-full flex-col border-2 border-border bg-card">
        <div className="border-border border-b-2 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="mb-1 h-5 w-40 animate-pulse bg-muted" />
              <div className="h-3 w-24 animate-pulse bg-muted" />
            </div>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center p-4">
          <div className="h-4 w-32 animate-pulse bg-muted" />
        </div>
      </div>
    );
  }

  if (!metrics?.timeline || metrics.timeline.length === 0) {
    return (
      <div className="flex h-full flex-col border-2 border-border bg-card">
        <div className="border-border border-b-2 p-4">
          <h3 className="font-bold font-mono text-sm uppercase tracking-wider">
            TOKEN_TIMELINE
          </h3>
          <p className="mt-1 font-mono text-muted-foreground text-xs">
            RANGE: {rangeLabel || "24H"}
          </p>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <span className="font-mono text-muted-foreground text-sm uppercase">
            NO_DATA_AVAILABLE
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col border-2 border-border bg-card">
      {/* Header with interactive toggles */}
      <div className="flex flex-col items-stretch border-border border-b-2 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 p-4">
          <h3 className="font-bold font-mono text-sm uppercase tracking-wider">
            TOKEN_TIMELINE
          </h3>
          <p className="font-mono text-muted-foreground text-xs">
            RANGE: {rangeLabel || "24H"}
          </p>
        </div>
        <div className="flex">
          {(
            [
              "total_tokens",
              "billable_tokens",
              "cache_read_tokens",
              "input_tokens",
              "output_tokens",
            ] as const
          ).map((key) => (
            <button
              className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-border border-t px-4 py-3 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-t-0 sm:border-l sm:px-6 sm:py-4"
              data-active={activeChart === key}
              key={key}
              onClick={() => setActiveChart(key)}
              type="button"
            >
              <span className="font-mono text-muted-foreground text-xs uppercase">
                {chartConfig[key].label}
              </span>
              <span className="font-bold font-mono text-lg leading-none sm:text-2xl">
                {totals[key].toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="min-h-0 flex-1 p-4">
        <ChartContainer className="h-full w-full" config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={formattedData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="time"
              minTickGap={32}
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
              }}
              tickLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px] border-2 border-border bg-card font-mono"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                  }}
                  nameKey="views"
                />
              }
            />
            <Bar dataKey={activeChart} fill={`var(--color-${activeChart})`} />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
}
