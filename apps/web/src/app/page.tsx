"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { AgentRadarChart } from "@/components/dashboard/agent-radar-chart";
import { BreakdownChart } from "@/components/dashboard/breakdown-chart";
import { ModelsChart } from "@/components/dashboard/models-chart";
import { ProjectsChart } from "@/components/dashboard/projects-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { StatCards } from "@/components/dashboard/stat-cards";
import { TimelineChart } from "@/components/dashboard/timeline-chart";
import { type MetricsRange, useTokenMetrics } from "@/hooks/use-token-metrics";

const rangeLabels: Record<MetricsRange, string> = {
  "1h": "1 Hour",
  "24h": "24 Hours",
  "7d": "7 Days",
  "30d": "30 Days",
  "90d": "90 Days",
};

export default function DashboardPage() {
  const [range, setRange] = useState<MetricsRange>("24h");
  const { metrics, isLoading, refresh } = useTokenMetrics(range);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header className="flex items-center justify-between border-b pb-4">
          <div>
            <h1 className="font-bold text-2xl uppercase tracking-tight">
              Token Tracking Dashboard
            </h1>
            <p className="mt-1 text-muted-foreground text-sm">
              Monitor AI token usage across your projects
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select
              onValueChange={(value: MetricsRange) => setRange(value)}
              value={range}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">1 Hour</SelectItem>
                <SelectItem value="24h">24 Hours</SelectItem>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
                <SelectItem value="90d">90 Days</SelectItem>
              </SelectContent>
            </Select>
            <Button
              disabled={isLoading}
              onClick={() => refresh()}
              size="icon"
              variant="outline"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </header>

        <div className="space-y-6">
          <StatCards isLoading={isLoading} summary={metrics?.summary || null} />

          <TimelineChart
            isLoading={isLoading}
            metrics={metrics || null}
            rangeLabel={rangeLabels[range]}
          />

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="md:col-span-2">
              <BreakdownChart
                isLoading={isLoading}
                summary={metrics?.summary || null}
              />
            </div>
            <RecentActivity isLoading={isLoading} metrics={metrics || null} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ModelsChart
              isLoading={isLoading}
              models={metrics?.models || null}
            />
            <ProjectsChart
              isLoading={isLoading}
              projects={metrics?.projects || null}
            />
          </div>

          <AgentRadarChart
            agents={metrics?.agents || null}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
