"use client";

import { Card, CardContent } from "@workspace/ui/components/card";
import type { TokenSummary } from "@/hooks/use-token-metrics";

type StatCardProps = {
  title: string;
  value: number;
  change?: number;
  isPositive?: boolean;
};

function StatCard({ title, value, change, isPositive }: StatCardProps) {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col justify-between py-6">
        <div className="text-muted-foreground text-xs uppercase tracking-wider">
          {title}
        </div>
        <div>
          <div className="font-mono text-3xl tabular-nums tracking-tight">
            {formatNumber(value)}
          </div>
          {change !== undefined && (
            <div
              className={`mt-2 font-medium text-xs ${
                isPositive ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {isPositive ? "+" : ""}
              {change.toFixed(1)}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

type StatCardsProps = {
  summary: TokenSummary | null;
  isLoading?: boolean;
};

export function StatCards({ summary, isLoading }: StatCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card className="h-full" key={i}>
            <CardContent className="flex h-full items-center justify-center py-6">
              <div className="h-4 w-24 animate-pulse bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        change={12.3}
        isPositive={true}
        title="Total Tokens"
        value={summary.total}
      />
      <StatCard
        change={8.7}
        isPositive={true}
        title="Input Tokens"
        value={summary.input}
      />
      <StatCard
        change={15.2}
        isPositive={true}
        title="Output Tokens"
        value={summary.output}
      />
      <StatCard
        change={22.1}
        isPositive={true}
        title="Reasoning Tokens"
        value={summary.reasoning}
      />
    </div>
  );
}
