"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";

interface AgentBreakdownProps {
  data: {
    name: string;
    value: number;
  }[];
}

export function AgentBreakdown({ data }: AgentBreakdownProps) {
  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Agent Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                width={100}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                cursor={{ fill: "transparent" }}
                contentStyle={{
                  backgroundColor: "var(--background)",
                  borderColor: "var(--border)",
                }}
                itemStyle={{ color: "var(--foreground)" }}
              />
              <Bar
                dataKey="value"
                fill="currentColor"
                radius={[0, 4, 4, 0]}
                className="fill-primary"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
