import { hasSyncedTurn, loadConfig, markTurnSynced } from "./config.js";
import {
  extractSessionIdFromHookPayload,
  findSessionById,
  getMostRecentSession,
  parseSessionFile,
} from "./parser.js";
import { trackTurn } from "./tracker.js";
import type { NotifyHookPayload } from "./types.js";

function debugLog(enabled: boolean, message: string): void {
  if (enabled) {
    console.error(message);
  }
}

function parseHookPayload(
  jsonPayload: string | undefined,
  debug: boolean
): NotifyHookPayload | undefined {
  if (!jsonPayload) {
    return undefined;
  }

  try {
    return JSON.parse(jsonPayload) as NotifyHookPayload;
  } catch {
    debugLog(debug, "[codex-ttrack] Failed to parse notify payload");
    return undefined;
  }
}

function resolveSessionFile(payload?: NotifyHookPayload): string | null {
  const sessionId = extractSessionIdFromHookPayload(payload);
  if (sessionId) {
    return findSessionById(sessionId) ?? getMostRecentSession();
  }

  return getMostRecentSession();
}

export async function handleHook(
  event: string,
  jsonPayload?: string
): Promise<void> {
  const config = loadConfig();

  if (!config.autoSync) {
    debugLog(config.debug, "[codex-ttrack] Auto-sync disabled");
    return;
  }

  if (event !== "agent-turn-complete") {
    debugLog(config.debug, `[codex-ttrack] Ignoring event ${event}`);
    return;
  }

  const payload = parseHookPayload(jsonPayload, config.debug);
  const sessionFile = resolveSessionFile(payload);
  if (!sessionFile) {
    debugLog(config.debug, "[codex-ttrack] No Codex session file found");
    return;
  }

  const session = parseSessionFile(sessionFile);
  if (!session) {
    debugLog(config.debug, "[codex-ttrack] No completed turns found to sync");
    return;
  }
  const latestTurn = session.turns.at(-1);
  if (!latestTurn) {
    debugLog(config.debug, "[codex-ttrack] No completed turns found to sync");
    return;
  }

  if (hasSyncedTurn(latestTurn.id)) {
    debugLog(
      config.debug,
      `[codex-ttrack] Turn ${latestTurn.id} already synced`
    );
    return;
  }

  const result = await trackTurn(config, session, latestTurn);
  if (!result.success) {
    debugLog(
      config.debug,
      `[codex-ttrack] Failed syncing turn ${latestTurn.id}: ${result.error}`
    );
    return;
  }

  markTurnSynced(latestTurn.id);
  debugLog(config.debug, `[codex-ttrack] Synced turn ${latestTurn.id}`);
}
