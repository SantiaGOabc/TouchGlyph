from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from shared.config import config

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[config.RATE_LIMIT_DEFAULT],
    storage_uri="memory://",
)


def init_limiter(app):
    limiter.init_app(app)
    return limiter

