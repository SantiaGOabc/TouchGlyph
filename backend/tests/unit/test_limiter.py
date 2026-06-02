import pytest
from flask import Flask, Blueprint, jsonify
from shared.limiter import limiter, init_limiter
from shared.config import config


class TestLimiter:
    @pytest.fixture
    def app(self):
        app = Flask(__name__)
        app.config["TESTING"] = True
        init_limiter(app)
        bp = Blueprint("test", __name__)

        @bp.route("/limited", methods=["GET"])
        @limiter.limit("1 per minute")
        def limited():
            return jsonify({"ok": True})

        app.register_blueprint(bp)
        return app

    @pytest.fixture
    def client(self, app):
        return app.test_client()

    def test_first_request_succeeds(self, client):
        resp = client.get("/limited")
        assert resp.status_code == 200

    def test_limiter_imports_correctly(self):
        assert limiter is not None
        assert config.RATE_LIMIT_DEFAULT == "60 per minute"
        assert config.RATE_LIMIT_AUTH == "10 per minute"
