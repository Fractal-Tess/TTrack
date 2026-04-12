#!/usr/bin/env node

import { existsSync } from "node:fs";
import readline from "node:readline";
import {
  getCodexConfigPath,
  getCodexHome,
  getCodexSessionsDir,
  getConfigPath,
  hasSyncedTurn,
  isConfigured,
  loadConfig,
  markTurnSynced,
  maskSecret,
  saveConfig,
} from "./config.js";
import { handleHook } from "./hook.js";
import { findSessionFiles, parseSessionFile } from "./parser.js";
import { addNotifyHook, isNotifyHookConfigured } from "./toml.js";
import { trackTurn } from "./tracker.js";
import type { CodexTTrackConfig } from "./types.js";

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

function log(message: string): void {
  console.log(message);
}

function success(message: string): void {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
}

function failure(message: string): void {
  console.log(`${colors.red}✗${colors.reset} ${message}`);
}

function info(message: string): void {
  console.log(`${colors.blue}ℹ${colors.reset} ${message}`);
}

function warn(message: string): void {
  console.log(`${colors.yellow}⚠${colors.reset} ${message}`);
}

function prompt(question: string, defaultValue?: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const suffix = defaultValue ? ` [${defaultValue}]` : "";
  return new Promise((resolve) => {
    rl.question(`${question}${suffix}: `, (answer) => {
      rl.close();
      const trimmed = answer.trim();
      resolve(trimmed.length > 0 ? trimmed : (defaultValue ?? ""));
    });
  });
}

function parseBoolean(value: string, fallback: boolean): boolean {
  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "y" || normalized === "yes") {
    return true;
  }
  if (normalized === "false" || normalized === "n" || normalized === "no") {
    return false;
  }
  return fallback;
}

async function cmdConfigure(): Promise<void> {
  const current = loadConfig();
  const nextConfig: CodexTTrackConfig = {
    influxdb: {
      url: await prompt("InfluxDB URL", current.influxdb.url),
      token: await prompt("InfluxDB token", current.influxdb.token),
      org: await prompt("InfluxDB org", current.influxdb.org),
      bucket: await prompt("InfluxDB bucket", current.influxdb.bucket),
    },
    autoSync: parseBoolean(
      await prompt("Enable auto-sync", String(current.autoSync)),
      current.autoSync
    ),
    debug: parseBoolean(
      await prompt("Enable debug logging", String(current.debug)),
      current.debug
    ),
  };

  saveConfig(nextConfig);
  success("Configuration saved");
  info(`Config file: ${getConfigPath()}`);
}

function cmdSetup(): void {
  const codexHome = getCodexHome();
  if (!existsSync(codexHome)) {
    failure(`Codex home not found: ${codexHome}`);
    process.exitCode = 1;
    return;
  }

  const result = addNotifyHook(getCodexConfigPath());
  if (!result.success) {
    failure(`Failed to update Codex config: ${result.error}`);
    process.exitCode = 1;
    return;
  }

  success("Notify hook configured");
  info(`Codex config: ${getCodexConfigPath()}`);
}

function cmdVerify(): void {
  const config = loadConfig();
  let hasErrors = false;

  log(`${colors.bold}${colors.cyan}Configuration${colors.reset}`);
  if (isConfigured(config)) {
    success("InfluxDB credentials configured");
    log(`   URL: ${config.influxdb.url}`);
    log(`   Token: ${maskSecret(config.influxdb.token)}`);
    log(`   Org: ${config.influxdb.org}`);
    log(`   Bucket: ${config.influxdb.bucket}`);
  } else {
    failure("Configuration incomplete");
    hasErrors = true;
  }

  log("");
  log(`${colors.bold}${colors.cyan}Codex Hook${colors.reset}`);
  if (isNotifyHookConfigured(getCodexConfigPath())) {
    success("Notify hook installed");
    log(`   Config file: ${getCodexConfigPath()}`);
  } else {
    warn("Notify hook not installed");
    hasErrors = true;
  }

  log("");
  log(`${colors.bold}${colors.cyan}Sessions${colors.reset}`);
  if (existsSync(getCodexSessionsDir())) {
    const files = findSessionFiles(5);
    success(`Found ${files.length} recent session file(s)`);
    log(`   Directory: ${getCodexSessionsDir()}`);
  } else {
    warn("No Codex sessions directory found yet");
    log(`   Expected: ${getCodexSessionsDir()}`);
  }

  if (hasErrors) {
    process.exitCode = 1;
  }
}

