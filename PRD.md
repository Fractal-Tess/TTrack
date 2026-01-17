# 📋 TTrack Token Usage Tracking System - PRD

## 🤖 Agent Instructions

* After completing a task, use git to commit your changes.
* After making a commit, use the changesets cli to create a changeset.

```markdown
## Agent: <name>

### <date>

- Implemented: <feature>
- Validated: <how>
- Commit: <hash>
```

* Update progress.txt to track your progress upon completion of task.
* Always use the exa tool to check for documentation of the task you are working on.


**Validate Work** - Always verify that your changes are working as expected by using playwright or writing tests.

---

## Phases
Instructions: You are free to implement the phases in any order you see fit.

* InfluxDB Docker Compose configuration
* Bucket creation and retention policy (90 days)
* OpenCode plugin for token tracking
* Opencode plugin should send data to the InfluxDB database.
* Web dashboard page with summary metrics 
* Agent breakdown visualizations
* Time range selector (1h, 24h, 7d, 30d, 90d)
* Auto-refresh (30s interval)
* UI components (metric cards, charts, loading states)
* Responsive minimalist brutalist design and dark mode

---

Note:
* The app is local and no authentication is required.


