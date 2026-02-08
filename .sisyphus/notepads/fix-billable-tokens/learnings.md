# Fix Billable Tokens - Learnings

## Session: 2026-02-02

### What Was Implemented

1. **Task 1: Tracker** ✅
   - Added `billableTokens` calculation: input + output + reasoning
   - Added field write to InfluxDB
   - Commit: 3ba079c

2. **Task 2: API** ✅
   - Added `billable_tokens` to Flux queries (summary and timeline)
   - Added to SummaryData type and fieldToKey mapping
   - Commit: fa988f3

3. **Task 3: UI** ✅
   - Added Billable tab to timeline chart (4th tab)
   - Updated types in use-token-metrics.ts
   - Commit: 5566452

4. **Task 4: Verification** ✅
   - Build successful
   - Deployed to production
   - API returns billable field in summary

### Key Implementation Details

- **Tab Order**: Total → Billable → Input → Output
- **Color**: Uses `var(--chart-4)` for Billable tab
- **Historical Data**: Shows 0 for old data (expected behavior)
- **New Data**: Will show actual billable token counts

### Verification Results

```bash
# API returns billable in summary
curl 'https://ttrack.fractal-tess.xyz/api/metrics?range=5m' | jq '.summary.billable'
# Returns: 0 (for historical data)

# All commits pushed
# Build: ✅ Success
# Deploy: ✅ Active
```

### Notes

- The billable_tokens field will only appear in timeline data for new writes
- Historical data predating this change will show 0 or undefined
- This is intentional - no backfill was requested
