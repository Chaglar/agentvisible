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

# AI Summary settings
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

# Industry benchmarks (will be populated from real scan data)
INDUSTRY_BENCHMARKS = {
    "ecommerce": {"average": 38, "top10": 85},
    "saas": {"average": 52, "top10": 88},
    "media": {"average": 34, "top10": 78},
    "agency": {"average": 41, "top10": 82},
    "default": {"average": 42, "top10": 83},
}

# Score rating thresholds
SCORE_RATINGS = {
    "Critical": (0, 24),
    "Weak": (25, 49),
    "Moderate": (50, 74),
    "Strong": (75, 100),
}

# Module explanations for tooltips
MODULE_EXPLANATIONS = {
    "structured_data": "Machine-readable information about your products, business, and content that AI agents use to understand your site",
    "ai_crawlability": "Settings that control whether AI bots can access and index your website content",
    "content_parseability": "How easy it is for AI agents to understand your website's structure and content",
    "commerce_protocols": "E-commerce data and APIs that AI agents use to understand your products and services",
    "agent_discovery": "Special endpoints and features that help AI agents find and interact with your business"
}

# Check explanations for tooltips
CHECK_EXPLANATIONS = {
    "JSON-LD Schema": "A code snippet that tells AI agents about your business, products, or content in a standardized format",
    "Open Graph Tags": "Meta tags that provide information about your page when shared on social media or analyzed by AI",
    "HTML Robots Meta": "HTML tags that tell AI bots whether they can index and follow links on your page",
    "X-Robots-Tag Header": "HTTP headers that provide crawler instructions to AI bots",
    "Semantic HTML": "Proper HTML structure using meaningful tags that help AI understand your content",
    "Server-Side Rendering": "Whether your content is available immediately when AI bots visit, without running JavaScript",
    "Shopify Platform": "Built-in e-commerce features that make your store more visible to AI shopping agents",
    "RSS/Atom Feeds": "Syndication feeds that AI agents can subscribe to for updates about your content",
    "AI Plugin Manifest": "A special file that tells AI agents what capabilities your website offers",
}
