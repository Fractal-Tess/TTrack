import { InfluxDB } from "@influxdata/influxdb-client";
import { env } from "@/env";

export const influxDB = new InfluxDB({
  url: env.INFLUXDB_URL,
  token: env.INFLUXDB_TOKEN,
});
export const queryApi = influxDB.getQueryApi(env.INFLUXDB_ORG);

export const config = {
  org: env.INFLUXDB_ORG,
  bucket: env.INFLUXDB_BUCKET,
};
