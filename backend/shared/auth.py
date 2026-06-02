import jwt
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import request, jsonify, make_response
from .config import config


def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=config.JWT_EXPIRATION_MINUTES))
    to_encode.update({
        "exp": expire,
        "iss": "braille-api",
        "iat": datetime.now(timezone.utc)
    })
    return jwt.encode(to_encode, config.SECRET_KEY, algorithm=config.JWT_ALGORITHM)


def set_token_cookie(response, token: str):
    """Set the JWT as an httpOnly cookie on the response."""
    response.set_cookie(
        'access_token',
        token,
        httponly=True,
        samesite='Lax',
        secure=False,  # Set to True in production with HTTPS
        max_age=config.JWT_EXPIRATION_MINUTES * 60,
        path='/'
    )
    return response


def clear_token_cookie(response):
    """Clear the JWT cookie on the response."""
    response.set_cookie('access_token', '', httponly=True, samesite='Lax', max_age=0, path='/')
    return response


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        # Try Authorization header first
        auth = request.headers.get("Authorization")
        if auth and auth.startswith("Bearer "):
            token = auth.split(" ")[1]

        # Fallback to httpOnly cookie
        if not token:
            token = request.cookies.get("access_token")

        if not token:
            return jsonify({"error": "Token requerido"}), 401
        try:
            payload = jwt.decode(
                token, config.SECRET_KEY,
                algorithms=[config.JWT_ALGORITHM],
                options={"require": ["exp", "iss"]}
            )
            if payload.get("iss") != "braille-api":
                raise jwt.InvalidTokenError
            request.user_id = payload.get("sub")
            request.user_role = payload.get("role")
            if not request.user_id:
                raise jwt.InvalidTokenError
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expirado"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Token inválido"}), 401
        return f(*args, **kwargs)
    return decorated


def role_required(*allowed_roles):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if not hasattr(request, 'user_role') or request.user_role not in allowed_roles:
                return jsonify({"error": "Permisos insuficientes"}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator
