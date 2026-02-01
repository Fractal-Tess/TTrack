# -----------------------------------------------------------------------------
# This Dockerfile is optimized for Turborepo monorepos using Bun
# Uses turbo prune to only include necessary dependencies
# Based on the official Turborepo Docker example
# -----------------------------------------------------------------------------

FROM oven/bun:1.3.5 AS base

WORKDIR /app

# ---
FROM base AS prepare

RUN bun add -g turbo@^2

COPY . .

RUN turbo prune web --docker

# ---
FROM base AS builder

# Accept build arguments for environment variables
ARG INFLUXDB_URL
ARG INFLUXDB_TOKEN
ARG INFLUXDB_ORG
ARG INFLUXDB_BUCKET
ARG NEXT_PUBLIC_APP_URL

# Set environment variables for the build
ENV INFLUXDB_URL=$INFLUXDB_URL
ENV INFLUXDB_TOKEN=$INFLUXDB_TOKEN
ENV INFLUXDB_ORG=$INFLUXDB_ORG
ENV INFLUXDB_BUCKET=$INFLUXDB_BUCKET
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

# Debug: Verify environment variables are set
RUN echo "INFLUXDB_URL=$INFLUXDB_URL" && \
    echo "INFLUXDB_ORG=$INFLUXDB_ORG" && \
    echo "INFLUXDB_BUCKET=$INFLUXDB_BUCKET" && \
    echo "INFLUXDB_TOKEN is set: $(if [ -n "$INFLUXDB_TOKEN" ]; then echo 'yes'; else echo 'no'; fi)"

# Copy all pruned files at once, then install dependencies
# This avoids conflicts between bun's workspace symlinks and the COPY command
COPY --from=prepare /app/out/json/ .
COPY --from=prepare /app/out/full/ .
COPY --from=prepare /app/out/bun.lockb* ./

# Install all dependencies (this will use workspace linking)
RUN bun install --ignore-scripts

# Build the Next.js application
RUN bun run turbo build

# ---
FROM oven/bun:1.3.5-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production

# Copy the standalone build with explicit UID/GID matching K8s security context
COPY --from=builder --chown=1001:1001 /app/apps/web/.next/standalone ./
COPY --from=builder --chown=1001:1001 /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=1001:1001 /app/apps/web/public ./apps/web/public

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# ===========================================
# Server-side env vars - injected at runtime via K8s secrets/configmaps
# CMS_URL, CMS_API_KEY, REDIS_URL
# AUTHENTIK_URL, AUTHENTIK_CLIENT_ID, AUTHENTIK_CLIENT_SECRET
# ===========================================

# Create cache directory and set ownership of entire app directory for K8s UID 1001
RUN mkdir -p /app/apps/web/.next/cache && \
    chown -R 1001:1001 /app

# Switch to UID 1001 (matches K8s runAsUser)
USER 1001

CMD ["bun", "apps/web/server.js"]
