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
import { Pie, PieChart } from "recharts";
import type { TokenSummary } from "@/hooks/use-token-metrics";

const tokenTypeConfig = {
  input: {
    label: "Input",
    color: "var(--chart-2)",
  },
  output: {
    label: "Output",
    color: "var(--chart-3)",
  },
  reasoning: {
    label: "Reasoning",
    color: "var(--chart-1)",
  },
} as const;

const cacheConfig = {
  cacheRead: {
    label: "Cache Read",
    color: "var(--chart-4)",
  },
  cacheWrite: {
    label: "Cache Write",
    color: "var(--chart-5)",
  },
} as const;

type BreakdownChartProps = {
  summary: TokenSummary | null;
  isLoading?: boolean;
};

export function BreakdownChart({ summary, isLoading }: BreakdownChartProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-4 w-24 animate-pulse bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="flex h-[200px] items-center justify-center">
                <div className="h-16 w-16 animate-pulse rounded-full bg-muted" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  const tokenData = [
    { name: "input", value: summary.input, fill: "var(--color-input)" },
    { name: "output", value: summary.output, fill: "var(--color-output)" },
    {
      name: "reasoning",
      value: summary.reasoning,
      fill: "var(--color-reasoning)",
    },
  ];

  const cacheData = [
    {
      name: "cacheRead",
      value: summary.cacheRead,
      fill: "var(--color-cacheRead)",
    },
    {
      name: "cacheWrite",
      value: summary.cacheWrite,
      fill: "var(--color-cacheWrite)",
    },
  ];

  const _getTokenPercentage = (value: number) => {
    const total = summary.input + summary.output + summary.reasoning;
    return total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
  };

  const _getCachePercentage = (value: number) => {
    const total = summary.cacheRead + summary.cacheWrite;
    return total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Token Breakdown</CardTitle>
          <CardDescription>By token type</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <ChartContainer
            className="mx-auto aspect-square max-h-[200px]"
            config={tokenTypeConfig}
          >
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="border-border bg-background"
                    hideLabel
                  />
                }
                cursor={false}
              />
              <Pie
                data={tokenData}
                dataKey="value"
                innerRadius={50}
                nameKey="name"
                strokeWidth={1.5}
              />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cache Usage</CardTitle>
          <CardDescription>Read vs write</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <ChartContainer
            className="mx-auto aspect-square max-h-[200px]"
            config={cacheConfig}
          >
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="border-border bg-background"
                    hideLabel
                  />
                }
                cursor={false}
              />
              <Pie
                data={cacheData}
                dataKey="value"
                innerRadius={50}
                nameKey="name"
                strokeWidth={1.5}
              />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
