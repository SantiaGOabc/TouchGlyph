from flask import Flask
from flask_cors import CORS
from shared.config import config
from shared.logging_setup import setup_logging
from shared.limiter import init_limiter
from shared.health import create_health_blueprint
from flasgger import Swagger

logger = setup_logging("admin_service", config.LOG_LEVEL)

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = config.SECRET_KEY

    origins = ["*"] if config.CORS_ALLOW_ALL else [origin.strip() for origin in config.CORS_ORIGINS]
    CORS(app, origins=origins, supports_credentials=True, allow_headers=["Content-Type", "Authorization"])

    init_limiter(app)

    Swagger(app, template={
        "swagger": "2.0",
        "info": {"title": "Admin Service", "version": "1.0.0"},
        "basePath": "/api/admin",
    })

    from .routes import admin_bp
    app.register_blueprint(admin_bp)

    health_bp = create_health_blueprint("admin_service")
    app.register_blueprint(health_bp)

    logger.info("admin_service started", extra={"extra_data": {"port": config.ADMIN_SERVICE_PORT}})
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=config.DEBUG, port=config.ADMIN_SERVICE_PORT, host='0.0.0.0')
