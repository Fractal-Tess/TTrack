import { TokenTracker, type TrackData } from "@workspace/tracker";
import { getProjectNameFromCwd } from "./parser.js";
import type { CodexTTrackConfig, ParsedSession, ParsedTurn } from "./types.js";

export async function trackTurn(
  config: CodexTTrackConfig,
  session: ParsedSession,
  turn: ParsedTurn
): Promise<{ success: boolean; error?: string }> {
  const tracker = new TokenTracker(config.influxdb);
  const trackData: TrackData = {
    projectName: getProjectNameFromCwd(session.cwd),
    agentName: session.agentName,
    model: turn.model,
    inputTokens: turn.inputTokens,
    outputTokens: turn.outputTokens,
    reasoningTokens: turn.reasoningTokens,
    cacheReadTokens: turn.cacheReadTokens,
    cacheWriteTokens: turn.cacheWriteTokens,
    additions: turn.additions,
    deletions: turn.deletions,
    filesChanged: turn.filesChanged,
  };

  const result = await tracker.track(trackData);
  if (result.isErr()) {
    return { success: false, error: result.error.message };
  }

  return { success: true };
}
