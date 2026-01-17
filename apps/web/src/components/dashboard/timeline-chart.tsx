"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart";
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
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Token Usage Timeline</CardTitle>
          <CardDescription>Over selected time period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center">
            <div className="h-4 w-32 animate-pulse bg-muted" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics?.timeline || metrics.timeline.length === 0) {
    return (
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Token Usage Timeline</CardTitle>
          <CardDescription>Over selected time period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
            No data available
          </div>
        </CardContent>
      </Card>
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
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Token Usage Timeline</CardTitle>
        <CardDescription>Last {rangeLabel || "24 hours"}</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ChartContainer className="h-[300px] w-full" config={chartConfig}>
          <AreaChart accessibilityLayer data={formattedData}>
            <CartesianGrid strokeDasharray="2 2" vertical={false} />
            <XAxis
              axisLine={false}
              className="text-[10px]"
              dataKey="time"
              tickFormatter={(value) => value}
              tickLine={false}
              tickMargin={8}
            />
            <YAxis
              axisLine={false}
              className="text-[10px]"
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
                  className="border-border bg-background"
                  indicator="line"
                />
              }
              cursor={false}
            />
            <Area
              dataKey="total"
              fill="var(--color-total_tokens)"
              fillOpacity={0.3}
              stroke="var(--color-total_tokens)"
              strokeWidth={1.5}
              type="linear"
            />
            <Area
              dataKey="input"
              fill="var(--color-input_tokens)"
              fillOpacity={0.2}
              stroke="var(--color-input_tokens)"
              strokeWidth={1.5}
              type="linear"
            />
            <Area
              dataKey="output"
              fill="var(--color-output_tokens)"
              fillOpacity={0.2}
              stroke="var(--color-output_tokens)"
              strokeWidth={1.5}
              type="linear"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
