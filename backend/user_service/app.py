import os
from flask import Flask
from flask_cors import CORS
from shared.config import config
from shared.logging_setup import setup_logging
from shared.limiter import init_limiter
from shared.health import create_health_blueprint
from flasgger import Swagger

logger = setup_logging("user_service", config.LOG_LEVEL)

def create_app():
    try:
        os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
        import tensorflow as tf
        tf.get_logger().setLevel(os.environ.get("TF_LOG_LEVEL", "ERROR"))
    except ImportError:
        pass

    app = Flask(__name__)
    app.config['SECRET_KEY'] = config.SECRET_KEY

    origins = ["*"] if config.CORS_ALLOW_ALL else [origin.strip() for origin in config.CORS_ORIGINS]
    CORS(app, origins=origins, supports_credentials=True, allow_headers=["Content-Type", "Authorization"])

    init_limiter(app)

    Swagger(app, template={
        "swagger": "2.0",
        "info": {"title": "User Service", "version": "1.0.0"},
        "basePath": "/api",
    })

    from .routes import user_bp
    app.register_blueprint(user_bp)

    health_bp = create_health_blueprint("user_service")
    app.register_blueprint(health_bp)

    logger.info("user_service started", extra={"extra_data": {"port": config.USER_SERVICE_PORT}})
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=config.DEBUG, port=config.USER_SERVICE_PORT, host='0.0.0.0')
