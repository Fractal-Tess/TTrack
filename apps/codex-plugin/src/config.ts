import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import type { CodexTTrackConfig, CodexTTrackState } from "./types.js";

const CONFIG_DIR = path.join(homedir(), ".config", "codex-ttrack");
const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");
const STATE_PATH = path.join(CONFIG_DIR, "state.json");
const MAX_SYNCED_TURNS = 5000;

const DEFAULT_CONFIG: CodexTTrackConfig = {
  influxdb: {
    url: "http://localhost:8086",
    token: "my-super-secret-auth-token",
    org: "ttrack-org",
    bucket: "token-usage",
  },
  autoSync: true,
  debug: false,
};

const DEFAULT_STATE: CodexTTrackState = {
  syncedTurnIds: [],
};

function ensureConfigDir(): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
}

function readJsonFile<T>(filePath: string): T | null {
  if (!existsSync(filePath)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(filePath, "utf-8")) as T;
  } catch {
    return null;
  }
}

export function getConfigPath(): string {
  return CONFIG_PATH;
}

export function getStatePath(): string {
  return STATE_PATH;
}

export function loadConfig(): CodexTTrackConfig {
  const parsed = readJsonFile<Partial<CodexTTrackConfig>>(CONFIG_PATH);
  return {
    influxdb: {
      url: parsed?.influxdb?.url ?? DEFAULT_CONFIG.influxdb.url,
      token: parsed?.influxdb?.token ?? DEFAULT_CONFIG.influxdb.token,
      org: parsed?.influxdb?.org ?? DEFAULT_CONFIG.influxdb.org,
      bucket: parsed?.influxdb?.bucket ?? DEFAULT_CONFIG.influxdb.bucket,
    },
    autoSync: parsed?.autoSync ?? DEFAULT_CONFIG.autoSync,
    debug: parsed?.debug ?? DEFAULT_CONFIG.debug,
  };
}

export function saveConfig(config: CodexTTrackConfig): void {
  ensureConfigDir();
  writeFileSync(CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`);
}

export function isConfigured(
  config: CodexTTrackConfig = loadConfig()
): boolean {
  return (
    Boolean(config.influxdb.url) &&
    Boolean(config.influxdb.token) &&
    Boolean(config.influxdb.org) &&
    Boolean(config.influxdb.bucket)
  );
}

export function loadState(): CodexTTrackState {
  const parsed = readJsonFile<CodexTTrackState>(STATE_PATH);
  if (!parsed?.syncedTurnIds) {
    return DEFAULT_STATE;
  }

  return {
    syncedTurnIds: parsed.syncedTurnIds.slice(-MAX_SYNCED_TURNS),
  };
}

export function saveState(state: CodexTTrackState): void {
  ensureConfigDir();
  const nextState: CodexTTrackState = {
    syncedTurnIds: state.syncedTurnIds.slice(-MAX_SYNCED_TURNS),
  };
  writeFileSync(STATE_PATH, `${JSON.stringify(nextState, null, 2)}\n`);
}

export function markTurnSynced(turnId: string): void {
  const state = loadState();
  if (state.syncedTurnIds.includes(turnId)) {
    return;
  }
  state.syncedTurnIds.push(turnId);
  saveState(state);
}

export function hasSyncedTurn(turnId: string): boolean {
  return loadState().syncedTurnIds.includes(turnId);
}

export function maskSecret(value: string): string {
  if (value.length <= 8) {
    return "********";
  }

  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

export function getCodexHome(): string {
  return process.env.CODEX_HOME || path.join(homedir(), ".codex");
}

export function getCodexConfigPath(): string {
  return path.join(getCodexHome(), "config.toml");
}

export function getCodexSessionsDir(): string {
  return path.join(getCodexHome(), "sessions");
}
