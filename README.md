# TTrack

Token Usage Tracking System for AI/LLM operations.

## Overview

TTrack monitors and aggregates token consumption across AI model interactions. Data is stored in InfluxDB with a 90-day retention policy.

## Stack

- Bun 1.3.5
- Next.js 16
- React 19
- TypeScript
- InfluxDB
- TailwindCSS v4
- Recharts

## Structure

```
TTrack/
├── apps/web/              # Next.js dashboard
├── packages/
│   ├── tracker/           # Token tracking client
│   ├── ui/                # Shared UI components
│   └── typescript-config/  # Shared TS configs
```

## Quick Start

### Prerequisites

- Bun 1.3.5+
- Docker (for InfluxDB)

### Setup

```bash
# Install dependencies
bun install

# Start InfluxDB
docker-compose up -d

# Start development server
bun run dev
```

## Usage

### Tracking Tokens

```typescript
import { TokenTracker } from "@workspace/tracker";

const tracker = new TokenTracker({
  url: process.env.INFLUX_URL,
  token: process.env.INFLUX_TOKEN,
  org: process.env.INFLUX_ORG,
  bucket: process.env.INFLUX_BUCKET,
});

await tracker.track({
  model: "gpt-4",
  project: "my-project",
  agent: "code-assistant",
  tokens: 1500,
  promptTokens: 1000,
  completionTokens: 500,
});
```

### Dashboard

Access the dashboard at `http://localhost:3000` after starting the dev server.

## Configuration

Environment variables are validated using Zod. See `apps/web/src/env.ts` for required configuration.

## Development

```bash
# Build all packages
bun run build

# Run tests
bun run test

# Format code
bun x ultracite fix
```

## License

MIT
