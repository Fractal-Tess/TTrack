<p align="center">
  <img src="assets/logo.svg" alt="TTrack" width="160" />
</p>

<p align="center">
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-16-000000?logo=next.js" alt="Next.js 16" /></a>
  <a href="https://docs.influxdata.com/influxdb/v2/"><img src="https://img.shields.io/badge/InfluxDB-2.x-00DBBC?logo=influxdb&logoColor=white" alt="Needs InfluxDB 2.x" /></a>
  <a href="https://bun.sh"><img src="https://img.shields.io/badge/Bun-1.3-000000?logo=bun" alt="Bun 1.3" /></a>
</p>

<h1 align="center">TTrack</h1>

<p align="center">
  <img src="assets/screenshots/hero.webp" alt="Two dashboard windows: thirty days of token totals, a daily timeline and breakdowns by model, project and agent, and in front a seven-day view with the project filter open" width="100%" />
</p>

<p align="center">
  A dashboard that shows where your AI coding tokens went.
</p>

TTrack records every assistant turn from OpenCode and the Codex CLI into InfluxDB, then puts it on one page: input, output, reasoning and cache tokens, per project, model and agent, over any range from five minutes to a year. It is for people who run coding agents across several repositories and want to know which ones eat the budget, without opening each provider's billing page.

- **Collect** turns automatically, with an OpenCode plugin and a `notify` hook for Codex. Each turn also carries the lines added and removed and the files it touched.
- **Compare** any range with the one before it, and split the totals by project, model and agent.
- **Separate** billable tokens (input, output, reasoning) from cache reads, which are usually most of the total and cost far less.

## Quick start

```bash
git clone https://github.com/Fractal-Tess/TTrack.git
cd TTrack
docker compose up -d
```

This starts InfluxDB on port 8086 and the dashboard on [localhost:3000](http://localhost:3000). The dashboard stays empty until a collector sends something. To hook up OpenCode:

```bash
bun install
bun run --cwd apps/opencode-plugin build
apps/opencode-plugin/install-global.sh
```

Then write the InfluxDB details to `~/.config/opencode/ttrack.json` and restart OpenCode:

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

Codex setup, manual InfluxDB setup and the environment variables are in [INSTALL.md](INSTALL.md).

## A closer look

<table>
  <tr>
    <td><img src="assets/screenshots/filters.webp" alt="Dashboard filtered to the gitadel project over seven days, showing billable tokens per hour with a tooltip on one bar" /></td>
    <td><img src="assets/screenshots/models.webp" alt="Model filter open over the 24-hour view, listing the models used that day" /></td>
  </tr>
  <tr>
    <td colspan="2"><img src="assets/screenshots/breakdown.webp" alt="Thirty-day timeline above three panels: top models, tokens per project, and a radar chart of agent usage" /></td>
  </tr>
</table>

## More

- [INSTALL.md](INSTALL.md): running the stack, the OpenCode plugin and the Codex hook
- [CONTRIBUTING.md](CONTRIBUTING.md): repository layout, development and remaking the README images
