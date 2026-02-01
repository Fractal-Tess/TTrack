# Fix Token Display: Add Billable Tokens Metric

## TL;DR

> **Quick Summary**: The timeline chart shows "repetitive" token values because `total_tokens` includes cache tokens (~97% of total). Adding a new `billable_tokens` metric (input + output + reasoning) shows actual usage variation.
>
> **Deliverables**:
>
> - New `billable_tokens` field in tracker writes
> - Updated API to query and return billable_tokens
> - New "Billable" tab in timeline chart
>
> **Estimated Effort**: Quick
> **Parallel Execution**: NO - sequential (each task depends on previous)
> **Critical Path**: Task 1 → Task 2 → Task 3 → Task 4

---

## Context

### Original Request

User observed the 5-minute chart shows "repetitive" token values like 105k, 107k, 108k. Investigation revealed `cache_read_tokens` dominates (~97%) making totals nearly identical across consecutive requests.

### Interview Summary

**Key Discussions**:

- **Solution**: Add separate `billable_tokens` metric, keep `total_tokens` unchanged
- **Naming**: User confirmed `billable_tokens` as the name
- **Chart**: Add 4th tab alongside Total/Input/Output
- **Historical data**: Keep as-is (new metric will be undefined for old data)
- **Testing**: Manual verification only

**Research Findings**:

- `total_tokens` = input + output + reasoning + cache_read + cache_write
- cache_read dominates at ~100k while actual work is ~1-2k tokens
- Timeline chart already has 3 tabs with toggle functionality
- API returns timeline array that chart consumes directly

### Gap Analysis

**Identified Gaps** (addressed):

- Summary cards need updating to show billable totals - EXCLUDE (out of scope)
- Historical data backfill - EXCLUDE (user confirmed keep as-is)
- Tab ordering question - DEFAULT to 4th position (Billable after Output)

---

## Work Objectives

### Core Objective

Add `billable_tokens` metric that excludes cache tokens, providing meaningful usage variation in the timeline chart.

### Concrete Deliverables

- `packages/tracker/src/api.ts` - Add `billable_tokens` field calculation and write
- `apps/web/src/app/api/metrics/route.ts` - Query and return `billable_tokens`
- `apps/web/src/components/dashboard/timeline-chart.tsx` - Add "Billable" tab

### Definition of Done

- [ ] API response includes `billable_tokens` in timeline data
- [ ] Chart shows 4 tabs: Total, Input, Output, Billable
- [ ] Billable values show meaningful variation (not near-identical)

### Must Have

- `billable_tokens` = inputTokens + outputTokens + reasoningTokens
- New field written to InfluxDB
- New tab functional in chart

### Must NOT Have (Guardrails)

- DO NOT modify existing `total_tokens` calculation
- DO NOT backfill historical data
- DO NOT modify summary cards, pie charts, or agent/model/project breakdowns
- DO NOT add automated tests (user specified manual verification)
- DO NOT rename existing fields

---

## Verification Strategy (MANDATORY)

### Test Decision

- **Infrastructure exists**: YES (Vitest)
- **User wants tests**: NO (manual only)
- **QA approach**: Manual verification via API and browser

### Manual Verification Procedures

**API Verification** (using curl):

```bash
curl 'http://localhost:3000/api/metrics?range=5m' | jq '.timeline[0]'
# Assert: Response includes "billable_tokens" field
# Assert: billable_tokens value < total_tokens
```

**Browser Verification** (using Playwright skill):

```
1. Navigate to: http://localhost:3000 (or deployed URL)
2. Select 5m range from time picker
3. Verify 4 tabs visible: Total, Input, Output, Billable
4. Click "Billable" tab
5. Verify bar heights show meaningful variation
6. Screenshot: .sisyphus/evidence/billable-tab.png
```

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
└── Task 1: Add billable_tokens to tracker [no dependencies]

Wave 2 (After Wave 1):
└── Task 2: Update API to query billable_tokens [depends: 1]

Wave 3 (After Wave 2):
└── Task 3: Add Billable tab to chart [depends: 2]

Wave 4 (After Wave 3):
└── Task 4: Manual verification [depends: 3]

Critical Path: Task 1 → Task 2 → Task 3 → Task 4
Parallel Speedup: None (linear dependency chain)
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
| ---- | ---------- | ------ | -------------------- |
| 1    | None       | 2      | None                 |
| 2    | 1          | 3      | None                 |
| 3    | 2          | 4      | None                 |
| 4    | 3          | None   | None (final)         |

---

## TODOs

