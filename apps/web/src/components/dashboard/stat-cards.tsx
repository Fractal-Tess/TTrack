"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Cpu,
  Database,
  FileCode,
  FileMinus,
  FilePlus,
} from "lucide-react";
import type {
  TokenSummary,
  TokenSummaryChanges,
} from "@/hooks/use-token-metrics";

type StatCardProps = {
  title: string;
  value: number;
  change?: number;
  isPositive?: boolean;
  icon: React.ReactNode;
  color: string;
  index: number;
  unit?: string;
};

function StatCard({
  title,
  value,
  change,
  isPositive,
  icon,
  index,
  unit = "tokens",
}: StatCardProps) {
  const formatNumber = (num: number) => {
    if (num >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(2)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return new Intl.NumberFormat("en-US").format(num);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="group relative cursor-default border-2 border-border bg-card p-4 transition-colors hover:border-primary"
          style={{
            animationDelay: `${index * 50}ms`,
          }}
        >
          {/* Top bar accent */}
          <div
            className="absolute top-0 right-0 left-0 h-0.5"
            style={{ backgroundColor: `var(--chart-${(index % 5) + 1})` }}
          />

          {/* Header */}
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-muted-foreground text-xs uppercase tracking-wider">
              {title}
            </span>
            <div className="text-muted-foreground transition-colors group-hover:text-primary">
              {icon}
            </div>
          </div>

          {/* Value */}
          <div className="mb-2 font-bold font-mono text-3xl text-foreground tabular-nums tracking-tight">
            {formatNumber(value)}
          </div>

          {/* Change indicator */}
          {change !== undefined && (
            <div
              className={`flex items-center gap-1 font-mono text-xs ${
                isPositive ? "text-accent" : "text-muted-foreground"
              }`}
            >
              {isPositive ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3" />
              )}
              <span>{Math.abs(change).toFixed(1)}%</span>
              <span className="text-muted-foreground">vs prev</span>
            </div>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <span className="font-mono text-xs">
          {new Intl.NumberFormat("en-US").format(value)} {unit}
        </span>
      </TooltipContent>
    </Tooltip>
  );
}

type StatCardsProps = {
  summary: TokenSummary | null;
  changes: TokenSummaryChanges | null;
  isLoading?: boolean;
};

export function StatCards({ summary, changes, isLoading }: StatCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            className="relative border-2 border-border bg-card p-4"
            key={i}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="absolute top-0 right-0 left-0 h-0.5 animate-pulse bg-muted" />
            <div className="mb-3 flex justify-between">
              <div className="h-3 w-20 animate-pulse bg-muted" />
              <div className="h-4 w-4 animate-pulse bg-muted" />
            </div>
            <div className="mb-2 h-9 w-28 animate-pulse bg-muted" />
            <div className="h-3 w-16 animate-pulse bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  const stats = [
    {
      title: "TOTAL",
      value: summary.total,
      change: changes?.total,
      isPositive: (changes?.total ?? 0) >= 0,
      icon: <Activity className="h-4 w-4" />,
      color: "chart-1",
      unit: "tokens",
    },
    {
      title: "INPUT",
      value: summary.input,
      change: changes?.input,
      isPositive: (changes?.input ?? 0) >= 0,
      icon: <ArrowDown className="h-4 w-4" />,
      color: "chart-2",
      unit: "tokens",
    },
    {
      title: "OUTPUT",
      value: summary.output,
      change: changes?.output,
      isPositive: (changes?.output ?? 0) >= 0,
      icon: <ArrowUp className="h-4 w-4" />,
      color: "chart-3",
      unit: "tokens",
    },
    {
      title: "REASONING",
      value: summary.reasoning,
      change: changes?.reasoning,
      isPositive: (changes?.reasoning ?? 0) >= 0,
      icon: <Cpu className="h-4 w-4" />,
      color: "chart-4",
      unit: "tokens",
    },
    {
      title: "FILES",
      value: summary.filesChanged,
      change: changes?.filesChanged,
      isPositive: (changes?.filesChanged ?? 0) >= 0,
      icon: <FileCode className="h-4 w-4" />,
      color: "chart-5",
      unit: "files",
    },
    {
      title: "ADDITIONS",
      value: summary.additions,
      change: changes?.additions,
      isPositive: (changes?.additions ?? 0) >= 0,
      icon: <FilePlus className="h-4 w-4" />,
      color: "chart-1",
      unit: "lines",
    },
    {
      title: "DELETIONS",
      value: summary.deletions,
      change: changes?.deletions,
      isPositive: (changes?.deletions ?? 0) >= 0,
      icon: <FileMinus className="h-4 w-4" />,
      color: "chart-2",
      unit: "lines",
    },
    {
      title: "CACHE",
      value: summary.cacheRead,
      change: changes?.cacheRead,
      isPositive: (changes?.cacheRead ?? 0) >= 0,
      icon: <Database className="h-4 w-4" />,
      color: "chart-3",
      unit: "tokens",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <StatCard
          change={stat.change}
          color={stat.color}
          icon={stat.icon}
          index={index}
          isPositive={stat.isPositive}
          key={stat.title}
          title={stat.title}
          unit={stat.unit}
          value={stat.value}
        />
      ))}
    </div>
  );
}
