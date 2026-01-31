"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { Activity, ChevronRight, Clock } from "lucide-react";
import type { TokenMetrics } from "@/hooks/use-token-metrics";

type RecentActivityProps = {
  metrics: TokenMetrics | null;
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

export function RecentActivity({ metrics, isLoading }: RecentActivityProps) {
  if (isLoading) {
    return (
      <div className="flex h-full flex-col border-2 border-border bg-card">
        <div className="border-border border-b-2 p-4">
          <div className="mb-1 h-4 w-32 animate-pulse bg-muted" />
          <div className="h-3 w-24 animate-pulse bg-muted" />
        </div>
        <div className="flex-1 p-4">
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div className="flex items-start gap-3" key={i}>
                <div className="mt-1 h-2 w-2 animate-pulse bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-full animate-pulse bg-muted" />
                  <div className="h-2 w-24 animate-pulse bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!metrics?.timeline || metrics.timeline.length === 0) {
    return (
      <div className="flex h-full flex-col border-2 border-border bg-card">
        <div className="border-border border-b-2 p-4">
          <h3 className="font-bold font-mono text-sm uppercase tracking-wider">
            RECENT_LOG
          </h3>
          <p className="mt-1 font-mono text-muted-foreground text-xs">
            LATEST EVENTS
          </p>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <span className="font-mono text-muted-foreground text-sm uppercase">
            NO_DATA_AVAILABLE
          </span>
        </div>
      </div>
    );
  }

  const recentActivity = metrics.timeline
    .filter((item) => item.total_tokens && item.total_tokens > 0)
    .slice(-6)
    .reverse();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex h-full cursor-default flex-col border-2 border-border bg-card transition-colors hover:border-primary/50">
          <div className="flex items-center justify-between border-border border-b-2 p-4">
            <div>
              <h3 className="font-bold font-mono text-sm uppercase tracking-wider">
                RECENT_LOG
              </h3>
              <p className="mt-1 font-mono text-muted-foreground text-xs">
                LATEST EVENTS
              </p>
            </div>
            <Activity className="h-4 w-4 text-accent" />
          </div>

          <div className="flex-1 overflow-hidden p-4">
            <div className="space-y-3">
              {recentActivity.map((item) => {
                const time = new Date(item.time);
                const timeAgo = getTimeAgo(time);
                const itemKey = `${item.time}-${item.total_tokens || 0}`;

                return (
                  <div
                    className="group flex items-start gap-3 border-border border-b pb-3 last:border-0 last:pb-0"
                    key={itemKey}
                  >
                    <div className="relative mt-1.5">
                      <div className="h-1.5 w-1.5 bg-primary" />
                      <div className="absolute inset-0 animate-ping bg-primary opacity-75" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold font-mono text-sm tabular-nums">
                          {formatNumber(item.total_tokens || 0)}
                        </span>
                        <span className="shrink-0 border border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground uppercase">
                          {timeAgo}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-1 font-mono text-muted-foreground text-xs">
                        <Clock className="h-3 w-3" />
                        <span>
                          {time.toLocaleString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-border border-t-2 p-3">
            <Button
              className="w-full justify-between border-2 font-mono text-xs uppercase tracking-wider"
              size="sm"
              variant="outline"
            >
              VIEW_ALL
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="left">
        <span className="font-mono text-xs">
          {recentActivity.length} recent events
        </span>
      </TooltipContent>
    </Tooltip>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) {
    return `${seconds}S`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}M`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}H`;
  }

  const days = Math.floor(hours / 24);
  return `${days}D`;
}
