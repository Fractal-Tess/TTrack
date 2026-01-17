import { fromPromise, type ResultAsync } from "neverthrow";
import type { TrackData } from "./types.js";

export function trackData(
  apiUrl: string,
  data: TrackData
): ResultAsync<void, Error> {
  return fromPromise(
    fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }).then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }),
    (error) => (error instanceof Error ? error : new Error(String(error)))
  );
}
