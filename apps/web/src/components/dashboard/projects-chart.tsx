"use client";

import {
  Bar,
  BarChart,
  Cell,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  XAxis,
  YAxis,
} from "@workspace/ui/components/chart";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { FolderOpen } from "lucide-react";
import type { TokenBreakdown } from "@/hooks/use-token-metrics";

const chartConfig = {
  value: {
    label: "Tokens",
    color: "var(--chart-2)",
  },
} as const;

type ProjectsChartProps = {
  projects: TokenBreakdown[] | null;
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

export function ProjectsChart({ projects, isLoading }: ProjectsChartProps) {
  if (isLoading) {
    return (
      <div className="border-2 border-border bg-card">
        <div className="border-border border-b-2 p-4">
          <div className="mb-1 h-4 w-36 animate-pulse bg-muted" />
          <div className="h-3 w-20 animate-pulse bg-muted" />
        </div>
        <div className="flex h-[250px] items-center justify-center p-4">
          <div className="h-4 w-24 animate-pulse bg-muted" />
        </div>
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="border-2 border-border bg-card">
        <div className="border-border border-b-2 p-4">
          <h3 className="font-bold font-mono text-sm uppercase tracking-wider">
            PROJECT_DIST
          </h3>
          <p className="mt-1 font-mono text-muted-foreground text-xs">
            BY USAGE
          </p>
        </div>
        <div className="flex h-[250px] items-center justify-center">
          <span className="font-mono text-muted-foreground text-sm uppercase">
            NO_DATA_AVAILABLE
          </span>
        </div>
      </div>
    );
  }

  const topProjects = projects.slice(0, 5);
  const totalValue = topProjects.reduce(
    (sum, project) => sum + project.value,
    0
  );

  const formattedData = topProjects.map((project, index) => ({
    name:
      project.name.length > 22
        ? `${project.name.slice(0, 20)}...`
        : project.name,
    fullName: project.name,
    value: project.value,
    percentage:
      totalValue > 0 ? ((project.value / totalValue) * 100).toFixed(0) : "0",
    fill: `var(--chart-${((index + 1) % 5) + 1})`,
  }));

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="cursor-default border-2 border-border bg-card transition-colors hover:border-primary/50">
          <div className="flex items-center justify-between border-border border-b-2 p-4">
            <div>
              <h3 className="font-bold font-mono text-sm uppercase tracking-wider">
                PROJECT_DIST
              </h3>
              <p className="mt-1 font-mono text-muted-foreground text-xs">
                BY USAGE
              </p>
            </div>
            <FolderOpen className="h-4 w-4 text-accent" />
          </div>
          <div className="p-4">
            <ChartContainer className="h-[220px] w-full" config={chartConfig}>
              <BarChart
                accessibilityLayer
                data={formattedData}
                layout="vertical"
                margin={{ left: 40, right: 12, top: 16, bottom: 8 }}
              >
                <XAxis
                  axisLine={false}
                  className="font-mono text-[10px]"
                  tick={{ fill: "var(--foreground)", opacity: 0.8 }}
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
                  angle={-45}
                  axisLine={false}
                  className="font-mono text-[10px]"
                  dataKey="name"
                  height={60}
                  textAnchor="end"
                  tick={{ fill: "var(--foreground)", opacity: 0.9 }}
                  tickLine={false}
                  tickMargin={16}
                  type="category"
                  width={140}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      className="border-2 border-border bg-card font-mono"
                      formatter={(value, _name, item) => {
                        const payload = item.payload as
                          | { fullName?: string }
                          | undefined;
                        return (
                          <div className="flex flex-col gap-1">
                            <span className="text-muted-foreground text-xs">
                              {payload?.fullName}
                            </span>
                            <span className="font-bold">
                              {formatNumber(Number(value))} tokens
                            </span>
                          </div>
                        );
                      }}
                      hideLabel
                    />
                  }
                  cursor={{ fill: "var(--accent)", fillOpacity: 0.1 }}
                  wrapperStyle={{ zIndex: 100 }}
                />
                <Bar dataKey="value" radius={0}>
                  {formattedData.map((entry) => (
                    <Cell fill={entry.fill} key={`cell-${entry.name}`} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top">
        <span className="font-mono text-xs">
          {projects.length} projects tracked
        </span>
      </TooltipContent>
    </Tooltip>
  );
}
