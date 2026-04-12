import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { getCodexSessionsDir } from "./config.js";
import type {
  NotifyHookPayload,
  ParsedSession,
  ParsedToolChange,
  ParsedTurn,
  RolloutItem,
  SessionMetaPayload,
  TaskCompletePayload,
  TaskStartedPayload,
  TokenUsage,
} from "./types.js";

type WorkingTurn = {
  id: string;
  model: string;
  tokenUsage?: TokenUsage;
  fileChanges: Map<string, ParsedToolChange>;
  completedAt?: number;
};

type ParseSessionState = {
  activeTurnId: string | null;
  completedTurns: ParsedTurn[];
  currentModel: string;
  turns: Map<string, WorkingTurn>;
};

function toTimestamp(value?: string): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function basenameProjectName(cwd: string): string {
  return path.basename(cwd) || cwd;
}

function ensureTurn(
  turns: Map<string, WorkingTurn>,
  turnId: string,
  model: string
): WorkingTurn {
  const existing = turns.get(turnId);
  if (existing) {
    if (model) {
      existing.model = model;
    }
    return existing;
  }

  const created: WorkingTurn = {
    id: turnId,
    model,
    fileChanges: new Map<string, ParsedToolChange>(),
  };
  turns.set(turnId, created);
  return created;
}

function mergeToolChange(
  target: Map<string, ParsedToolChange>,
  change: ParsedToolChange
): void {
  const existing = target.get(change.file);
  if (existing) {
    existing.additions += change.additions;
    existing.deletions += change.deletions;
    return;
  }

  target.set(change.file, { ...change });
}

function parseApplyPatchInput(input: string): ParsedToolChange[] {
  const changes = new Map<string, ParsedToolChange>();
  let currentFile: string | null = null;

  for (const line of input.split("\n")) {
    if (line.startsWith("*** Update File: ")) {
      currentFile = line.slice("*** Update File: ".length).trim();
      mergeToolChange(changes, {
        file: currentFile,
        additions: 0,
        deletions: 0,
      });
      continue;
    }

    if (line.startsWith("*** Add File: ")) {
      currentFile = line.slice("*** Add File: ".length).trim();
      mergeToolChange(changes, {
        file: currentFile,
        additions: 0,
        deletions: 0,
      });
      continue;
    }

    if (line.startsWith("*** Delete File: ")) {
      currentFile = line.slice("*** Delete File: ".length).trim();
      mergeToolChange(changes, {
        file: currentFile,
        additions: 0,
        deletions: 0,
      });
      continue;
    }

    if (!currentFile || line.startsWith("*** ")) {
      continue;
    }

    const current = changes.get(currentFile);
    if (!current) {
      continue;
    }

    if (line.startsWith("+")) {
      current.additions += 1;
      continue;
    }

    if (line.startsWith("-")) {
      current.deletions += 1;
    }
  }

  return Array.from(changes.values());
}

function isTaskStartedPayload(payload: unknown): payload is TaskStartedPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "type" in payload &&
    payload.type === "task_started" &&
    "turn_id" in payload &&
    typeof payload.turn_id === "string"
  );
}

function isTaskCompletePayload(
  payload: unknown
): payload is TaskCompletePayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "type" in payload &&
    payload.type === "task_complete" &&
    "turn_id" in payload &&
    typeof payload.turn_id === "string"
  );
}

function extractLastTokenUsage(payload: unknown): TokenUsage | undefined {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("type" in payload) ||
    payload.type !== "token_count"
  ) {
    return undefined;
  }

  const info = "info" in payload ? payload.info : undefined;
  if (
    typeof info !== "object" ||
    info === null ||
    !("last_token_usage" in info)
  ) {
    return undefined;
  }

  const usage = info.last_token_usage;
  if (typeof usage !== "object" || usage === null) {
    return undefined;
  }

  return usage as TokenUsage;
}

