#!/usr/bin/env bash
# Overnight queue for AgentVisible build
# Run this before going to sleep: bash overnight-queue.sh
#
# This executes 2 autonomous-safe tasks sequentially while you sleep.
# Each task runs on its own fix/ or feat/ branch.
# You review all branches in the morning via: git branch -a
#
# Tasks that require your input (Stripe keys, Supabase setup) are NOT queued here.
# Those wait for morning when you can configure external services.

set -e  # exit on any error

cd ~/projects/agentvisible

echo "================================================"
echo "AgentVisible overnight build queue starting..."
echo "Start time: $(date)"
echo "================================================"

# Make sure we're on main and up to date
git checkout main
git pull origin main 2>/dev/null || echo "Could not pull (ok if offline)"

# Make sure both tasks are in the tasks folder
if [ ! -f "tasks/022-legal-pages.md" ]; then
  echo "ERROR: tasks/022-legal-pages.md not found"
  echo "Copy it from ~/Downloads first"
  exit 1
fi

if [ ! -f "tasks/032-pricing-page.md" ]; then
  echo "ERROR: tasks/032-pricing-page.md not found"
  echo "Copy it from ~/Downloads first"
  exit 1
fi

echo ""
echo "================================================"
echo "TASK 1 of 2: Task 022 — Legal pages"
echo "Starting: $(date)"
echo "================================================"

git checkout -b feat/022-legal-pages

claude -p "Read tasks/022-legal-pages.md carefully and execute the full specification. Follow these critical rules:

1. ONE task scope: only create the files listed in the CREATE section and modify files in MODIFY section
2. Do NOT touch hero, scan pages, or ScanResultPanel
3. Use the EXACT content provided for terms/privacy/refunds pages
4. Run ALL verification commands before committing
5. If any verification fails, fix it and re-run until all pass
6. Commit with the exact message specified
7. Do not add extra features, refactors, or 'improvements' beyond spec" --permission-mode auto

# Return to main for next task
git checkout main

echo ""
echo "================================================"
echo "TASK 2 of 2: Task 032 — Pricing page rebuild"
echo "Starting: $(date)"
echo "================================================"

git checkout -b feat/032-pricing-page

claude -p "Read tasks/032-pricing-page.md carefully and execute the full specification. Follow these critical rules:

1. ONE task scope: only rebuild the pricing page, do not create new components outside what pricing needs
2. Do NOT touch hero demo, scan pages, ScanResultPanel, or any other route
3. Use the EXACT tier structure, copy, and FAQ content from the spec
4. Pro tier must be visually featured with 'Most popular' badge and teal border
5. Run ALL verification commands before committing
6. If any verification fails, fix it and re-run until all pass
7. Commit with the exact message specified
8. Do not add Stripe integration — buttons link to placeholders (/, /scan, /signup)" --permission-mode auto

# Return to main
git checkout main

echo ""
echo "================================================"
echo "Overnight queue complete"
echo "End time: $(date)"
echo "================================================"
echo ""
echo "BRANCHES CREATED (review in the morning):"
git branch | grep -E "022|032"
echo ""
echo "To review a branch:"
echo "  git checkout feat/022-legal-pages && npm run dev  (visit /terms, /privacy, /refunds)"
echo "  git checkout feat/032-pricing-page && npm run dev  (visit /pricing)"
echo ""
echo "To merge to main if both look good:"
echo "  git checkout main"
echo "  git merge feat/022-legal-pages"
echo "  git merge feat/032-pricing-page"
echo "  git push"
echo ""
