import { NextRequest, NextResponse } from "next/server";
import { queryApi, config } from "@/lib/influx";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const range = searchParams.get("range") || "24h";

  let windowPeriod = "15m";
  switch (range) {
    case "1h":
      windowPeriod = "1m";
      break;
    case "24h":
      windowPeriod = "15m";
      break;
    case "7d":
      windowPeriod = "1h";
      break;
    case "30d":
      windowPeriod = "4h";
      break;
    case "90d":
      windowPeriod = "1d";
      break;
  }

  const fluxQuerySummary = `
    from(bucket: "${config.bucket}")
      |> range(start: -${range})
      |> filter(fn: (r) => r["_measurement"] == "token_usage")
      |> filter(fn: (r) => r["_field"] == "total_tokens" or r["_field"] == "input_tokens" or r["_field"] == "output_tokens")
      |> group(columns: ["_field"])
      |> sum()
  `;

  const fluxQueryByAgent = `
    from(bucket: "${config.bucket}")
      |> range(start: -${range})
      |> filter(fn: (r) => r["_measurement"] == "token_usage")
      |> filter(fn: (r) => r["_field"] == "total_tokens")
      |> group(columns: ["agent"])
      |> sum()
      |> group() 
      |> sort(columns: ["_value"], desc: true)
  `;

  const fluxQueryTimeline = `
    from(bucket: "${config.bucket}")
      |> range(start: -${range})
      |> filter(fn: (r) => r["_measurement"] == "token_usage")
      |> filter(fn: (r) => r["_field"] == "total_tokens")
      |> aggregateWindow(every: ${windowPeriod}, fn: sum, createEmpty: true)
      |> yield(name: "timeline")
  `;

  try {
    const summaryData: any = { total: 0, input: 0, output: 0 };
    const agentData: any[] = [];
    const timelineData: any[] = [];

    await new Promise<void>((resolve, reject) => {
      queryApi.queryRows(fluxQuerySummary, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row);
          if (o._field === "total_tokens") summaryData.total = o._value;
          if (o._field === "input_tokens") summaryData.input = o._value;
          if (o._field === "output_tokens") summaryData.output = o._value;
        },
        error(error) {
          reject(error);
        },
        complete() {
          resolve();
        },
      });
    });

    await new Promise<void>((resolve, reject) => {
      queryApi.queryRows(fluxQueryByAgent, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row);
          agentData.push({ name: o.agent, value: o._value });
        },
        error(error) {
          reject(error);
        },
        complete() {
          resolve();
        },
      });
    });

    await new Promise<void>((resolve, reject) => {
      queryApi.queryRows(fluxQueryTimeline, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row);
          timelineData.push({ time: o._time, value: o._value || 0 });
        },
        error(error) {
          reject(error);
        },
        complete() {
          resolve();
        },
      });
    });

    return NextResponse.json({
      summary: summaryData,
      agents: agentData,
      timeline: timelineData,
    });
  } catch (e: any) {
    console.error("Error querying InfluxDB", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
