import { InfluxDB, Point, WriteApi } from "@influxdata/influxdb-client";

export interface TrackerConfig {
  url: string;
  token: string;
  org: string;
  bucket: string;
}

export interface TrackData {
  agentName: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  tags?: Record<string, string>;
}

export class TokenTracker {
  private client: InfluxDB;
  private writeApi: WriteApi;

  constructor(config: TrackerConfig) {
    this.client = new InfluxDB({ url: config.url, token: config.token });
    this.writeApi = this.client.getWriteApi(config.org, config.bucket);
  }

  track(data: TrackData, timestamp?: Date): void {
    const point = new Point("token_usage")
      .tag("agent", data.agentName)
      .tag("model", data.model)
      .floatField("input_tokens", data.inputTokens)
      .floatField("output_tokens", data.outputTokens)
      .floatField("total_tokens", data.inputTokens + data.outputTokens);

    if (timestamp) {
      point.timestamp(timestamp);
    }

    if (data.tags) {
      for (const [key, value] of Object.entries(data.tags)) {
        point.tag(key, value);
      }
    }

    this.writeApi.writePoint(point);
  }

  async flush(): Promise<void> {
    await this.writeApi.flush();
  }

  async close(): Promise<void> {
    await this.writeApi.close();
  }
}
