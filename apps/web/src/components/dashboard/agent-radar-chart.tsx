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
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";
import type { TokenBreakdown } from "@/hooks/use-token-metrics";

const chartConfig = {
  value: {
    label: "Tokens",
    color: "var(--chart-1)",
  },
} as const;

interface RadarChartProps {
  agents: TokenBreakdown[] | null;
  isLoading?: boolean;
}

export function AgentRadarChart({ agents, isLoading }: RadarChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-4 w-32 animate-pulse bg-muted" />
        </CardHeader>
        <CardContent>
          <div className="flex h-[250px] items-center justify-center">
            <div className="h-16 w-16 animate-pulse rounded-full bg-muted" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!agents || agents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Agent Usage</CardTitle>
          <CardDescription>By agent type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[250px] items-center justify-center text-muted-foreground text-sm">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const topAgents = agents.slice(0, 6);
  const maxValue = Math.max(...topAgents.map((agent) => agent.value));

  const formattedData = topAgents.map((agent) => ({
    agent: agent.name,
    value: agent.value,
    normalized: maxValue > 0 ? (agent.value / maxValue) * 100 : 0,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Usage</CardTitle>
        <CardDescription>By agent type</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          className="mx-auto aspect-square max-h-[250px]"
          config={chartConfig}
        >
          <RadarChart data={formattedData}>
            <PolarGrid strokeDasharray="2 2" />
            <PolarAngleAxis
              dataKey="agent"
              tick={{ fontSize: 10 }}
              tickLine={false}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent className="border-border bg-background" />
              }
              cursor={false}
            />
            <Radar
              dataKey="normalized"
              fill="var(--color-value)"
              fillOpacity={0.4}
              stroke="var(--color-value)"
              strokeWidth={1.5}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
