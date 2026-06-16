---
description: Stage and commit current changes using Conventional Commits, referencing the Linear ticket
argument-hint: [optional scope or message hint]
---

Create one or more logical git commits for the current outstanding changes.

1. Run `git status` and `git diff` to understand exactly what changed.
2. Group related changes into separate, logical commits. Never lump unrelated changes together.
3. Write each message in Conventional Commits format: `type(scope): summary`
   - type: feat | fix | refactor | style | docs | test | chore | build | ci
   - Reference the active Linear ticket in the summary or footer, e.g. `(MASA-123)`.
   - Imperative mood, English, summary under ~72 characters.
4. Stage and commit. **Do NOT push.**
5. Print `git log --oneline -n 5` so the result is visible.

If `$ARGUMENTS` is provided, use it as a hint for the commit scope or message.
