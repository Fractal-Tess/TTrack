import { appendFileSync } from "node:fs";
import { join } from "node:path";
import { InfluxDB, Point } from "@influxdata/influxdb-client";
import { fromPromise, type ResultAsync } from "neverthrow";
import type { TrackData } from "./types.js";

export type InfluxDBConfig = {
  url: string;
  token: string;
  org: string;
  bucket: string;
};

const ERROR_LOG_PATH = join(process.cwd(), ".ttrack-errors.log");

function logErrorToFile(error: Error): void {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] InfluxDB write error: ${error.message}\n`;
    appendFileSync(ERROR_LOG_PATH, logEntry);
  } catch {
    // Intentionally empty - suppress file logging errors to prevent UI disruption
  }
}

export function trackData(
  config: InfluxDBConfig,
  data: TrackData
): ResultAsync<void, Error> {
  const influxDB = new InfluxDB({
    url: config.url,
    token: config.token,
  });

  const writeApi = influxDB.getWriteApi(config.org, config.bucket);

  const totalTokens =
    data.inputTokens +
    data.outputTokens +
    data.reasoningTokens +
    data.cacheReadTokens +
    data.cacheWriteTokens;

  const billableTokens =
    data.inputTokens + data.outputTokens + data.reasoningTokens;

  const point = new Point("token_usage")
    .tag("agent", data.agentName)
    .tag("model", data.model)
    .tag("project", data.projectName)
    .floatField("input_tokens", data.inputTokens)
    .floatField("output_tokens", data.outputTokens)
    .floatField("total_tokens", totalTokens)
    .floatField("billable_tokens", billableTokens)
    .floatField("reasoning_tokens", data.reasoningTokens)
    .floatField("cache_read_tokens", data.cacheReadTokens)
    .floatField("cache_write_tokens", data.cacheWriteTokens)
    .floatField("additions", data.additions)
    .floatField("deletions", data.deletions)
    .floatField("files_changed", data.filesChanged);

  writeApi.writePoint(point);

  return fromPromise(
    writeApi.close().catch((error) => {
      const err = error instanceof Error ? error : new Error(String(error));
      logErrorToFile(err);
    }),
    (error) => (error instanceof Error ? error : new Error(String(error)))
  );
}
