import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const NOTIFY_HOOK = ["codex-ttrack", "hook", "agent-turn-complete"];
const ARRAY_START_REGEX = /^\[/;
const ARRAY_END_REGEX = /\]$/;
const QUOTED_VALUE_START_REGEX = /^["']/;
const QUOTED_VALUE_END_REGEX = /["']$/;
const NOTIFY_ARRAY_REGEX = /^notify\s*=\s*(\[.*\])$/m;
const NOTIFY_LINE_REGEX = /^notify\s*=\s*\[.*\]$/m;

function parseArray(raw: string): string[] {
  const inner = raw
    .trim()
    .replace(ARRAY_START_REGEX, "")
    .replace(ARRAY_END_REGEX, "");
  if (!inner.trim()) {
    return [];
  }

  return inner
    .split(",")
    .map((entry) =>
      entry
        .trim()
        .replace(QUOTED_VALUE_START_REGEX, "")
        .replace(QUOTED_VALUE_END_REGEX, "")
    )
    .filter(Boolean);
}

function stringifyArray(values: string[]): string {
  return `[${values.map((value) => JSON.stringify(value)).join(", ")}]`;
}

export function addNotifyHook(configPath: string): {
  success: boolean;
  error?: string;
} {
  try {
    let content = existsSync(configPath)
      ? readFileSync(configPath, "utf-8")
      : "";
    const notifyLine = `notify = ${stringifyArray(NOTIFY_HOOK)}`;
    const notifyMatch = content.match(NOTIFY_ARRAY_REGEX);

    if (notifyMatch?.[1]) {
      const current = parseArray(notifyMatch[1]);
      if (JSON.stringify(current) === JSON.stringify(NOTIFY_HOOK)) {
        return { success: true };
      }
      content = content.replace(NOTIFY_LINE_REGEX, notifyLine);
    } else {
      content =
        content.trim().length > 0
          ? `${notifyLine}\n\n${content}`
          : `${notifyLine}\n`;
    }

    mkdirSync(path.dirname(configPath), { recursive: true });
    writeFileSync(configPath, content);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export function isNotifyHookConfigured(configPath: string): boolean {
  if (!existsSync(configPath)) {
    return false;
  }

  try {
    const content = readFileSync(configPath, "utf-8");
    const notifyMatch = content.match(NOTIFY_ARRAY_REGEX);
    if (!notifyMatch?.[1]) {
      return false;
    }
    return (
      JSON.stringify(parseArray(notifyMatch[1])) === JSON.stringify(NOTIFY_HOOK)
    );
  } catch {
    return false;
  }
}
