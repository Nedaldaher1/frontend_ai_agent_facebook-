#!/usr/bin/env bash
# Stop hook for Claude Code.
# Intent: every change Claude makes MUST end up in a git commit.
# Behaviour: if the working tree is dirty when Claude tries to finish a turn,
# block the stop (exit 2) and tell Claude to commit. The block clears itself
# automatically once the tree is clean, so it cannot loop forever.

set -uo pipefail

payload="$(cat 2>/dev/null || true)"

# Loop guard: if we are already continuing because of this hook, don't block again.
case "$payload" in
  *'"stop_hook_active":true'*|*'"stop_hook_active": true'*) exit 0 ;;
esac

# Only enforce inside a git repository.
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0

# Clean tree -> allow the turn to end.
if [ -z "$(git status --porcelain 2>/dev/null)" ]; then
  exit 0
fi

files="$(git status --porcelain | sed 's/^...//' | paste -sd ', ' - 2>/dev/null || echo 'see git status')"

# Exit code 2 on a Stop hook prevents finishing and feeds stderr back to Claude.
{
  echo "UNCOMMITTED CHANGES present: ${files}"
  echo ""
  echo "This project requires every change to be committed before you finish."
  echo "Stage and commit your work now using Conventional Commits, referencing the Linear ticket, e.g.:"
  echo "    git add -A && git commit -m \"feat(products): add publish toggle (MASA-123)\""
  echo ""
  echo "Group unrelated changes into separate commits. Do NOT push."
  echo "If the user explicitly asked you NOT to commit, say so and stop instead of committing."
} >&2

exit 2
