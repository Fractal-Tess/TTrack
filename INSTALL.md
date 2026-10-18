# Installing TTrack

TTrack has three parts: an InfluxDB 2.x bucket that stores one point per assistant turn, the Next.js dashboard that reads it, and a collector for each AI client you use.

## Dashboard and InfluxDB with Docker Compose

```bash
docker compose up -d
```

This runs InfluxDB 2.7 on port 8086 (org `ttrack`, bucket `token_usage`, admin token `ttrack-dev-token`, 90-day retention) and the dashboard on port 3000. Change the token and password in `docker-compose.yml` before exposing either port beyond your machine.

## Manual setup

1. Start InfluxDB 2.x and create a bucket, for example `token_usage`.
2. Create `apps/web/.env` with:

   | Variable              | Meaning                                    |
   | --------------------- | ------------------------------------------ |
   | `INFLUXDB_URL`        | InfluxDB address, e.g. `http://localhost:8086` |
   | `INFLUXDB_TOKEN`      | API token with read access to the bucket   |
   | `INFLUXDB_ORG`        | InfluxDB organization                      |
   | `INFLUXDB_BUCKET`     | Bucket name                                |
   | `NEXT_PUBLIC_APP_URL` | Public URL of the dashboard                |

3. Install and run:

   ```bash
   bun install
   cd apps/web && bun run dev
   ```

## OpenCode

The OpenCode plugin listens for completed assistant messages and writes their token counts, the model, the agent and the project (the worktree's folder name).

```bash
bun run --cwd apps/opencode-plugin build
apps/opencode-plugin/install-global.sh
```

The script copies the plugin to `~/.config/opencode/plugins/`. The plugin reads its connection from `~/.config/opencode/ttrack.json`:

```json
{
  "influxdb": {
    "url": "http://localhost:8086",
    "token": "ttrack-dev-token",
    "org": "ttrack",
    "bucket": "token_usage"
  }
}
```

Restart OpenCode to load it. Write failures are silent by default so a stopped InfluxDB never interrupts a session; set `"silent": false` under `influxdb` to see them.

## Codex CLI

Codex is tracked by `apps/codex-plugin`, a small CLI that Codex calls through its `notify` hook. After each completed turn it reads the newest session file in `~/.codex/sessions`, extracts the turn's token usage and `apply_patch` file changes, and sends the turn to InfluxDB. Turns are deduplicated by `turn_id`.

1. Build it:

   ```bash
   bun run --cwd apps/codex-plugin build
   ```

2. Put a `codex-ttrack` command on your `PATH` that runs:

   ```bash
   node /absolute/path/to/TTrack/apps/codex-plugin/dist/cli.js "$@"
   ```

3. Save the InfluxDB credentials (stored in `~/.config/codex-ttrack/config.json`):

   ```bash
   codex-ttrack configure
   ```

4. Install the hook. This adds `notify = ["codex-ttrack", "hook", "agent-turn-complete"]` to `~/.codex/config.toml`:

   ```bash
   codex-ttrack setup
   ```

5. Check it, then use `codex` as usual:

   ```bash
   codex-ttrack verify
   ```
