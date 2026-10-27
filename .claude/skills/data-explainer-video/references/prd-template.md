# PRD template and sub-agent prompt rules

## Template

Save the PRD as `docs/prd/NN-short-name.md`, with these sections in this order:

```
# PRD-NN: title

## Context
Verified facts, with file paths.

## Goal

## Changes allowed
Exact files. Everything else is off-limits.

## Steps
Numbered, with explicit STOP conditions.

## Acceptance
Commands and expected values.

## Budget
Credits and number of paid calls.

## Report
What to paste verbatim. Say what failed or was not verified.
```

After review, append `## Outcome (date, measured)` with the measured results.

## Sub-agent prompt rules

Every sub-agent prompt states:

- the absolute repo path and the branch;
- a scratch directory outside the repo;
- "do not commit or push", unless the task is a commit task;
- never print the API key;
- report verbatim, and never invent numbers;
- save the PRD verbatim first.

Model: haiku. If haiku gets confused, use sonnet with effort medium.

## Commit tasks add

- the exact expected `git status` list; stop on anything else;
- the leak check (see `references/elevenlabs.md`);
- the exact commit message, with its trailers;
- the push command, with retries only on network errors, waiting 2, 4, 8 and 16 s.
