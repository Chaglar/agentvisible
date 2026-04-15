# AgentVisible.ai — Quick Start

## Tonight (20 min)

### 1. Create GitHub monorepo
```bash
mkdir agentvisible && cd agentvisible
git init
gh repo create agentvisible --private --source=. --push
```

### 2. Copy project files
```bash
# Copy everything from this zip into your repo root
cp -r .claude/ CLAUDE.md CLAUDE.local.md .mcp.json tasks/ ./
```

### 3. DNS + Supabase
- Cloudflare: add agentvisible.ai zone, set nameservers
- Supabase: create project, note URL + keys

### 4. First Claude Code run
```bash
npm install -g @anthropic-ai/claude-code
cd ~/projects/agentvisible
claude
```

## Tomorrow 7AM — Queue Build Tasks

### Option A: Headless (Mac Mini stays on)
```bash
claude -p "Read tasks/001-scaffold-monorepo.md. Complete all acceptance criteria. Then read tasks/002-scanner-modules.md and complete that too." --permission-mode auto
```

### Option B: Routines (Anthropic cloud, no local machine)
Set up via claude.ai/code interface

### Option C: Phone monitoring
Start Claude Code, use iOS app Remote Control to check progress

## Evening Review (2h)
1. `git pull`
2. `cd api && ruff check . && pytest`
3. `cd web && npm run build`
4. `claude /project:review`
5. Update task statuses (TODO → DONE)
6. `git push`

## Task Order
```
Week 1: 001 → 002 → 003 → 004
Week 2: 005 → 006 → 007
Week 3: 008 → 009 → LAUNCH (May 4)
```

## Custom Commands
- `/project:review` — code quality check
- `/project:test-scan` — scan 5 test URLs, validate scores
