"use client";

import useSWR from "swr";
import { useState } from "react";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { AgentBreakdown } from "@/components/dashboard/agent-breakdown";
import { TokenChart } from "@/components/dashboard/token-chart";
import { Button } from "@workspace/ui/components/button";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DashboardPage() {
  const [range, setRange] = useState("24h");
  const { data, error, isLoading } = useSWR(
    `/api/metrics?range=${range}`,
    fetcher,
    {
      refreshInterval: 30000,
    },
  );

  const ranges = ["1h", "24h", "7d", "30d", "90d"];

  if (error) return <div className="p-8 text-red-500">Failed to load data</div>;
  if (isLoading || !data)
    return <div className="p-8">Loading dashboard...</div>;

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
          <h2 className="text-3xl font-bold tracking-tight">
            TTrack Dashboard
          </h2>
          <div className="flex items-center space-x-2">
            {ranges.map((r) => (
              <Button
                key={r}
                variant={range === r ? "default" : "outline"}
                onClick={() => setRange(r)}
                size="sm"
              >
                {r}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <SummaryCards data={data.summary} />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <TokenChart data={data.timeline} />
            <AgentBreakdown data={data.agents} />
          </div>
        </div>
      </div>
    </div>
  );
}