function getPatchInput(item: RolloutItem): string | null {
  if (item.type !== "response_item" || !item.payload) {
    return null;
  }

  const { payload } = item;
  if (payload.type === "custom_tool_call" && payload.name === "apply_patch") {
    return typeof payload.input === "string" ? payload.input : null;
  }

  if (payload.type === "function_call" && payload.name === "apply_patch") {
    if (typeof payload.arguments !== "string") {
      return null;
    }

    if (payload.arguments.startsWith("*** Begin Patch")) {
      return payload.arguments;
    }

    try {
      const parsed = JSON.parse(payload.arguments) as { input?: string };
      return typeof parsed.input === "string" ? parsed.input : null;
    } catch {
      return null;
    }
  }

  return null;
}

function finalizeTurn(turn: WorkingTurn): ParsedTurn {
  const fileChanges = Array.from(turn.fileChanges.values());
  return {
    id: turn.id,
    model: turn.model,
    inputTokens: turn.tokenUsage?.input_tokens ?? 0,
    outputTokens: turn.tokenUsage?.output_tokens ?? 0,
    reasoningTokens: turn.tokenUsage?.reasoning_output_tokens ?? 0,
    cacheReadTokens: turn.tokenUsage?.cached_input_tokens ?? 0,
    cacheWriteTokens: 0,
    additions: fileChanges.reduce((sum, change) => sum + change.additions, 0),
    deletions: fileChanges.reduce((sum, change) => sum + change.deletions, 0),
    filesChanged: fileChanges.length,
    completedAt: turn.completedAt,
  };
}

function parseJsonLines(filePath: string): RolloutItem[] {
  const lines = readFileSync(filePath, "utf-8")
    .split("\n")
    .filter((line) => line.trim().length > 0);

  const items: RolloutItem[] = [];
  for (const line of lines) {
    try {
      items.push(JSON.parse(line) as RolloutItem);
    } catch {
      // Ignore invalid JSONL rows and continue parsing the session.
    }
  }

  return items;
}

function getSessionMeta(
  items: RolloutItem[]
): { type: "session_meta"; payload: SessionMetaPayload } | undefined {
  return items.find(
    (item): item is { type: "session_meta"; payload: SessionMetaPayload } =>
      item.type === "session_meta"
  );
}

function createParseState(): ParseSessionState {
  return {
    activeTurnId: null,
    completedTurns: [],
    currentModel: "gpt-5-codex",
    turns: new Map<string, WorkingTurn>(),
  };
}

function handleTurnContext(
  item: Extract<RolloutItem, { type: "turn_context" }>,
  state: ParseSessionState
): void {
  if (item.payload.model) {
    state.currentModel = item.payload.model;
  }

  if (item.payload.turn_id) {
    state.activeTurnId = item.payload.turn_id;
    ensureTurn(state.turns, state.activeTurnId, state.currentModel);
  }
}

function addPatchChangesToActiveTurn(
  item: Extract<RolloutItem, { type: "response_item" }>,
  state: ParseSessionState
): void {
  const patchInput = getPatchInput(item);
  if (!(patchInput && state.activeTurnId)) {
    return;
  }

  const turn = ensureTurn(state.turns, state.activeTurnId, state.currentModel);
  for (const change of parseApplyPatchInput(patchInput)) {
    mergeToolChange(turn.fileChanges, change);
  }
}

function startTurn(turnId: string, state: ParseSessionState): void {
  state.activeTurnId = turnId;
  ensureTurn(state.turns, turnId, state.currentModel);
}

function updateTurnTokens(payload: unknown, state: ParseSessionState): void {
  if (!state.activeTurnId) {
    return;
  }

  const usage = extractLastTokenUsage(payload);
  if (!usage) {
    return;
  }

  const turn = ensureTurn(state.turns, state.activeTurnId, state.currentModel);
  turn.tokenUsage = usage;
}

