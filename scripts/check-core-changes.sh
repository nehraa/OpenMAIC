#!/bin/bash
# Warn if core files are being committed

CORE_CHANGES=$(git diff --cached --name-only | grep -E '^core/.*\.(ts|tsx|js|jsx)$' || true)

if [ -n "$CORE_CHANGES" ]; then
  echo "WARNING: You are committing changes to /core"
  echo "This is NOT allowed during Phase 1 development."
  echo ""
  echo "Changed files:"
  echo "$CORE_CHANGES"
  echo ""
  echo "All Phase 1 teacher/student work must go in /teacher and /student."
  echo "If you need something from core, COPY and ADAPT it."
  echo ""
  read -p "Continue with commit? (y/N) " -n 1 -r
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Commit cancelled."
    exit 1
  fi
fi