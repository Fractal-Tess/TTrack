import { type NextRequest, NextResponse } from "next/server";
import { config, queryApi } from "@/lib/influx";

const RANGE_REGEX = /^(\d+)([mhd])$/;

function parseRange(range: string): { value: number; unit: string } {
  const match = range.match(RANGE_REGEX);
  if (!match) {
    return { value: 3, unit: "h" };
  }
  const value = match[1];
  const unit = match[2];
  if (!(value && unit)) {
    return { value: 3, unit: "h" };
  }
  return {
    value: Number.parseInt(value, 10),
    unit,
  };
}

function getWindowPeriod(range: string): string {
  switch (range) {
    case "5m":
      return "10s";
    case "30m":
      return "30s";
    case "1h":
      return "1m";
    case "3h":
      return "3m";
    case "6h":
      return "5m";
    case "12h":
      return "10m";
    case "24h":
      return "15m";
    case "7d":
      return "1h";
    case "30d":
      return "4h";
    case "90d":
      return "1d";
    case "365d":
      return "1d";
    default:
      return "3m";
  }
}

type FilterParams = {
  project?: string | null;
  model?: string | null;
  agent?: string | null;
};

function buildFilterConditions(filters: FilterParams): string {
  const conditions: string[] = [];
  if (filters.project) {
    conditions.push(`r["project"] == "${filters.project}"`);
  }
  if (filters.model) {
    conditions.push(`r["model"] == "${filters.model}"`);
  }
  if (filters.agent) {
    conditions.push(`r["agent"] == "${filters.agent}"`);
  }
  return conditions.length > 0
    ? conditions.map((c) => `|> filter(fn: (r) => ${c})`).join("\n      ")
    : "";
}

function buildSummaryQuery(
  bucket: string,
  start: string,
  stop: string | null,
  filters: FilterParams
): string {
  const rangeClause = stop
    ? `range(start: ${start}, stop: ${stop})`
    : `range(start: ${start})`;
  const filterConditions = buildFilterConditions(filters);

  return `
    from(bucket: "${bucket}")
      |> ${rangeClause}
      |> filter(fn: (r) => r["_measurement"] == "token_usage")
      |> filter(fn: (r) => r["_field"] == "total_tokens" or r["_field"] == "input_tokens" or r["_field"] == "output_tokens" or r["_field"] == "reasoning_tokens" or r["_field"] == "cache_read_tokens" or r["_field"] == "cache_write_tokens" or r["_field"] == "billable_tokens" or r["_field"] == "additions" or r["_field"] == "deletions" or r["_field"] == "files_changed")
      ${filterConditions}
      |> group(columns: ["_field"])
      |> sum()
  `;
}

function buildAgentQuery(
  bucket: string,
  start: string,
  stop: string | null,
  filters: FilterParams
): string {
  const rangeClause = stop
    ? `range(start: ${start}, stop: ${stop})`
    : `range(start: ${start})`;
  const filterConditions = buildFilterConditions(filters);

  return `
    from(bucket: "${bucket}")
      |> ${rangeClause}
      |> filter(fn: (r) => r["_measurement"] == "token_usage")
      |> filter(fn: (r) => r["_field"] == "total_tokens")
      ${filterConditions}
      |> group(columns: ["agent"])
      |> sum()
      |> group()
      |> sort(columns: ["_value"], desc: true)
  `;
}

function buildModelQuery(
  bucket: string,
  start: string,
  stop: string | null,
  filters: FilterParams
): string {
  const rangeClause = stop
    ? `range(start: ${start}, stop: ${stop})`
    : `range(start: ${start})`;
  const filterConditions = buildFilterConditions(filters);

  return `
    from(bucket: "${bucket}")
      |> ${rangeClause}
      |> filter(fn: (r) => r["_measurement"] == "token_usage")
      |> filter(fn: (r) => r["_field"] == "total_tokens")
      ${filterConditions}
      |> group(columns: ["model"])
      |> sum()
      |> group()
      |> sort(columns: ["_value"], desc: true)
  `;
}

function buildProjectQuery(
  bucket: string,
  start: string,
  stop: string | null,
  filters: FilterParams
): string {
  const rangeClause = stop
    ? `range(start: ${start}, stop: ${stop})`
    : `range(start: ${start})`;
  const filterConditions = buildFilterConditions(filters);

  return `
    from(bucket: "${bucket}")
      |> ${rangeClause}
      |> filter(fn: (r) => r["_measurement"] == "token_usage")
      |> filter(fn: (r) => r["_field"] == "total_tokens")
      ${filterConditions}
      |> group(columns: ["project"])
      |> sum()
      |> group()
      |> sort(columns: ["_value"], desc: true)
  `;
}

function buildTimelineQuery(
  bucket: string,
  range: string,
  windowPeriod: string,
  filters: FilterParams,
  startDate?: string | null,
  endDate?: string | null
): string {
  let rangeClause: string;
  if (startDate) {
    if (endDate) {
      rangeClause = `range(start: ${startDate}, stop: ${endDate})`;
    } else {
      rangeClause = `range(start: ${startDate})`;
    }
  } else {
    rangeClause = `range(start: -${range})`;
  }
  const filterConditions = buildFilterConditions(filters);

  return `
    from(bucket: "${bucket}")
      |> ${rangeClause}
      |> filter(fn: (r) => r["_measurement"] == "token_usage")
      |> filter(fn: (r) => r["_field"] == "total_tokens" or r["_field"] == "input_tokens" or r["_field"] == "output_tokens" or r["_field"] == "reasoning_tokens" or r["_field"] == "cache_read_tokens" or r["_field"] == "cache_write_tokens" or r["_field"] == "billable_tokens" or r["_field"] == "additions" or r["_field"] == "deletions" or r["_field"] == "files_changed")
      ${filterConditions}
      |> group(columns: ["_field"])
      |> aggregateWindow(every: ${windowPeriod}, fn: sum, createEmpty: false)
  `;
}

