"""
Shared dependencies for FastAPI routes
"""
from fastapi import HTTPException, Header
from fastapi.security import HTTPAuthorizationCredentials
from typing import Optional

from auth import verify_jwt
from database import get_supabase_client

async def get_optional_user_id(authorization: str = None) -> Optional[str]:
    """Extract user ID from JWT token"""
    if not authorization or not authorization.startswith('Bearer '):
        return None

    try:
        token = authorization.replace('Bearer ', '')
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        user = verify_jwt(credentials)
        return user.get('sub') if user else None
    except:
        return None

async def get_required_user_id(authorization: str = Header(default=None)) -> str:
    """Extract user ID from JWT token, raise 401 if not found"""
    uid = await get_optional_user_id(authorization)
    if not uid:
        raise HTTPException(status_code=401, detail='Auth required')
    return uid