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
    color: "var(--chart-2)",
  },
} as const;

interface ProjectsChartProps {
  projects: TokenBreakdown[] | null;
  isLoading?: boolean;
}

export function ProjectsChart({ projects, isLoading }: ProjectsChartProps) {
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

  if (!projects || projects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Distribution</CardTitle>
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

  const topProjects = projects.slice(0, 5);
  const totalValue = topProjects.reduce(
    (sum, project) => sum + project.value,
    0
  );

  const formattedData = topProjects.map((project) => ({
    name: project.name,
    value: project.value,
    percentage:
      totalValue > 0 ? ((project.value / totalValue) * 100).toFixed(0) : "0",
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Distribution</CardTitle>
        <CardDescription>By token usage</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer className="h-[250px] w-full" config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={formattedData}
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
