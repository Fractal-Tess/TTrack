import { appendFileSync } from "node:fs";
import { join } from "node:path";
import { InfluxDB, Point } from "@influxdata/influxdb-client";
import { fromPromise, Result, type ResultAsync } from "neverthrow";
import type { TrackData } from "./types.js";

export type InfluxDBConfig = {
  url: string;
  token: string;
  org: string;
  bucket: string;
};

const ERROR_LOG_PATH = join(process.cwd(), ".ttrack-errors.log");

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

const appendErrorLog = Result.fromThrowable(appendFileSync, toError);

function logErrorToFile(error: Error): void {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] InfluxDB write error: ${error.message}\n`;

  appendErrorLog(ERROR_LOG_PATH, logEntry);
}

export function trackData(
  config: InfluxDBConfig,
  data: TrackData
): ResultAsync<void, Error> {
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

  return fromPromise(
    Promise.resolve().then(async () => {
      const influxDB = new InfluxDB({
        url: config.url,
        token: config.token,
      });

      const writeApi = influxDB.getWriteApi(config.org, config.bucket);
      writeApi.writePoint(point);
      await writeApi.close();
    }),
    toError
  ).mapErr((error) => {
    logErrorToFile(error);
    return error;
  });
}