type SummaryData = {
  total: number;
  input: number;
  output: number;
  reasoning: number;
  cacheRead: number;
  cacheWrite: number;
  billable: number;
  additions: number;
  deletions: number;
  filesChanged: number;
};

function createEmptySummary(): SummaryData {
  return {
    total: 0,
    input: 0,
    output: 0,
    reasoning: 0,
    cacheRead: 0,
    cacheWrite: 0,
    billable: 0,
    additions: 0,
    deletions: 0,
    filesChanged: 0,
  };
}

function calculateChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}

function querySummary(fluxQuery: string): Promise<SummaryData> {
  const summary = createEmptySummary();
  const fieldToKey: Record<string, keyof SummaryData> = {
    total_tokens: "total",
    input_tokens: "input",
    output_tokens: "output",
    reasoning_tokens: "reasoning",
    cache_read_tokens: "cacheRead",
    cache_write_tokens: "cacheWrite",
    billable_tokens: "billable",
    additions: "additions",
    deletions: "deletions",
    files_changed: "filesChanged",
  };

  return new Promise((resolve, reject) => {
    queryApi.queryRows(fluxQuery, {
      next(row, tableMeta) {
        const o = tableMeta.toObject(row);
        const key = fieldToKey[o._field as string];
        if (key) {
          summary[key] = o._value;
        }
      },
      error(error) {
        reject(error);
      },
      complete() {
        resolve(summary);
      },
    });
  });
}

function queryBreakdown(
  fluxQuery: string
): Promise<Array<{ name: string; value: number }>> {
  const data: Array<{ name: string; value: number }> = [];

  return new Promise((resolve, reject) => {
    queryApi.queryRows(fluxQuery, {
      next(row, tableMeta) {
        const o = tableMeta.toObject(row);
        const name = o.agent || o.model || o.project;
        if (name) {
          data.push({ name, value: o._value });
        }
      },
      error(error) {
        reject(error);
      },
      complete() {
        resolve(data);
      },
    });
  });
}

function queryTimeline(fluxQuery: string): Promise<
  Array<{
    time: string;
    [key: string]: string | number | undefined;
  }>
> {
  const data: Array<{
    time: string;
    [key: string]: string | number | undefined;
  }> = [];

  return new Promise((resolve, reject) => {
    queryApi.queryRows(fluxQuery, {
      next(row, tableMeta) {
        const o = tableMeta.toObject(row);
        const timelineItem = data.find((t) => t.time === o._time);
        if (timelineItem) {
          timelineItem[o._field] = o._value || 0;
        } else {
          data.push({ time: o._time, [o._field]: o._value || 0 });
        }
      },
      error(error) {
        reject(error);
      },
      complete() {
        resolve(data);
      },
    });
  });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const range = searchParams.get("range") || "3h";
  const project = searchParams.get("project");
  const model = searchParams.get("model");
  const agent = searchParams.get("agent");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const filters: FilterParams = {
    project,
    model,
    agent,
  };

  const windowPeriod = getWindowPeriod(range);
  const { value, unit } = parseRange(range);

  const previousStart = `-${2 * value}${unit}`;
  const previousStop = `-${value}${unit}`;

  const currentSummaryQuery = buildSummaryQuery(
    config.bucket,
    `-${range}`,
    null,
    filters
  );
  const currentAgentQuery = buildAgentQuery(
    config.bucket,
    `-${range}`,
    null,
    filters
  );
  const currentModelQuery = buildModelQuery(
    config.bucket,
    `-${range}`,
    null,
    filters
  );
  const currentProjectQuery = buildProjectQuery(
    config.bucket,
    `-${range}`,
    null,
    filters
  );
  const timelineQuery = buildTimelineQuery(
    config.bucket,
    range,
    windowPeriod,
    filters,
    startDate,
    endDate
  );

  const previousSummaryQuery = buildSummaryQuery(
    config.bucket,
    previousStart,
    previousStop,
    filters
  );

  const [
    currentSummary,
    currentAgents,
    currentModels,
    currentProjects,
    timelineData,
    previousSummary,
  ] = await Promise.all([
    querySummary(currentSummaryQuery),
    queryBreakdown(currentAgentQuery),
    queryBreakdown(currentModelQuery),
    queryBreakdown(currentProjectQuery),
    queryTimeline(timelineQuery),
    querySummary(previousSummaryQuery),
  ]);

  const changes = {
    total: calculateChange(currentSummary.total, previousSummary.total),
    input: calculateChange(currentSummary.input, previousSummary.input),
    output: calculateChange(currentSummary.output, previousSummary.output),
    reasoning: calculateChange(
      currentSummary.reasoning,
      previousSummary.reasoning
    ),
    cacheRead: calculateChange(
      currentSummary.cacheRead,
      previousSummary.cacheRead
    ),
    cacheWrite: calculateChange(
      currentSummary.cacheWrite,
      previousSummary.cacheWrite
    ),
    additions: calculateChange(
      currentSummary.additions,
      previousSummary.additions
    ),
    deletions: calculateChange(
      currentSummary.deletions,
      previousSummary.deletions
    ),
    filesChanged: calculateChange(
      currentSummary.filesChanged,
      previousSummary.filesChanged
    ),
  };

  return NextResponse.json({
    summary: currentSummary,
    changes,
    previousSummary,
    agents: currentAgents,
    models: currentModels,
    projects: currentProjects,
    timeline: timelineData,
  });
}
