import { appendFile, mkdir, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import type { Plugin } from "@opencode-ai/plugin";
import { TokenTracker, type TrackData } from "@workspace/tracker";
import type { Result as NeverthrowResult } from "neverthrow";
import { err, ok, type Result } from "neverthrow";

type TTrackConfig = {
  influxdb: {
    url: string;
    token: string;
    org: string;
    bucket: string;
  };
};

type MessageTokens = {
  input?: number;
  output?: number;
  reasoning?: number;
  cache?: {
    read?: number;
    write?: number;
  };
};

type MessageInfo = {
  role?: string;
  agent?: string;
  providerID?: string;
  modelID?: string;
  tokens?: MessageTokens;
  path?: {
    cwd?: string;
  };
};

type ToolStateCompleted = {
  status: "completed";
  input: Record<string, unknown>;
  output: string;
  title: string;
  metadata: Record<string, unknown>;
  time: { start: number; end: number };
};

type ToolPart = {
  id: string;
  sessionID: string;
  messageID: string;
  type: "tool";
  callID: string;
  tool: string;
  state: { status: string } & Partial<ToolStateCompleted>;
};

type MessagePartUpdatedEvent = {
  type: "message.part.updated";
  properties: {
    part: ToolPart | { type: string };
  };
};

type FileDiff = {
  file: string;
  before: string;
  after: string;
  additions: number;
  deletions: number;
};

type FileChangeInfo = {
  additions: number;
  deletions: number;
  isWrite: boolean;
};

const DEFAULT_CONFIG: TTrackConfig = {
  influxdb: {
    url: "http://localhost:8086",
    token: "my-super-secret-auth-token",
    org: "ttrack-org",
    bucket: "token-usage",
  },
};

const processedCallIds = new Set<string>();
const fileChanges = new Map<string, FileChangeInfo>();

async function loadConfig(): Promise<TTrackConfig> {
  try {
    const configPath = join(homedir(), ".config", "opencode", "ttrack.json");
    const configData = await readFile(configPath, "utf-8");
    const parsed = JSON.parse(configData) as Partial<TTrackConfig>;

    return {
      influxdb: {
        url: parsed.influxdb?.url ?? DEFAULT_CONFIG.influxdb.url,
        token: parsed.influxdb?.token ?? DEFAULT_CONFIG.influxdb.token,
        org: parsed.influxdb?.org ?? DEFAULT_CONFIG.influxdb.org,
        bucket: parsed.influxdb?.bucket ?? DEFAULT_CONFIG.influxdb.bucket,
      },
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

function getLogFilePath(): string {
  try {
    const cwd = process.cwd();
    const opencodeDir = join(cwd, ".opencode");
    return join(opencodeDir, "TTrack", "error.log");
  } catch {
    return join(".opencode", "TTrack", "error.log");
  }
}

async function writeToLogFile(message: string, error?: unknown): Promise<void> {
  try {
    const logFile = getLogFilePath();
    await mkdir(dirname(logFile), { recursive: true });

    const timestamp = new Date().toISOString();
    const errorDetails = error
      ? ` - ${error instanceof Error ? error.stack : String(error)}`
      : "";
    const logEntry = `[${timestamp}] ${message}${errorDetails}\n`;
    await appendFile(logFile, logEntry);
  } catch {
    return;
  }
}

function getModelName(
  providerID?: string,
  modelID?: string
): Result<string, Error> {
  try {
    const provider = providerID || "unknown";
    const model = modelID || "unknown";
    return ok(`${provider}/${model}`);
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    writeToLogFile("[TokenTracker] Error constructing model name:", errorObj);
    return err(errorObj);
  }
}

function isMessagePartUpdatedEvent(event: {
  type: string;
}): event is MessagePartUpdatedEvent {
  return event.type === "message.part.updated";
}

function handleEditTool(
  metadata: Record<string, unknown>,
  changes: Array<{ file: string; info: Partial<FileChangeInfo> }>
): void {
  const filediff = metadata.filediff as FileDiff | undefined;
  if (filediff?.file) {
    changes.push({
      file: filediff.file,
      info: {
        additions: filediff.additions ?? 0,
        deletions: filediff.deletions ?? 0,
        isWrite: false,
      },
    });
  } else {
    const filePath = metadata.filePath as string | undefined;
    if (filePath) {
      changes.push({
        file: filePath,
        info: { additions: 0, deletions: 0, isWrite: false },
      });
    }
  }
}

function handleWriteTool(
  metadata: Record<string, unknown>,
  changes: Array<{ file: string; info: Partial<FileChangeInfo> }>
): void {
  const filepath = metadata.filepath as string | undefined;
  const exists = metadata.exists as boolean | undefined;
  if (filepath) {
    changes.push({
      file: filepath,
      info: {
        additions: 0,
        deletions: 0,
        isWrite: !exists,
      },
    });
  }
}

function handlePatchTool(
  metadata: Record<string, unknown>,
  output: string,
  changes: Array<{ file: string; info: Partial<FileChangeInfo> }>
): void {
  const diff = metadata.diff as number | undefined;
  const lines = output.split("\n");
  const files: string[] = [];

  for (const line of lines) {
    if (line.startsWith("  ") && !line.startsWith("   ")) {
      const file = line.trim();
      if (file && !file.includes(" ")) {
        files.push(file);
      }
    }
  }

  const perFileDiff =
    files.length > 0 ? Math.round((diff ?? 0) / files.length) : 0;
  for (const file of files) {
    changes.push({
      file,
      info: {
        additions: perFileDiff > 0 ? perFileDiff : 0,
        deletions: perFileDiff < 0 ? Math.abs(perFileDiff) : 0,
        isWrite: false,
      },
    });
  }
}

function handleMultieditTool(
  metadata: Record<string, unknown>,
  changes: Array<{ file: string; info: Partial<FileChangeInfo> }>
): void {
  const results = metadata.results as
    | Array<{ filediff?: FileDiff }>
    | undefined;
  if (results) {
    for (const result of results) {
      if (result.filediff?.file) {
        changes.push({
          file: result.filediff.file,
          info: {
            additions: result.filediff.additions ?? 0,
            deletions: result.filediff.deletions ?? 0,
            isWrite: false,
          },
        });
      }
    }
  }
}

function handleReadTool(
  title: string | undefined,
  changes: Array<{ file: string; info: Partial<FileChangeInfo> }>
): void {
  if (title) {
    changes.push({
      file: title,
      info: { additions: 0, deletions: 0, isWrite: false },
    });
  }
}

function extractFileChanges(
  tool: string,
  metadata: Record<string, unknown> | undefined,
  output: string,
  title?: string
): Array<{ file: string; info: Partial<FileChangeInfo> }> {
  const changes: Array<{ file: string; info: Partial<FileChangeInfo> }> = [];

  if (!metadata) {
    return changes;
  }

  switch (tool) {
    case "edit": {
      handleEditTool(metadata, changes);
      break;
    }
    case "write": {
      handleWriteTool(metadata, changes);
      break;
    }
    case "patch": {
      handlePatchTool(metadata, output, changes);
      break;
    }
    case "multiedit": {
      handleMultieditTool(metadata, changes);
      break;
    }
    case "read": {
      handleReadTool(title, changes);
      break;
    }
    default: {
      break;
    }
  }

  return changes;
}

function getFileChangeSummary(): {
  additions: number;
  deletions: number;
  filesChanged: number;
} {
  let additions = 0;
  let deletions = 0;

  for (const info of fileChanges.values()) {
    additions += info.additions;
    deletions += info.deletions;
  }

  return {
    additions,
    deletions,
    filesChanged: fileChanges.size,
  };
}

function clearFileChanges(): void {
  fileChanges.clear();
}

function processMessage(
  tracker: TokenTracker,
  message: MessageInfo,
  projectName: string
): void {
  if (!message?.tokens || typeof message.tokens !== "object") {
    return;
  }

  const tokens = message.tokens;
  const modelResult = getModelName(message.providerID, message.modelID);

  const model = modelResult.isOk() ? modelResult.value : "unknown/unknown";
  const agentName = message.agent || "unknown";

  const inputTokens = Number(tokens.input ?? 0);
  const outputTokens = Number(tokens.output ?? 0);
  const reasoningTokens = Number(tokens.reasoning ?? 0);
  const cacheReadTokens = Number(tokens.cache?.read ?? 0);
  const cacheWriteTokens = Number(tokens.cache?.write ?? 0);

  const fileChangeSummary = getFileChangeSummary();

  const trackData: TrackData = {
    projectName,
    agentName,
    model,
    inputTokens,
    outputTokens,
    reasoningTokens,
    cacheReadTokens,
    cacheWriteTokens,
    additions: fileChangeSummary.additions,
    deletions: fileChangeSummary.deletions,
    filesChanged: fileChangeSummary.filesChanged,
  };

  tracker.track(trackData).then((result: NeverthrowResult<void, Error>) => {
    if (result.isErr()) {
      writeToLogFile("[TokenTracker] Track error:", result.error);
    }
  });

  clearFileChanges();
}

function getProjectName(path: string): string {
  return path.split("/").at(-1) ?? "unknown";
}

function processToolExecution(
  toolPart: ToolPart,
  processedCallIds: Set<string>,
  fileChanges: Map<string, FileChangeInfo>
): void {
  if (toolPart.state.status !== "completed") {
    return;
  }

  if (processedCallIds.has(toolPart.callID)) {
    return;
  }
  processedCallIds.add(toolPart.callID);

  if (processedCallIds.size > 1000) {
    const idsArray = Array.from(processedCallIds);
    for (let i = 0; i < 500; i++) {
      processedCallIds.delete(idsArray[i] ?? "");
    }
  }

  const { tool } = toolPart;
  const state = toolPart.state as ToolStateCompleted;
  const { metadata, title, output } = state;

  const changes = extractFileChanges(
    tool,
    metadata as Record<string, unknown>,
    output,
    title
  );

  for (const change of changes) {
    const existing = fileChanges.get(change.file) ?? {
      additions: 0,
      deletions: 0,
      isWrite: false,
    };

    fileChanges.set(change.file, {
      additions: existing.additions + (change.info.additions ?? 0),
      deletions: existing.deletions + (change.info.deletions ?? 0),
      isWrite: existing.isWrite || (change.info.isWrite ?? false),
    });
  }
}

export const tokenTrackerPlugin: Plugin = async ({ project, client }) => {
  const projectName = getProjectName(project.worktree);

  const config = await loadConfig();

  const tracker = new TokenTracker(config.influxdb);

  let hasShownConnectionError = false;

  tracker
    .track({
      projectName: "test",
      agentName: "test",
      model: "test",
      inputTokens: 0,
      outputTokens: 0,
      reasoningTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      additions: 0,
      deletions: 0,
      filesChanged: 0,
    })
    .then((result: NeverthrowResult<void, Error>) => {
      if (result.isErr()) {
        writeToLogFile(
          "[TokenTracker] InfluxDB connection failed on startup",
          result.error
        );
        writeToLogFile(
          "[TokenTracker] Please check your ~/.config/opencode/ttrack.json configuration"
        );
        hasShownConnectionError = true;
      }
    });

  return {
    event: async ({ event }) => {
      if (event.type === "session.created" && hasShownConnectionError) {
        await client.tui
          .showToast({
            body: {
              title: "TTrack: InfluxDB Connection Failed",
              message:
                "Token tracking is disabled. Please check your ~/.config/opencode/ttrack.json configuration.",
              variant: "warning" as const,
              duration: 10_000,
            },
          })
          .catch(() => {
            return;
          });
        hasShownConnectionError = false;
      }

      if (
        event.type === "message.updated" &&
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        event.properties.info?.role === "assistant"
      ) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const info = event.properties.info as MessageInfo;

        processMessage(tracker, info, projectName);
      }

      if (isMessagePartUpdatedEvent(event)) {
        const { part } = event.properties;

        if (part.type !== "tool") {
          return;
        }

        const toolPart = part as ToolPart;
        processToolExecution(toolPart, processedCallIds, fileChanges);
      }
    },
  };
};
