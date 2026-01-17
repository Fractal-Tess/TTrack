import { InfluxDB, Point } from "@influxdata/influxdb-client";
import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/env";
import { config } from "@/lib/influx";

const influxDB = new InfluxDB({
  url: env.INFLUXDB_URL,
  token: env.INFLUXDB_TOKEN,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const writeApi = influxDB.getWriteApi(config.org, config.bucket);

    for (const item of body) {
      const point = new Point("token_usage")
        .tag("agent", item.agentName)
        .tag("model", item.model)
        .tag("project", item.projectName)
        .floatField("input_tokens", item.inputTokens)
        .floatField("output_tokens", item.outputTokens)
        .floatField("total_tokens", item.inputTokens + item.outputTokens)
        .floatField("reasoning_tokens", item.reasoningTokens)
        .floatField("cache_read_tokens", item.cacheReadTokens)
        .floatField("cache_write_tokens", item.cacheWriteTokens);

      writeApi.writePoint(point);
    }

    await writeApi.close();

    return NextResponse.json({ success: true });
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    console.error("Error writing to InfluxDB", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