function cmdStatus(): void {
  const config = loadConfig();
  log(`${colors.bold}codex-ttrack${colors.reset}`);
  log(`  Configured: ${isConfigured(config) ? "yes" : "no"}`);
  log(`  Auto-sync: ${config.autoSync ? "yes" : "no"}`);
  log(`  Debug: ${config.debug ? "yes" : "no"}`);
  log(`  Influx URL: ${config.influxdb.url}`);
  log(`  Token: ${maskSecret(config.influxdb.token)}`);
  log(`  Codex config: ${getCodexConfigPath()}`);
  log(
    `  Hook configured: ${isNotifyHookConfigured(getCodexConfigPath()) ? "yes" : "no"}`
  );
  log(`  Sessions dir: ${getCodexSessionsDir()}`);
}

function getSyncLimit(args: string[]): number {
  if (args.includes("--all")) {
    return Number.POSITIVE_INFINITY;
  }

  const limitIndex = args.indexOf("--limit");
  if (limitIndex < 0) {
    return 10;
  }

  const rawLimit = args[limitIndex + 1];
  const parsedLimit = Number(rawLimit);
  return Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10;
}

async function syncSessionFile(
  sessionFile: string,
  config: CodexTTrackConfig
): Promise<{ failed: number; skipped: number; synced: number }> {
  const session = parseSessionFile(sessionFile);
  if (!session) {
    return { failed: 1, skipped: 0, synced: 0 };
  }

  let synced = 0;
  let skipped = 0;
  let failed = 0;

  for (const turn of session.turns) {
    if (hasSyncedTurn(turn.id)) {
      skipped += 1;
      continue;
    }

    const result = await trackTurn(config, session, turn);
    if (result.success) {
      markTurnSynced(turn.id);
      synced += 1;
      continue;
    }

    failed += 1;
    if (config.debug) {
      warn(`Failed syncing ${turn.id}: ${result.error}`);
    }
  }

  return { failed, skipped, synced };
}

async function cmdSync(args: string[]): Promise<void> {
  const config = loadConfig();
  if (!isConfigured(config)) {
    failure('Not configured. Run "codex-ttrack configure" first.');
    process.exitCode = 1;
    return;
  }

  const limit = getSyncLimit(args);
  const sessionFiles = Number.isFinite(limit)
    ? findSessionFiles(limit)
    : findSessionFiles();
  if (sessionFiles.length === 0) {
    info("No session files found to sync");
    return;
  }

  let synced = 0;
  let skipped = 0;
  let failed = 0;

  for (const sessionFile of sessionFiles) {
    const result = await syncSessionFile(sessionFile, config);
    synced += result.synced;
    skipped += result.skipped;
    failed += result.failed;
  }

  success(`Synced ${synced} turn(s)`);
  info(`Skipped ${skipped} already-synced turn(s)`);
  if (failed > 0) {
    warn(`Failed ${failed} turn(s)`);
    process.exitCode = 1;
  }
}

function printHelp(): void {
  log(
    `${colors.bold}codex-ttrack${colors.reset} - Track Codex CLI token usage to InfluxDB`
  );
  log("");
  log("Usage:");
  log("  codex-ttrack <command>");
  log("");
  log("Commands:");
  log("  configure           Save InfluxDB and plugin settings");
  log("  setup               Install Codex notify hook");
  log("  verify              Validate config, hook, and session access");
  log("  status              Show current plugin status");
  log("  sync [--limit N]    Sync recent unsynced turns");
  log("  sync --all          Sync all unsynced turns");
  log("  hook <event>        Internal hook entrypoint");
}

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);

  switch (command) {
    case "configure":
      await cmdConfigure();
      return;
    case "setup":
      await cmdSetup();
      return;
    case "verify":
      await cmdVerify();
      return;
    case "status":
      await cmdStatus();
      return;
    case "sync":
      await cmdSync(args);
      return;
    case "hook":
      await handleHook(args[0] ?? "", args[1]);
      return;
    case "--help":
    case "-h":
    case "help":
    case undefined:
      printHelp();
      return;
    default:
      failure(`Unknown command: ${command}`);
      printHelp();
      process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  failure(message);
  process.exitCode = 1;
});
