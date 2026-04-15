# Code Style

## Python
- `async def` for all I/O functions
- Type hints on ALL signatures + return types
- Pydantic BaseModel for all request/response schemas
- `httpx.AsyncClient` with context managers, never bare
- Scanner modules: `async def scan(url: str, html: str, headers: dict) -> ModuleResult`
- Use `re` module for HTML extraction, NEVER install BeautifulSoup/lxml
- Use `json.loads()` for JSON-LD parsing
- `logging` module, never `print()`
- Max line length: 100

## TypeScript
- Strict mode, `interface` over `type` for objects
- Server Components by default, `"use client"` only when needed
- Tailwind for ALL styling, no CSS modules
- API calls via server actions, never client-side fetch to external APIs

## Naming
- Python: snake_case functions, PascalCase classes
- TypeScript: camelCase functions, PascalCase components
- Files: kebab-case everywhere
