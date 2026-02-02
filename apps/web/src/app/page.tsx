"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { RefreshCw, Terminal } from "lucide-react";
import { useEffect, useState } from "react";
import { AgentRadarChart } from "@/components/dashboard/agent-radar-chart";
import { BreakdownChart } from "@/components/dashboard/breakdown-chart";
import {
  type ActiveFilters,
  FilterBar,
} from "@/components/dashboard/filter-bar";
import { ModelsChart } from "@/components/dashboard/models-chart";
import { ProjectsChart } from "@/components/dashboard/projects-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { StatCards } from "@/components/dashboard/stat-cards";
import { TimelineChart } from "@/components/dashboard/timeline-chart";
import {
  type FilterParams,
  type MetricsRange,
  useTokenMetrics,
} from "@/hooks/use-token-metrics";

const rangeLabels: Record<MetricsRange, string> = {
  "5m": "5M",
  "30m": "30M",
  "1h": "1H",
  "3h": "3H",
  "6h": "6H",
  "12h": "12H",
  "24h": "24H",
  "7d": "7D",
  "30d": "30D",
  "90d": "90D",
  "365d": "365D",
};

export default function DashboardPage() {
  const [range, setRange] = useState<MetricsRange>("3h");
  const [filters, setFilters] = useState<ActiveFilters>({
    project: null,
    model: null,
    agent: null,
    dateRange: null,
  });
  const filterParams: FilterParams = {
    project: filters.project,
    model: filters.model,
    agent: filters.agent,
    startDate: filters.dateRange?.from
      ? filters.dateRange.from.toISOString()
      : null,
    endDate: filters.dateRange?.to ? filters.dateRange.to.toISOString() : null,
  };
  const { metrics, isLoading, refresh } = useTokenMetrics(range, filterParams);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-background p-3 md:p-6 lg:p-8">
      <div className="mx-auto max-w-[1800px]">
        {/* Header */}
        <header className="mb-8 border-border border-b-2 pb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-10 w-10 items-center justify-center border-2 border-primary bg-primary/10">
                <Terminal className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="font-bold text-xl uppercase tracking-[0.2em] md:text-2xl">
                  TTRACK_
                </h1>
                <p className="mt-1 font-mono text-muted-foreground text-xs uppercase tracking-wider">
                  TOKEN USAGE MONITOR {/* SYSTEM ACTIVE */}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Time range selector */}
              <div className="flex border-2 border-border">
                {(Object.keys(rangeLabels) as MetricsRange[]).map((key) => (
                  <button
                    className={`px-3 py-2 font-mono text-xs uppercase tracking-wider transition-colors ${
                      range === key
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                    key={key}
                    onClick={() => setRange(key)}
                    type="button"
                  >
                    {rangeLabels[key]}
                  </button>
                ))}
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="h-10 w-10 border-2"
                    disabled={isLoading}
                    onClick={() => refresh()}
                    size="icon"
                    variant="outline"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh data</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className="mb-6">
          <FilterBar
            agents={metrics?.agents || null}
            filters={filters}
            isLoading={isLoading}
            models={metrics?.models || null}
            onFiltersChange={setFilters}
            projects={metrics?.projects || null}
          />
        </div>

        {/* Dashboard grid */}
        <div className="space-y-4">
          {/* Stat cards row */}
          <StatCards
            changes={metrics?.changes || null}
            isLoading={isLoading}
            summary={metrics?.summary || null}
          />

          {/* Main chart area */}
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <TimelineChart
                isLoading={isLoading}
                metrics={metrics || null}
                rangeLabel={rangeLabels[range]}
              />
            </div>
            <div>
              <RecentActivity isLoading={isLoading} metrics={metrics || null} />
            </div>
          </div>

          {/* Breakdown section */}
          <BreakdownChart
            isLoading={isLoading}
            summary={metrics?.summary || null}
          />

          {/* Bottom charts grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <ModelsChart
              isLoading={isLoading}
              models={metrics?.models || null}
            />
            <ProjectsChart
              isLoading={isLoading}
              projects={metrics?.projects || null}
            />
            <AgentRadarChart
              agents={metrics?.agents || null}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 border-border border-t-2 pt-4">
          <p className="text-center font-mono text-muted-foreground text-xs uppercase tracking-wider">
            SYS_STATUS: OPERATIONAL {/* LAST_SYNC: */}{" "}
            {mounted
              ? new Date().toLocaleTimeString("en-US", {
                  hour12: false,
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })
              : "--:--:--"}
          </p>
        </footer>
      </div>
    </div>
  );
}
