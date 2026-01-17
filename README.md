# TTrack

OpenCode plugin for tracking AI token usage across projects.

## Plugin

The TTrack plugin automatically monitors token consumption from AI assistant interactions in OpenCode. It captures input, output, reasoning, and cache tokens for each message and sends them to the tracking API.

## Monorepo

This monorepo contains the plugin, tracking client library, web dashboard, and shared UI components.

```
TTrack/
├── .opencode/
│   └── plugin/          # OpenCode token tracking plugin
├── packages/
│   ├── tracker/         # Token tracking client library
│   ├── ui/              # Shared UI component library
│   └── typescript-config/  # Shared TypeScript configurations
└── apps/
    └── web/             # Next.js dashboard for metrics visualization
```

## Components

- **Plugin**: OpenCode integration that captures token usage from assistant messages
- **Tracker**: Client library for sending token data to the tracking API
- **Web Dashboard**: Metrics visualization and analytics interface
- **UI Package**: Shared React components built with shadcn/ui patterns
