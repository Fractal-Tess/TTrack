import type { ResultAsync } from "neverthrow";
import { type InfluxDBConfig, trackData } from "./tracker.js";
import type { TrackData } from "./types.js";

export type { InfluxDBConfig } from "./tracker.js";

export class TokenTracker {
  private readonly config: InfluxDBConfig;

  constructor(config: InfluxDBConfig) {
    this.config = config;
  }

  track(data: TrackData): ResultAsync<void, Error> {
    return trackData(this.config, data);
  }
}
