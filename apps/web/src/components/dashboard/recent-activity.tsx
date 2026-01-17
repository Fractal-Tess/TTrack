"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import type { TokenMetrics } from "@/hooks/use-token-metrics";

interface RecentActivityProps {
  metrics: TokenMetrics | null;
  isLoading?: boolean;
}

export function RecentActivity({ metrics, isLoading }: RecentActivityProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest token usage events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div className="flex items-center gap-3" key={i}>
                <div className="h-3 w-3 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-48 animate-pulse bg-muted" />
                  <div className="h-2 w-32 animate-pulse bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics?.timeline || metrics.timeline.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest token usage events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground text-sm">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentActivity = metrics.timeline
    .filter((item) => item.total_tokens && item.total_tokens > 0)
    .slice(-4)
    .reverse();

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest token usage events</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-3">
          {recentActivity.map((item) => {
            const time = new Date(item.time);
            const timeAgo = getTimeAgo(time);
            const itemKey = `${item.time}-${item.total_tokens || 0}`;

            return (
              <div
                className="flex items-start gap-3 border-b pb-3 last:border-0 last:pb-0"
                key={itemKey}
              >
                <div className="mt-1 h-2 w-2 rounded-full bg-foreground" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-xs">
                      {item.total_tokens?.toLocaleString() || 0} tokens
                    </span>
                    <Badge className="text-[10px]" variant="outline">
                      {timeAgo}
                    </Badge>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {time.toLocaleString("en-US", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
      <CardFooter className="border-t">
        <Button className="w-full" size="sm" variant="outline">
          View All
        </Button>
      </CardFooter>
    </Card>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) {
    return `${seconds}s ago`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
