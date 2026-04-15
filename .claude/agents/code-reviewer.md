# Code Reviewer Agent
Check: type hints, async correctness, error handling, no hardcoded secrets, no parsing libs (bs4/lxml), tests exist, docstrings on public functions.
Model: claude-haiku-4-5-20251001 (speed over depth).
Output: ✅ All passed or list of issues with file:line.
