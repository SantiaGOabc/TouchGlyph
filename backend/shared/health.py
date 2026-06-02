from flask import Blueprint, jsonify
from datetime import datetime, timezone
from shared.database import get_db_cursor


def create_health_blueprint(service_name: str) -> Blueprint:
    health_bp = Blueprint(f"health_{service_name}", __name__)

    @health_bp.route("/api/health", methods=["GET"])
    def health_check():
        db_status = "ok"
        try:
            with get_db_cursor() as cursor:
                cursor.execute("SELECT 1")
        except Exception as e:
            db_status = f"error: {e}"

        return jsonify({
            "status": "ok" if db_status == "ok" else "degraded",
            "service": service_name,
            "database": db_status,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }), 200 if db_status == "ok" else 503

    return health_bp
