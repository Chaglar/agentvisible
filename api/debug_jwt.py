"""
Debug JWT endpoint to examine token contents
"""
import os
import jwt
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from auth import verify_jwt  # Import our updated verification function

router = APIRouter(prefix='/api/v1/debug', tags=['debug'])
security = HTTPBearer(auto_error=False)

@router.post('/jwt-info')
async def debug_jwt_info(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    """Debug endpoint to examine JWT token contents"""

    if not credentials:
        return {"error": "No Authorization header provided"}

    token = credentials.credentials
    result = {
        "supabase_url_available": bool(os.environ.get("SUPABASE_URL")),
        "jwt_secret_available": bool(os.environ.get("SUPABASE_JWT_SECRET")),
        "token_present": bool(token),
        "token_length": len(token) if token else 0,
    }

    try:
        # Decode header without verification to see structure
        header = jwt.get_unverified_header(token)
        result["header"] = header
    except Exception as e:
        result["header_error"] = str(e)

    try:
        # Decode payload without verification to see structure
        payload = jwt.decode(token, options={"verify_signature": False})
        result["payload"] = payload
    except Exception as e:
        result["payload_error"] = str(e)

    # Test our updated verification function
    try:
        verified_user = verify_jwt(credentials)
        if verified_user:
            result["auth_verification"] = {
                "success": True,
                "user_id": verified_user.get("sub"),
                "email": verified_user.get("email"),
                "role": verified_user.get("role")
            }
        else:
            result["auth_verification"] = {
                "success": False,
                "reason": "verify_jwt returned None"
            }
    except Exception as e:
        result["auth_verification"] = {
            "success": False,
            "error": str(e)
        }

    return result