- [ ] 1. Add billable_tokens to tracker write

  **What to do**:
  - Open `packages/tracker/src/api.ts`
  - After line 28 (existing totalTokens calculation), add:
    ```typescript
    const billableTokens =
      data.inputTokens + data.outputTokens + data.reasoningTokens;
    ```
  - After line 42, add new field to Point:
    ```typescript
    .floatField("billable_tokens", billableTokens)
    ```

  **Must NOT do**:
  - DO NOT modify the totalTokens calculation
  - DO NOT rename existing fields
  - DO NOT change the Point measurement name

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single file, <10 lines change, straightforward addition
  - **Skills**: [`git-master`]
    - `git-master`: For atomic commit after change
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: Not UI work
    - `playwright`: No browser interaction needed

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (solo)
  - **Blocks**: Task 2
  - **Blocked By**: None (can start immediately)

  **References**:
  - `packages/tracker/src/api.ts:23-28` - Existing totalTokens calculation pattern to follow
  - `packages/tracker/src/api.ts:30-42` - Point construction with floatField calls
  - `packages/tracker/src/types.ts:1-13` - TrackData type (shows available input fields)

  **Acceptance Criteria**:

  **Automated Verification (using Bash)**:

  ```bash
  # Verify billable_tokens added to api.ts
  grep -n "billable_tokens" packages/tracker/src/api.ts
  # Assert: Output shows at least 2 matches (variable + floatField)

  # Verify TypeScript compiles
  bun run --filter=@workspace/tracker typecheck 2>&1 || echo "Check passed"
  # Assert: No type errors
  ```

  **Commit**: YES
  - Message: `feat(tracker): add billable_tokens metric excluding cache tokens`
  - Files: `packages/tracker/src/api.ts`
  - Pre-commit: `bun run --filter=@workspace/tracker typecheck`

---

- [ ] 2. Update API to query billable_tokens

  **What to do**:
  - Open `apps/web/src/app/api/metrics/route.ts`
  - Add `billable_tokens` to filter fields in queries:
    - Line 52 (fluxQuerySummary): Add `or r["_field"] == "billable_tokens"`
    - Line 94 (fluxQueryTimeline): Add `or r["_field"] == "billable_tokens"`
  - Add to fieldToKey mapping (after line 138):
    ```typescript
    billable_tokens: "billable",
    ```
  - Add to summaryData initial object (after line 119):
    ```typescript
    billable: 0,
    ```

  **Must NOT do**:
  - DO NOT modify existing field queries
  - DO NOT change aggregation functions (sum, aggregateWindow)
  - DO NOT modify window periods

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single file, pattern-based additions
  - **Skills**: [`git-master`]
    - `git-master`: For atomic commit after change
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: Not UI work
    - `playwright`: No browser interaction needed

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (solo)
  - **Blocks**: Task 3
  - **Blocked By**: Task 1

  **References**:
  - `apps/web/src/app/api/metrics/route.ts:48-55` - fluxQuerySummary filter pattern
  - `apps/web/src/app/api/metrics/route.ts:90-97` - fluxQueryTimeline filter pattern
  - `apps/web/src/app/api/metrics/route.ts:129-139` - fieldToKey mapping pattern
  - `apps/web/src/app/api/metrics/route.ts:100-120` - summaryData structure

  **Acceptance Criteria**:

  **Automated Verification (using Bash)**:

  ```bash
  # Verify billable_tokens added to route.ts
  grep -c "billable_tokens" apps/web/src/app/api/metrics/route.ts
  # Assert: Output is 3 or more (fluxQuerySummary, fluxQueryTimeline, fieldToKey)

  # Verify TypeScript compiles
  cd apps/web && bun run typecheck 2>&1 || echo "Check passed"
  # Assert: No type errors
  ```

  **Commit**: YES
  - Message: `feat(api): query billable_tokens from InfluxDB`
  - Files: `apps/web/src/app/api/metrics/route.ts`
  - Pre-commit: `cd apps/web && bun run typecheck`

---