function completeTurn(
  payload: TaskCompletePayload,
  timestamp: string | undefined,
  state: ParseSessionState
): void {
  const turn = state.turns.get(payload.turn_id);
  if (!turn) {
    return;
  }

  turn.completedAt = toTimestamp(timestamp);
  state.completedTurns.push(finalizeTurn(turn));
  state.turns.delete(payload.turn_id);

  if (state.activeTurnId === payload.turn_id) {
    state.activeTurnId = null;
  }
}

function handleEventMessage(
  item: Extract<RolloutItem, { type: "event_msg" }>,
  state: ParseSessionState
): void {
  if (!item.payload?.type) {
    return;
  }

  if (isTaskStartedPayload(item.payload)) {
    startTurn(item.payload.turn_id, state);
    return;
  }

  if (item.payload.type === "token_count") {
    updateTurnTokens(item.payload, state);
    return;
  }

  if (isTaskCompletePayload(item.payload)) {
    completeTurn(item.payload, item.timestamp, state);
  }
}

function processRolloutItem(item: RolloutItem, state: ParseSessionState): void {
  switch (item.type) {
    case "turn_context":
      handleTurnContext(item, state);
      return;
    case "response_item":
      addPatchChangesToActiveTurn(item, state);
      return;
    case "event_msg":
      handleEventMessage(item, state);
      return;
    default:
      return;
  }
}

function finalizePendingTurn(state: ParseSessionState): void {
  if (!state.activeTurnId) {
    return;
  }

  const pendingTurn = state.turns.get(state.activeTurnId);
  if (pendingTurn?.tokenUsage) {
    state.completedTurns.push(finalizeTurn(pendingTurn));
  }
}

export function parseSessionFile(filePath: string): ParsedSession | null {
  if (!existsSync(filePath)) {
    return null;
  }

  const items = parseJsonLines(filePath);
  if (items.length === 0) {
    return null;
  }
  const sessionMeta = getSessionMeta(items);

  if (!sessionMeta) {
    return null;
  }

  const state = createParseState();
  for (const item of items) {
    processRolloutItem(item, state);
  }

  if (state.completedTurns.length === 0) {
    finalizePendingTurn(state);
  }

  return {
    id: sessionMeta.payload.id,
    cwd: sessionMeta.payload.cwd,
    modelProvider: sessionMeta.payload.model_provider ?? "openai",
    agentName:
      sessionMeta.payload.agent_nickname ??
      sessionMeta.payload.agent_role ??
      "codex",
    turns: state.completedTurns,
  };
}

function walkSessionsDir(
  rootDir: string,
  files: Array<{ path: string; mtimeMs: number }>
): void {
  for (const entry of readdirSync(rootDir, { withFileTypes: true })) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      walkSessionsDir(fullPath, files);
      continue;
    }
    if (
      entry.isFile() &&
      entry.name.startsWith("rollout-") &&
      entry.name.endsWith(".jsonl")
    ) {
      files.push({ path: fullPath, mtimeMs: statSync(fullPath).mtimeMs });
    }
  }
}

export function findSessionFiles(limit?: number): string[] {
  const sessionsDir = getCodexSessionsDir();
  if (!existsSync(sessionsDir)) {
    return [];
  }

  const files: Array<{ path: string; mtimeMs: number }> = [];
  walkSessionsDir(sessionsDir, files);
  files.sort((left, right) => right.mtimeMs - left.mtimeMs);
  return files.slice(0, limit ?? files.length).map((file) => file.path);
}

export function getMostRecentSession(): string | null {
  return findSessionFiles(1)[0] ?? null;
}

export function findSessionById(sessionId: string): string | null {
  for (const filePath of findSessionFiles()) {
    if (path.basename(filePath).includes(sessionId)) {
      return filePath;
    }
    const parsed = parseSessionFile(filePath);
    if (parsed?.id === sessionId) {
      return filePath;
    }
  }
  return null;
}

export function extractSessionIdFromHookPayload(
  payload?: NotifyHookPayload
): string | null {
  const sessionId = payload?.["thread-id"];
  return typeof sessionId === "string" ? sessionId : null;
}

export function getProjectNameFromCwd(cwd: string): string {
  return basenameProjectName(cwd);
}
