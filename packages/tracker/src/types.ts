export type TrackData = {
  projectName: string;
  agentName: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  additions: number;
  deletions: number;
  filesChanged: number;
};
