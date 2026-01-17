# TTrack Web Dashboard Knowledge Base

**Generated:** 2026-01-17

## OVERVIEW

Next.js 16 dashboard for token usage metrics with InfluxDB storage, SWR data fetching, and Recharts visualization.

## STRUCTURE

```
apps/web/
├── src/app/api/         # Track (POST), metrics (GET) routes
├── src/lib/influx.ts    # InfluxDB client & query API
├── src/env.ts           # Zod-validated environment config
└── next.config.mjs      # Transpile @workspace/ui
```

## WHERE TO LOOK

| Task            | Location                       | Notes                          |
| --------------- | ------------------------------ | ------------------------------ |
| Data ingestion  | `src/app/api/track/route.ts`   | POST handler, Point mapping    |
| Metrics query   | `src/app/api/metrics/route.ts` | Flux queries, windows          |
| InfluxDB client | `src/lib/influx.ts`            | Client singleton, config       |
| Env validation  | `src/env.ts`                   | Zod schema, runtime validation |
| Dashboard UI    | `src/app/page.tsx`             | SWR + Recharts implementation  |

## CONVENTIONS

- Route handlers: `src/app/api/[route]/route.ts`
- `POST /api/track` - Accepts tracking items array, writes to InfluxDB
- `GET /api/metrics` - Supports `?range=1h|24h|7d|30d|90d`
- Measurement: `token_usage` with tags (agent, model, project)
- Fields: 6 token types (input, output, total, reasoning, cache_read, cache_write)
- Window periods: 1m (1h), 15m (24h), 1h (7d), 4h (30d), 1d (90d)
- Zod env validation via `@t3-oss/env-nextjs`
- Prefix client vars with `NEXT_PUBLIC_` to expose

## UNIQUE STYLES

```typescript
// InfluxDB write pattern
const point = new Point("token_usage")
  .tag("agent", item.agentName)
  .floatField("input_tokens", item.inputTokens);

// Flux aggregation
|> aggregateWindow(every: ${windowPeriod}, fn: sum, createEmpty: true)

// SWR fetch pattern
const { data } = useSWR("/api/metrics?range=24h", fetcher);
```

- API returns: `{ summary, agents, models, projects, timeline }`
- No local components - import all from `@workspace/ui/components`
