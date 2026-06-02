import json
import logging
import pytest
from shared.logging_setup import setup_logging, JSONFormatter


class TestLoggingSetup:
    def test_logger_created(self):
        logger = setup_logging("test_service", "DEBUG")
        assert logger.name == "test_service"
        assert logger.level == logging.DEBUG

    def test_json_format(self):
        logger = setup_logging("json_test", "INFO")
        logger.handlers[0].stream = pytest.__name__

        records = []

        class CaptureHandler(logging.Handler):
            def emit(self, record):
                records.append(self.format(record))

        handler = CaptureHandler()
        handler.setFormatter(JSONFormatter())
        logger.addHandler(handler)
        logger.info("hello world")

        assert len(records) == 1
        parsed = json.loads(records[0])
        assert parsed["level"] == "INFO"
        assert parsed["message"] == "hello world"
        assert parsed["logger"] == "json_test"
        assert "timestamp" in parsed
