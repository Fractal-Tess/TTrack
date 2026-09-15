import type { ResultAsync } from "neverthrow";
import type { InfluxDBConfig } from "./api.js";
import { trackDataBatch } from "./api.js";
import type { TrackData } from "./types.js";

export class TokenTracker {
  private readonly config: InfluxDBConfig;

  private pendingData: TrackData[] = [];

  constructor(config: InfluxDBConfig) {
    this.config = config;
  }

  track(data: TrackData): ResultAsync<void, Error> {
    const dataToWrite = [...this.pendingData, data];

    return trackDataBatch(this.config, dataToWrite)
      .map(() => {
        this.pendingData = [];
        return undefined;
      })
      .mapErr((error) => {
        this.pendingData = dataToWrite;
        return error;
      });
  }
}
