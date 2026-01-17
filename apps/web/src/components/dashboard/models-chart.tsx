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
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import type { TokenBreakdown } from "@/hooks/use-token-metrics";

const chartConfig = {
  value: {
    label: "Tokens",
    color: "var(--chart-1)",
  },
} as const;

type ModelsChartProps = {
  models: TokenBreakdown[] | null;
  isLoading?: boolean;
};

export function ModelsChart({ models, isLoading }: ModelsChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-4 w-32 animate-pulse bg-muted" />
        </CardHeader>
        <CardContent>
          <div className="flex h-[250px] items-center justify-center">
            <div className="h-4 w-24 animate-pulse bg-muted" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!models || models.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Models</CardTitle>
          <CardDescription>By token usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[250px] items-center justify-center text-muted-foreground text-sm">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const topModels = models.slice(0, 5);
  const totalValue = topModels.reduce((sum, model) => sum + model.value, 0);

  const formattedData = topModels.map((model) => ({
    name: model.name,
    value: model.value,
    percentage:
      totalValue > 0 ? ((model.value / totalValue) * 100).toFixed(0) : "0",
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Models</CardTitle>
        <CardDescription>By token usage</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer className="h-[250px] w-full" config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={formattedData}
            layout="vertical"
            margin={{ left: 100, right: 30, top: 0, bottom: 0 }}
          >
            <XAxis
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
              type="number"
            />
            <YAxis
              axisLine={false}
              className="text-[10px]"
              dataKey="name"
              tickLine={false}
              tickMargin={8}
              type="category"
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="border-border bg-background"
                  hideLabel
                />
              }
              cursor={false}
            />
            <Bar
              dataKey="value"
              fill="var(--color-value)"
              radius={[0, 0, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
