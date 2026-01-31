"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { TokenMetrics } from "@/hooks/use-token-metrics";

const chartConfig = {
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
} as const;

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
  if (isLoading) {
    return (
      <div className="h-full border-2 border-border bg-card">
        <div className="border-border border-b-2 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="mb-1 h-5 w-40 animate-pulse bg-muted" />
              <div className="h-3 w-24 animate-pulse bg-muted" />
            </div>
          </div>
        </div>
        <div className="flex h-[300px] items-center justify-center p-4">
          <div className="h-4 w-32 animate-pulse bg-muted" />
        </div>
      </div>
    );
  }

  if (!metrics?.timeline || metrics.timeline.length === 0) {
    return (
      <div className="h-full border-2 border-border bg-card">
        <div className="border-border border-b-2 p-4">
          <h3 className="font-bold font-mono text-sm uppercase tracking-wider">
            TOKEN_TIMELINE
          </h3>
          <p className="mt-1 font-mono text-muted-foreground text-xs">
            RANGE: {rangeLabel || "24H"}
          </p>
        </div>
        <div className="flex h-[300px] items-center justify-center">
          <span className="font-mono text-muted-foreground text-sm uppercase">
            NO_DATA_AVAILABLE
          </span>
        </div>
      </div>
    );
  }

  const formattedData = metrics.timeline.map((item) => ({
    time: new Date(item.time).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    total: item.total_tokens || 0,
    input: item.input_tokens || 0,
    output: item.output_tokens || 0,
  }));

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="h-full cursor-default border-2 border-border bg-card transition-colors hover:border-primary/50">
          {/* Header */}
          <div className="flex items-center justify-between border-border border-b-2 p-4">
            <div>
              <h3 className="font-bold font-mono text-sm uppercase tracking-wider">
                TOKEN_TIMELINE
              </h3>
              <p className="mt-1 font-mono text-muted-foreground text-xs">
                RANGE: {rangeLabel || "24H"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Legend */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 bg-[var(--chart-1)]" />
                  <span className="font-mono text-muted-foreground text-xs">
                    TOTAL
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 bg-[var(--chart-2)]" />
                  <span className="font-mono text-muted-foreground text-xs">
                    INPUT
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 bg-[var(--chart-3)]" />
                  <span className="font-mono text-muted-foreground text-xs">
                    OUTPUT
                  </span>
                </div>
              </div>
              <TrendingUp className="h-4 w-4 text-accent" />
            </div>
          </div>

          {/* Chart */}
          <div className="p-4">
            <ChartContainer className="h-[280px] w-full" config={chartConfig}>
              <AreaChart accessibilityLayer data={formattedData}>
                <CartesianGrid
                  stroke="var(--border)"
                  strokeDasharray="none"
                  strokeWidth={1}
                  vertical={true}
                />
                <XAxis
                  axisLine={false}
                  className="font-mono text-[10px]"
                  dataKey="time"
                  tick={{ fill: "var(--muted-foreground)" }}
                  tickFormatter={(value) => value}
                  tickLine={false}
                  tickMargin={12}
                />
                <YAxis
                  axisLine={false}
                  className="font-mono text-[10px]"
                  tick={{ fill: "var(--muted-foreground)" }}
                  tickFormatter={(value) => {
                    if (value >= 1_000_000) {
                      return `${(value / 1_000_000).toFixed(1)}M`;
                    }
                    if (value >= 1000) {
                      return `${(value / 1000).toFixed(0)}K`;
                    }
                    return value;
                  }}
                  tickLine={false}
                  tickMargin={8}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      className="border-2 border-border bg-card font-mono"
                      indicator="line"
                    />
                  }
                  cursor={{
                    stroke: "var(--primary)",
                    strokeWidth: 1,
                    strokeDasharray: "4 4",
                  }}
                />
                <Area
                  dataKey="total"
                  fill="var(--color-total_tokens)"
                  fillOpacity={0.15}
                  stroke="var(--color-total_tokens)"
                  strokeWidth={2}
                  type="stepAfter"
                />
                <Area
                  dataKey="input"
                  fill="var(--color-input_tokens)"
                  fillOpacity={0.1}
                  stroke="var(--color-input_tokens)"
                  strokeWidth={2}
                  type="stepAfter"
                />
                <Area
                  dataKey="output"
                  fill="var(--color-output_tokens)"
                  fillOpacity={0.1}
                  stroke="var(--color-output_tokens)"
                  strokeWidth={2}
                  type="stepAfter"
                />
              </AreaChart>
            </ChartContainer>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top">
        <span className="font-mono text-xs">
          Token usage over time ({rangeLabel})
        </span>
      </TooltipContent>
    </Tooltip>
  );
}
