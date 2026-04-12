export type CodexTTrackConfig = {
  influxdb: {
    url: string;
    token: string;
    org: string;
    bucket: string;
  };
  autoSync: boolean;
  debug: boolean;
};

export type CodexTTrackState = {
  syncedTurnIds: string[];
};

export type ParsedToolChange = {
  file: string;
  additions: number;
  deletions: number;
};

export type ParsedTurn = {
  id: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  additions: number;
  deletions: number;
  filesChanged: number;
  completedAt?: number;
};

export type ParsedSession = {
  id: string;
  cwd: string;
  modelProvider: string;
  agentName: string;
  turns: ParsedTurn[];
};

export type SessionMetaPayload = {
  id: string;
  cwd: string;
  model_provider?: string;
  agent_nickname?: string;
  agent_role?: string;
};

export type TokenUsage = {
  input_tokens: number;
  cached_input_tokens: number;
  output_tokens: number;
  reasoning_output_tokens?: number;
  total_tokens: number;
};

export type TokenCountPayload = {
  type: "token_count";
  info?: {
    total_token_usage?: TokenUsage | null;
    last_token_usage?: TokenUsage | null;
  } | null;
};

export type TaskStartedPayload = {
  type: "task_started";
  turn_id: string;
};

export type TaskCompletePayload = {
  type: "task_complete";
  turn_id: string;
};

export type ExecCommandEndPayload = {
  type: "exec_command_end";
  parsed_cmd?: Array<{
    type?: string;
    path?: string | null;
    cmd?: string;
    name?: string;
  }>;
};

export type EventPayload =
  | TokenCountPayload
  | TaskStartedPayload
  | TaskCompletePayload
  | ExecCommandEndPayload
  | { type?: string; [key: string]: unknown };

export type RolloutItem =
  | {
      type: "session_meta";
      timestamp?: string;
      payload: SessionMetaPayload;
    }
  | {
      type: "turn_context";
      timestamp?: string;
      payload: {
        turn_id?: string;
        model?: string;
        cwd?: string;
        [key: string]: unknown;
      };
    }
  | {
      type: "event_msg";
      timestamp?: string;
      payload: EventPayload;
    }
  | {
      type: "response_item";
      timestamp?: string;
      payload: {
        type?: string;
        name?: string;
        input?: string;
        arguments?: string;
        call_id?: string;
        [key: string]: unknown;
      } | null;
    };

export type NotifyHookPayload = {
  type?: string;
  "thread-id"?: string;
  "turn-id"?: string;
};
