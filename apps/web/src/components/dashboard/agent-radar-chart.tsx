"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
} from "@workspace/ui/components/chart";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { Bot } from "lucide-react";
import type { TokenBreakdown } from "@/hooks/use-token-metrics";

const chartConfig = {
  value: {
    label: "Tokens",
    color: "var(--chart-4)",
  },
} as const;

type RadarChartProps = {
  agents: TokenBreakdown[] | null;
  isLoading?: boolean;
};

function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat("en-US").format(num);
}

export function AgentRadarChart({ agents, isLoading }: RadarChartProps) {
  if (isLoading) {
    return (
      <div className="border-2 border-border bg-card">
        <div className="border-border border-b-2 p-4">
          <div className="mb-1 h-4 w-28 animate-pulse bg-muted" />
          <div className="h-3 w-20 animate-pulse bg-muted" />
        </div>
        <div className="flex h-[280px] items-center justify-center p-4">
          <div className="h-40 w-40 animate-pulse rounded-full bg-muted" />
        </div>
      </div>
    );
  }

  if (!agents || agents.length === 0) {
    return (
      <div className="border-2 border-border bg-card">
        <div className="border-border border-b-2 p-4">
          <h3 className="font-bold font-mono text-sm uppercase tracking-wider">
            AGENT_USAGE
          </h3>
          <p className="mt-1 font-mono text-muted-foreground text-xs">
            BY TYPE
          </p>
        </div>
        <div className="flex h-[280px] items-center justify-center">
          <span className="font-mono text-muted-foreground text-sm uppercase">
            NO_DATA_AVAILABLE
          </span>
        </div>
      </div>
    );
  }

  const topAgents = agents.slice(0, 6);
  const maxValue = Math.max(...topAgents.map((agent) => agent.value));
  const totalValue = topAgents.reduce((sum, agent) => sum + agent.value, 0);

  const formattedData = topAgents.map((agent) => ({
    agent:
      agent.name.length > 12 ? `${agent.name.slice(0, 10)}...` : agent.name,
    fullName: agent.name,
    value: agent.value,
    normalized: maxValue > 0 ? (agent.value / maxValue) * 100 : 0,
  }));

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="cursor-default border-2 border-border bg-card transition-colors hover:border-primary/50">
          <div className="flex items-center justify-between border-border border-b-2 p-4">
            <div>
              <h3 className="font-bold font-mono text-sm uppercase tracking-wider">
                AGENT_USAGE
              </h3>
              <p className="mt-1 font-mono text-muted-foreground text-xs">
                BY TYPE
              </p>
            </div>
            <Bot className="h-4 w-4 text-[var(--chart-4)]" />
          </div>
          <div className="p-4">
            <ChartContainer
              className="mx-auto aspect-square h-[250px]"
              config={chartConfig}
            >
              <RadarChart data={formattedData}>
                <PolarGrid
                  stroke="var(--border)"
                  strokeDasharray="none"
                  strokeWidth={1}
                />
                <PolarAngleAxis
                  dataKey="agent"
                  tick={{
                    fill: "var(--foreground)",
                    fontSize: 10,
                    fontFamily: "var(--font-mono)",
                    opacity: 0.9,
                  }}
                  tickLine={false}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      className="border-2 border-border bg-card font-mono"
                      formatter={(_value, _name, item) => {
                        const payload = item.payload as
                          | { fullName?: string; value?: number }
                          | undefined;
                        return (
                          <div className="flex flex-col gap-1">
                            <span className="text-muted-foreground text-xs">
                              {payload?.fullName}
                            </span>
                            <span className="font-bold">
                              {formatNumber(payload?.value ?? 0)} tokens
                            </span>
                          </div>
                        );
                      }}
                    />
                  }
                  cursor={false}
                  wrapperStyle={{ zIndex: 100 }}
                />
                <Radar
                  dataKey="normalized"
                  dot={{
                    fill: "var(--chart-4)",
                    r: 3,
                  }}
                  fill="var(--chart-4)"
                  fillOpacity={0.2}
                  stroke="var(--chart-4)"
                  strokeWidth={2}
                />
              </RadarChart>
            </ChartContainer>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top">
        <span className="font-mono text-xs">
          {agents.length} agents | {formatNumber(totalValue)} total tokens
        </span>
      </TooltipContent>
    </Tooltip>
  );
}
