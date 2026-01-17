import { InfluxDB } from "@influxdata/influxdb-client";

const url = process.env.INFLUXDB_URL || "http://localhost:8086";
const token = process.env.INFLUXDB_TOKEN || "my-super-secret-auth-token";
const org = process.env.INFLUXDB_ORG || "ttrack-org";
const bucket = process.env.INFLUXDB_BUCKET || "token-usage";

export const influxDB = new InfluxDB({ url, token });
export const queryApi = influxDB.getQueryApi(org);

export const config = {
  org,
  bucket,
};
