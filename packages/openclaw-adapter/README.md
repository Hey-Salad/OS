# @heysalad-os/openclaw-adapter

Extracted runtime boundary between HeySalad OS and OpenClaw.

## Source of truth

Use these ShellCorp files as the extraction source:

- `/home/admin/.openclaw/workspace/ShellCorp/docs/openclaw-adapter-contracts.md`
- `/home/admin/.openclaw/workspace/ShellCorp/ui/src/lib/openclaw-adapter.ts`

## Scope

Keep this package focused on:

- runtime types
- normalization/parsing
- HTTP/WS integration helpers
- contract tests

Do not leak HeySalad product-domain concerns into this package.