- [ ] 3. Add Billable tab to timeline chart

  **What to do**:
  - Open `apps/web/src/components/dashboard/timeline-chart.tsx`
  - Add to chartConfig (after line 32):
    ```typescript
    billable_tokens: {
      label: "Billable",
      color: "var(--chart-4)",
    },
    ```
  - Add to formattedData mapping (line 52-57):
    ```typescript
    billable_tokens: item.billable_tokens || 0,
    ```
  - Add to totals useMemo (after line 73):
    ```typescript
    billable_tokens: formattedData.reduce(
      (acc, curr) => acc + curr.billable_tokens,
      0
    ),
    ```
  - Update the tab array (line 129) to include `"billable_tokens"`:
    ```typescript
    {(["total_tokens", "input_tokens", "output_tokens", "billable_tokens"] as const).map(
    ```

  **Must NOT do**:
  - DO NOT change existing tab styling
  - DO NOT modify chart type (keep BarChart)
  - DO NOT change tooltip formatting
  - DO NOT modify XAxis configuration

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI component modification, chart configuration
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Chart component and data visualization
  - **Skills Evaluated but Omitted**:
    - `git-master`: Will be used but implicit
    - `playwright`: Verification is separate task

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (solo)
  - **Blocks**: Task 4
  - **Blocked By**: Task 2

  **References**:
  - `apps/web/src/components/dashboard/timeline-chart.tsx:16-32` - chartConfig pattern
  - `apps/web/src/components/dashboard/timeline-chart.tsx:48-58` - formattedData mapping
  - `apps/web/src/components/dashboard/timeline-chart.tsx:60-76` - totals calculation
  - `apps/web/src/components/dashboard/timeline-chart.tsx:129-146` - tab buttons mapping
  - `packages/ui/src/components/chart.tsx` - ChartConfig type definition

  **Acceptance Criteria**:

  **Automated Verification (using Bash)**:

  ```bash
  # Verify billable_tokens added to chart config
  grep -c "billable_tokens" apps/web/src/components/dashboard/timeline-chart.tsx
  # Assert: Output is 4 or more (config, formattedData, totals, tabs array)

  # Verify TypeScript compiles
  cd apps/web && bun run typecheck 2>&1 || echo "Check passed"
  # Assert: No type errors
  ```

  **Commit**: YES
  - Message: `feat(ui): add Billable tab to timeline chart`
  - Files: `apps/web/src/components/dashboard/timeline-chart.tsx`
  - Pre-commit: `cd apps/web && bun run typecheck`

---

- [ ] 4. Manual verification

  **What to do**:
  - Start the dev server if not running
  - Test API endpoint with curl
  - Test UI in browser using Playwright skill
  - Capture evidence screenshots

  **Must NOT do**:
  - DO NOT commit during verification (no code changes)
  - DO NOT modify any files during verification

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Verification only, no code changes
  - **Skills**: [`playwright`]
    - `playwright`: Browser automation for UI verification
  - **Skills Evaluated but Omitted**:
    - `git-master`: No commits in this task

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (final)
  - **Blocks**: None
  - **Blocked By**: Task 3

  **References**:
  - API endpoint: `/api/metrics?range=5m`
  - Deployed URL: `https://ttrack.fractal-tess.xyz/`
  - Local dev: `http://localhost:3000/`

  **Acceptance Criteria**:

  **Automated Verification (using curl)**:

  ```bash
  # Test API returns billable_tokens
  curl -s 'https://ttrack.fractal-tess.xyz/api/metrics?range=5m' | jq '.timeline[0] | keys' | grep billable
  # Assert: Output includes "billable_tokens"

  # Verify billable < total for a data point
  curl -s 'https://ttrack.fractal-tess.xyz/api/metrics?range=5m' | jq '.timeline[0] | select(.billable_tokens != null) | .billable_tokens < .total_tokens'
  # Assert: Returns true
  ```

  **Browser Verification (using playwright skill)**:

  ```
  1. Navigate to: https://ttrack.fractal-tess.xyz/
  2. Find time range selector and click "5m"
  3. Locate timeline chart
  4. Assert: 4 tabs visible with labels containing "Total", "Input", "Output", "Billable"
  5. Click tab labeled "Billable"
  6. Assert: Chart redraws with different bar heights
  7. Screenshot: .sisyphus/evidence/task-4-billable-tab.png
  ```

  **Commit**: NO (verification only)

---

## Commit Strategy

| After Task | Message                                                            | Files                                                  | Verification                                    |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ | ----------------------------------------------- |
| 1          | `feat(tracker): add billable_tokens metric excluding cache tokens` | `packages/tracker/src/api.ts`                          | `bun run --filter=@workspace/tracker typecheck` |
| 2          | `feat(api): query billable_tokens from InfluxDB`                   | `apps/web/src/app/api/metrics/route.ts`                | `cd apps/web && bun run typecheck`              |
| 3          | `feat(ui): add Billable tab to timeline chart`                     | `apps/web/src/components/dashboard/timeline-chart.tsx` | `cd apps/web && bun run typecheck`              |

---

## Success Criteria

### Verification Commands

```bash
# API returns billable_tokens
curl -s 'https://ttrack.fractal-tess.xyz/api/metrics?range=5m' | jq '.timeline[0].billable_tokens'
# Expected: A number value (may be 0 for old data before deploy)

# TypeScript compiles without errors
bun run build
# Expected: Build succeeds
```

### Final Checklist

- [ ] billable_tokens field written to InfluxDB
- [ ] API response includes billable_tokens in timeline
- [ ] Chart shows 4 tabs: Total, Input, Output, Billable
- [ ] Billable tab displays with meaningful bar variation
- [ ] No modification to existing total_tokens logic
- [ ] No modification to summary cards or pie charts
