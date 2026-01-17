"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { format } from "date-fns";

interface TokenChartProps {
  data: {
    time: string;
    value: number;
  }[];
}

export function TokenChart({ data }: TokenChartProps) {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Usage Over Time</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis
                dataKey="time"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(str) => {
                  try {
                    return format(new Date(str), "HH:mm");
                  } catch {
                    return "";
                  }
                }}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--background)",
                  borderColor: "var(--border)",
                }}
                itemStyle={{ color: "var(--foreground)" }}
                labelFormatter={(label) => {
                  try {
                    return format(new Date(label), "MMM d, HH:mm");
                  } catch {
                    return label;
                  }
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="currentColor"
                strokeWidth={2}
                dot={false}
                className="stroke-primary"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
