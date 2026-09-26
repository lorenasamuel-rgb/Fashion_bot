#!/usr/bin/env bash
set -euo pipefail
export GITHUB_OWNER=lorenasamuel-rgb
export REPO_DESCRIPTION="FleekFlow — a supplier finishes a wholesale lot in conversation."
exec "$HOME/.cursor/skills/publish-github-repo/scripts/push-github.sh" "$@"
