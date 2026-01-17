import type { ResultAsync } from "neverthrow";
import { trackData } from "./api.js";
import type { TrackData } from "./types.js";

export class TokenTracker {
  private readonly apiUrl: string;

  constructor(config: { apiUrl: string }) {
    this.apiUrl = config.apiUrl;
  }

  track(data: TrackData): ResultAsync<void, Error> {
    return trackData(this.apiUrl, data);
  }
}
