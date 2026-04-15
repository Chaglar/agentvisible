"""
Configuration settings for AgentVisible scanner
Module weights, timeouts, and environment-specific settings
"""

import os

# Scanner module weights (must sum to 100%)
MODULE_WEIGHTS = {
    "structured_data": 0.30,     # 30% - JSON-LD, OG tags, schema markup
    "ai_crawlability": 0.20,     # 20% - robots.txt, AI bot policies
    "content_parseability": 0.15, # 15% - semantic HTML, SSR detection
    "commerce_protocols": 0.20,   # 20% - e-commerce APIs, payment data
    "agent_discovery": 0.15,     # 15% - AI plugins, RSS feeds
}

# CORS allowed origins
ALLOWED_ORIGINS = [
    "http://localhost:3000",     # Local Next.js dev
    "https://agentvisible.ai",   # Production domain
    "https://*.vercel.app",      # Vercel preview deployments
]

# Scanner settings
SCAN_TIMEOUT = 30.0  # seconds - total scan timeout
HTTP_TIMEOUT = 5.0   # seconds - individual HTTP request timeout
MAX_HTML_SIZE = 2 * 1024 * 1024  # 2MB max HTML response

# Rate limiting (MVP: in-memory)
SCANS_PER_HOUR = 10  # per IP address

# Environment
DEBUG = os.getenv("DEBUG", "false").lower() == "true"
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY", "")

# Score rating thresholds
SCORE_RATINGS = {
    "Critical": (0, 24),
    "Weak": (25, 49),
    "Moderate": (50, 74),
    "Strong": (75, 100),
}
