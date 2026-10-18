# Contributing to TTrack

TTrack is a Bun and Turborepo monorepo. The flake provides Bun: run `nix develop`, or use direnv.

```bash
bun install
bun run dev        # all workspaces through turbo
```

## Layout

```
apps/
  web/              Next.js dashboard; /api/metrics runs the Flux queries
  opencode-plugin/  OpenCode plugin
  codex-plugin/     Codex notify hook and CLI
packages/
  tracker/          Writes TrackData points to InfluxDB
  ui/               Shared shadcn/ui components and global styles
  typescript-config/
```

Every collector writes a `token_usage` point tagged with `project`, `model` and `agent`. Its fields are the input, output, reasoning, cache read and cache write tokens, plus `total_tokens`, `billable_tokens` (input + output + reasoning), `additions`, `deletions` and `files_changed`. See `packages/tracker/src/api.ts`.

Code style is Biome through Ultracite, run by lefthook on commit. More conventions are in [AGENTS.md](AGENTS.md).

## README images

The README cover and gallery are composed in `assets/screenshots/source/`: one HTML file per image (`hero.html`, `filters.html`, `models.html`, `breakdown.html`) sharing `style.css`. They load raw captures from `assets/screenshots/source/shots/`, which is not committed.

To remake them:

1. Run the dashboard against an InfluxDB that has a few weeks of data in it, and hide the Next.js dev indicator.
2. Capture with a device scale of 2:
   - `dashboard.png`: the 30D view at 1440 × 1160
   - `front.png`: the 7D view with the project filter open, at 1240 × 780
   - `gitadel.png`: 7D, filtered to one project, Billable tab selected, hovering a bar, at 1440 × 1160
   - `models-open.png`: 24H with the model filter open, at 1440 × 1160
3. Render and convert each layout:

```bash
cd assets/screenshots
for f in hero filters models breakdown; do
  google-chrome-stable --headless=new --hide-scrollbars --force-device-scale-factor=2 \
    --window-size=1600,1000 --screenshot=/tmp/$f.png "file://$PWD/source/$f.html"
  cwebp -q 82 /tmp/$f.png -o $f.webp
done
```
