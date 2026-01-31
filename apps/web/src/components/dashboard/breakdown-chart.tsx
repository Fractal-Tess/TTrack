"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  Pie,
  PieChart,
} from "@workspace/ui/components/chart";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import type { TokenSummary } from "@/hooks/use-token-metrics";

const tokenTypeConfig = {
  input: {
    label: "Input",
    color: "var(--chart-1)",
  },
  output: {
    label: "Output",
    color: "var(--chart-2)",
  },
  reasoning: {
    label: "Reasoning",
    color: "var(--chart-3)",
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

function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat("en-US").format(num);
}

export function BreakdownChart({ summary, isLoading }: BreakdownChartProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <div className="border-2 border-border bg-card" key={i}>
            <div className="border-border border-b-2 p-4">
              <div className="mb-1 h-4 w-32 animate-pulse bg-muted" />
              <div className="h-3 w-20 animate-pulse bg-muted" />
            </div>
            <div className="flex h-[220px] items-center justify-center p-4">
              <div className="h-32 w-32 animate-pulse bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  const tokenTotal = summary.input + summary.output + summary.reasoning;
  const cacheTotal = summary.cacheRead + summary.cacheWrite;

  const tokenData = [
    {
      name: "input",
      value: summary.input,
      fill: "var(--chart-1)",
      percentage:
        tokenTotal > 0 ? ((summary.input / tokenTotal) * 100).toFixed(0) : "0",
    },
    {
      name: "output",
      value: summary.output,
      fill: "var(--chart-2)",
      percentage:
        tokenTotal > 0 ? ((summary.output / tokenTotal) * 100).toFixed(0) : "0",
    },
    {
      name: "reasoning",
      value: summary.reasoning,
      fill: "var(--chart-3)",
      percentage:
        tokenTotal > 0
          ? ((summary.reasoning / tokenTotal) * 100).toFixed(0)
          : "0",
    },
  ];

  const cacheData = [
    {
      name: "cacheRead",
      value: summary.cacheRead,
      fill: "var(--chart-4)",
      percentage:
        cacheTotal > 0
          ? ((summary.cacheRead / cacheTotal) * 100).toFixed(0)
          : "0",
    },
    {
      name: "cacheWrite",
      value: summary.cacheWrite,
      fill: "var(--chart-5)",
      percentage:
        cacheTotal > 0
          ? ((summary.cacheWrite / cacheTotal) * 100).toFixed(0)
          : "0",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Token Breakdown */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-default border-2 border-border bg-card transition-colors hover:border-primary/50">
            <div className="border-border border-b-2 p-4">
              <h3 className="font-bold font-mono text-sm uppercase tracking-wider">
                TOKEN_BREAKDOWN
              </h3>
              <p className="mt-1 font-mono text-muted-foreground text-xs">
                BY TYPE
              </p>
            </div>
            <div className="flex items-center gap-6 p-4">
              <ChartContainer
                className="aspect-square h-[180px]"
                config={tokenTypeConfig}
              >
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        className="border-2 border-border bg-card font-mono"
                        hideLabel
                      />
                    }
                    cursor={false}
                    wrapperStyle={{ zIndex: 100 }}
                  />
                  <Pie
                    data={tokenData}
                    dataKey="value"
                    innerRadius={45}
                    nameKey="name"
                    outerRadius={70}
                    stroke="var(--background)"
                    strokeWidth={2}
                  />
                </PieChart>
              </ChartContainer>

              {/* Legend */}
              <div className="flex flex-col gap-3">
                {tokenData.map((item) => (
                  <div className="flex items-center gap-3" key={item.name}>
                    <div
                      className="h-3 w-3"
                      style={{ backgroundColor: item.fill }}
                    />
                    <div className="flex flex-col">
                      <span className="font-mono text-muted-foreground text-xs uppercase">
                        {item.name}
                      </span>
                      <span className="font-bold font-mono text-sm">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <span className="font-mono text-xs">
            Total: {formatNumber(tokenTotal)} tokens
          </span>
        </TooltipContent>
      </Tooltip>

      {/* Cache Usage */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-default border-2 border-border bg-card transition-colors hover:border-primary/50">
            <div className="border-border border-b-2 p-4">
              <h3 className="font-bold font-mono text-sm uppercase tracking-wider">
                CACHE_USAGE
              </h3>
              <p className="mt-1 font-mono text-muted-foreground text-xs">
                READ VS WRITE
              </p>
            </div>
            <div className="flex items-center gap-6 p-4">
              <ChartContainer
                className="aspect-square h-[180px]"
                config={cacheConfig}
              >
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        className="border-2 border-border bg-card font-mono"
                        hideLabel
                      />
                    }
                    cursor={false}
                    wrapperStyle={{ zIndex: 100 }}
                  />
                  <Pie
                    data={cacheData}
                    dataKey="value"
                    innerRadius={45}
                    nameKey="name"
                    outerRadius={70}
                    stroke="var(--background)"
                    strokeWidth={2}
                  />
                </PieChart>
              </ChartContainer>

              {/* Legend */}
              <div className="flex flex-col gap-3">
                {cacheData.map((item) => (
                  <div className="flex items-center gap-3" key={item.name}>
                    <div
                      className="h-3 w-3"
                      style={{ backgroundColor: item.fill }}
                    />
                    <div className="flex flex-col">
                      <span className="font-mono text-muted-foreground text-xs uppercase">
                        {item.name === "cacheRead" ? "READ" : "WRITE"}
                      </span>
                      <span className="font-bold font-mono text-sm">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <span className="font-mono text-xs">
            Total: {formatNumber(cacheTotal)} cached
          </span>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
