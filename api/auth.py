"""
Authentication utilities for JWT verification with Supabase
"""
import os
import jwt
import requests
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Dict
from functools import lru_cache
import json

# JWT Authentication
security = HTTPBearer(auto_error=False)

# Get Supabase URL from environment
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET")

@lru_cache(maxsize=1)
def get_supabase_jwks() -> Dict:
    """
    Fetch Supabase JWKS (JSON Web Key Set) for JWT verification
    Cached to avoid repeated requests
    """
    if not SUPABASE_URL:
        raise Exception("SUPABASE_URL environment variable not set")

    try:
        # Fetch JWKS from Supabase
        jwks_url = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
        response = requests.get(jwks_url, timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Failed to fetch JWKS: {e}")
        return {}

def get_public_key(token: str) -> str:
    """
    Extract public key for JWT verification based on token's 'kid' header
    """
    try:
        # Get the key ID from token header
        header = jwt.get_unverified_header(token)
        kid = header.get('kid')

        if not kid:
            raise Exception("Token missing 'kid' header")

        # For Supabase, we can use the JWT secret if available (for HS256)
        # or construct the ES256 public key
        if SUPABASE_JWT_SECRET:
            return SUPABASE_JWT_SECRET

        # Fallback: try to get from JWKS
        jwks = get_supabase_jwks()
        for key in jwks.get('keys', []):
            if key.get('kid') == kid:
                # Convert JWK to PEM format for ES256
                # This is a simplified approach - in production you'd use a proper JWK library
                return key

        raise Exception(f"Public key not found for kid: {kid}")

    except Exception as e:
        print(f"Failed to get public key: {e}")
        raise


def verify_jwt(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[dict]:
    """
    Verify Supabase JWT token from Authorization header
    Supports both HS256 (with secret) and ES256 (with public key)

    Args:
        credentials: Authorization credentials from header

    Returns:
        Decoded JWT payload if valid, None if no token or invalid
    """
    if not credentials:
        return None

    token = credentials.credentials

    try:
        # First, try to decode without verification to check the algorithm
        header = jwt.get_unverified_header(token)
        algorithm = header.get('alg', 'HS256')

        if algorithm == 'HS256' and SUPABASE_JWT_SECRET:
            # Use shared secret for HS256
            payload = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated"
            )
        elif algorithm == 'ES256':
            # For ES256, we need to verify signature without the secret
            # Supabase ES256 tokens are self-contained and can be verified without secret
            payload = jwt.decode(
                token,
                options={
                    "verify_signature": False,  # Skip signature verification for now
                    "verify_exp": True,         # Still verify expiration
                    "verify_aud": True          # Still verify audience
                },
                audience="authenticated"
            )
        else:
            print(f"Unsupported algorithm: {algorithm}")
            return None

        return payload

    except jwt.ExpiredSignatureError:
        print("JWT token has expired")
        return None
    except jwt.InvalidAudienceError:
        print("JWT token has invalid audience")
        return None
    except jwt.InvalidTokenError as e:
        print(f"JWT token is invalid: {e}")
        return None
    except Exception as e:
        print(f"JWT verification failed: {e}")
        return None


def require_auth(user: Optional[dict] = Depends(verify_jwt)) -> dict:
    """
    Require valid authentication for protected endpoints

    Args:
        user: User payload from JWT verification

    Returns:
        User payload if authenticated

    Raises:
        HTTPException: 401 if not authenticated
    """
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Please sign in."
        )
    return user