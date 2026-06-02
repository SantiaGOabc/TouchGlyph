import pytest
from flask import Flask
from shared.health import create_health_blueprint


class TestHealthEndpoint:
    @pytest.fixture
    def app(self):
        app = Flask(__name__)
        app.config["TESTING"] = True
        bp = create_health_blueprint("test_service")
        app.register_blueprint(bp)
        return app

    @pytest.fixture
    def client(self, app):
        return app.test_client()

    def test_health_returns_ok(self, client):
        resp = client.get("/api/health")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["status"] == "ok"
        assert data["service"] == "test_service"
        assert "database" in data
        assert "timestamp" in data

    def test_health_content_type(self, client):
        resp = client.get("/api/health")
        assert resp.content_type == "application/json"
