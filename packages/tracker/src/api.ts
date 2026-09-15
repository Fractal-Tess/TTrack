import {
  InfluxDB,
  Point,
  type WriteOptions,
} from "@influxdata/influxdb-client";
import { fromPromise, type ResultAsync } from "neverthrow";
import type { TrackData } from "./types.js";

export type InfluxDBConfig = {
  url: string;
  token: string;
  org: string;
  bucket: string;
  silent?: boolean;
};

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function createWriteOptions(config: InfluxDBConfig): Partial<WriteOptions> {
  if (!config.silent) {
    return {};
  }

  return {
    writeFailed: (error) => Promise.reject(error),
    writeRetrySkipped: () => undefined,
  };
}

function createPoint(data: TrackData): Point {
  const totalTokens =
    data.inputTokens +
    data.outputTokens +
    data.reasoningTokens +
    data.cacheReadTokens +
    data.cacheWriteTokens;

  const billableTokens =
    data.inputTokens + data.outputTokens + data.reasoningTokens;

  return new Point("token_usage")
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
}

export function trackDataBatch(
  config: InfluxDBConfig,
  data: TrackData[]
): ResultAsync<void, Error> {
  return fromPromise(
    Promise.resolve().then(async () => {
      if (data.length === 0) {
        return;
      }

      const influxDB = new InfluxDB({
        url: config.url,
        token: config.token,
      });

      const writeApi = influxDB.getWriteApi(
        config.org,
        config.bucket,
        undefined,
        createWriteOptions(config)
      );
      writeApi.writePoints(data.map(createPoint));
      await writeApi.close();
    }),
    toError
  );
}

export function trackData(
  config: InfluxDBConfig,
  data: TrackData
): ResultAsync<void, Error> {
  return trackDataBatch(config, [data]);
}
