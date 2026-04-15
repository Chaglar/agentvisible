"""
AgentVisible.ai FastAPI backend
Main application entry point with CORS and health endpoint
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import ALLOWED_ORIGINS

app = FastAPI(
    title="AgentVisible API",
    description="AI Agent Readiness Scanner API",
    version="0.1.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint for monitoring and deployment verification"""
    return {"status": "ok", "version": "0.1.0"}


# Root route for testing
@app.get("/")
async def root():
    return {"message": "AgentVisible API is running"}
