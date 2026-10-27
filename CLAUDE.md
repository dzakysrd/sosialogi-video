# sosialogi-video

Read HANDOFF.md first.

- Working mode: the main agent plans, writes a PRD for every task, and reviews. It never writes code or files itself, including commits.
- Coding, file writing, commits and pushes go to haiku sub-agents. If haiku gets confused, use sonnet with effort medium.
- Editorial decisions belong to the user: script text, gate limits, voice choice, spending. When a gate fails, stop and ask.
- Commit only after review, by a haiku sub-agent, on the session's designated branch. Open a pull request only when the user asks.

For any video task, use the data-explainer-video skill (.claude/skills/data-explainer-video/SKILL.md).

video-01/CLAUDE.md and template/CLAUDE.md are HyperFrames' own instructions for those folders.
