import { type NextRequest, NextResponse } from "next/server";
import { config, queryApi } from "@/lib/influx";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const range = searchParams.get("range") || "3h";

  let windowPeriod = "5m";
  switch (range) {
    case "5m":
      windowPeriod = "10s";
      break;
    case "30m":
      windowPeriod = "30s";
      break;
    case "1h":
      windowPeriod = "1m";
      break;
    case "3h":
      windowPeriod = "3m";
      break;
    case "6h":
      windowPeriod = "5m";
      break;
    case "12h":
      windowPeriod = "10m";
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
    case "365d":
      windowPeriod = "1d";
      break;
    default:
      windowPeriod = "3m";
      break;
  }

  const fluxQuerySummary = `
    from(bucket: "${config.bucket}")
      |> range(start: -${range})
      |> filter(fn: (r) => r["_measurement"] == "token_usage")
      |> filter(fn: (r) => r["_field"] == "total_tokens" or r["_field"] == "input_tokens" or r["_field"] == "output_tokens" or r["_field"] == "reasoning_tokens" or r["_field"] == "cache_read_tokens" or r["_field"] == "cache_write_tokens" or r["_field"] == "additions" or r["_field"] == "deletions" or r["_field"] == "files_changed")
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

  const fluxQueryByModel = `
    from(bucket: "${config.bucket}")
      |> range(start: -${range})
      |> filter(fn: (r) => r["_measurement"] == "token_usage")
      |> filter(fn: (r) => r["_field"] == "total_tokens")
      |> group(columns: ["model"])
      |> sum()
      |> group()
      |> sort(columns: ["_value"], desc: true)
  `;

  const fluxQueryByProject = `
    from(bucket: "${config.bucket}")
      |> range(start: -${range})
      |> filter(fn: (r) => r["_measurement"] == "token_usage")
      |> filter(fn: (r) => r["_field"] == "total_tokens")
      |> group(columns: ["project"])
      |> sum()
      |> group()
      |> sort(columns: ["_value"], desc: true)
  `;

  const fluxQueryTimeline = `
    from(bucket: "${config.bucket}")
      |> range(start: -${range})
      |> filter(fn: (r) => r["_measurement"] == "token_usage")
      |> filter(fn: (r) => r["_field"] == "total_tokens" or r["_field"] == "input_tokens" or r["_field"] == "output_tokens" or r["_field"] == "reasoning_tokens" or r["_field"] == "cache_read_tokens" or r["_field"] == "cache_write_tokens" or r["_field"] == "additions" or r["_field"] == "deletions" or r["_field"] == "files_changed")
      |> group(columns: ["_field"])
      |> aggregateWindow(every: ${windowPeriod}, fn: sum, createEmpty: false)
  `;

  try {
    const summaryData: {
      total: number;
      input: number;
      output: number;
      reasoning: number;
      cacheRead: number;
      cacheWrite: number;
      additions: number;
      deletions: number;
      filesChanged: number;
    } = {
      total: 0,
      input: 0,
      output: 0,
      reasoning: 0,
      cacheRead: 0,
      cacheWrite: 0,
      additions: 0,
      deletions: 0,
      filesChanged: 0,
    };
    const agentData: Array<{ name: string; value: number }> = [];
    const modelData: Array<{ name: string; value: number }> = [];
    const projectData: Array<{ name: string; value: number }> = [];
    const timelineData: Array<{
      time: string;
      [key: string]: string | number | undefined;
    }> = [];

    const fieldToKey: Record<string, keyof typeof summaryData> = {
      total_tokens: "total",
      input_tokens: "input",
      output_tokens: "output",
      reasoning_tokens: "reasoning",
      cache_read_tokens: "cacheRead",
      cache_write_tokens: "cacheWrite",
      additions: "additions",
      deletions: "deletions",
      files_changed: "filesChanged",
    };

    await new Promise<void>((resolve, reject) => {
      queryApi.queryRows(fluxQuerySummary, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row);
          const key = fieldToKey[o._field as string];
          if (key) {
            summaryData[key] = o._value;
          }
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
      queryApi.queryRows(fluxQueryByModel, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row);
          modelData.push({ name: o.model, value: o._value });
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
      queryApi.queryRows(fluxQueryByProject, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row);
          projectData.push({ name: o.project, value: o._value });
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
          const timelineItem = timelineData.find((t) => t.time === o._time);
          if (timelineItem) {
            timelineItem[o._field] = o._value || 0;
          } else {
            timelineData.push({ time: o._time, [o._field]: o._value || 0 });
          }
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
      models: modelData,
      projects: projectData,
      timeline: timelineData,
    });
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    console.error("Error querying InfluxDB", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
