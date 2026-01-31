"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  XAxis,
  type ChartConfig,
} from "@workspace/ui/components/chart";
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
    React.useState<keyof typeof chartConfig>("total_tokens");

  const formattedData = React.useMemo(() => {
    if (!metrics?.timeline) return [];
    return metrics.timeline.map((item) => ({
      time: item.time,
      total_tokens: item.total_tokens || 0,
      input_tokens: item.input_tokens || 0,
      output_tokens: item.output_tokens || 0,
    }));
  }, [metrics?.timeline]);

  const totals = React.useMemo(
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
          {(["total_tokens", "input_tokens", "output_tokens"] as const).map(
            (key) => (
              <button
                key={key}
                data-active={activeChart === key}
                className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t border-border px-4 py-3 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-6 sm:py-4"
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
            )
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="min-h-0 flex-1 p-4">
        <ChartContainer
          config={chartConfig}
          className="h-full w-full"
        >
          <BarChart
            accessibilityLayer
            data={formattedData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px] border-2 border-border bg-card font-mono"
                  nameKey="views"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                  }}
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
