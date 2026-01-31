import { appendFile, mkdir, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import type { Plugin } from "@opencode-ai/plugin";
import { err, ok, type Result } from "neverthrow";
import { TokenTracker } from "./client.js";

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

const DEFAULT_CONFIG: TTrackConfig = {
  influxdb: {
    url: "http://localhost:8086",
    token: "my-super-secret-auth-token",
    org: "ttrack-org",
    bucket: "token-usage",
  },
};

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
    // Return default config if file doesn't exist or is invalid
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
    // Silently ignore logging failures
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

  const inputTokens = Number(tokens.input) || 0;
  const outputTokens = Number(tokens.output) || 0;
  const reasoningTokens = Number(tokens.reasoning) || 0;
  const cacheReadTokens = Number(tokens.cache?.read) || 0;
  const cacheWriteTokens = Number(tokens.cache?.write) || 0;

  tracker
    .track({
      projectName,
      agentName,
      model,
      inputTokens,
      outputTokens,
      reasoningTokens,
      cacheReadTokens,
      cacheWriteTokens,
    })
    .then((result: { isErr: () => boolean; error?: Error }) => {
      if (result.isErr()) {
        writeToLogFile("[TokenTracker] Track error:", result.error);
      }
    });
}

function getProjectName(path: string): string {
  return path.split("/").at(-1) ?? "unknown";
}

export const tokenTrackerPlugin: Plugin = async ({ project, client }) => {
  const projectName = getProjectName(project.worktree);

  // Load config from ~/.config/opencode/ttrack.json
  const config = await loadConfig();

  const tracker = new TokenTracker(config.influxdb);

  // Track if we've shown the connection error toast
  let hasShownConnectionError = false;

  // Test connection on startup
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
    })
    .then(async (result) => {
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
      // Wait for session.created to show toast (TUI is ready then)
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
            // Silently ignore toast failures
          });
        // Reset so we don't show it again
        hasShownConnectionError = false;
      }

      if (
        event.type === "message.updated" &&
        event.properties.info?.role === "assistant"
      ) {
        const info = event.properties.info as MessageInfo;

        processMessage(tracker, info, projectName);
      }
    },
  };
};
