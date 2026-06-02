import logging
import json
import sys
from datetime import datetime, timezone
from typing import Optional


class JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info and record.exc_info[0]:
            log_entry["exception"] = self.formatException(record.exc_info)
        if hasattr(record, "extra_data"):
            log_entry["extra"] = record.extra_data
        return json.dumps(log_entry, ensure_ascii=False)


def setup_logging(service_name: str, level: Optional[str] = None) -> logging.Logger:
    logger = logging.getLogger(service_name)
    logger.setLevel(getattr(logging, level or "INFO"))

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JSONFormatter())
    logger.handlers.clear()
    logger.addHandler(handler)

    logger.propagate = False
    return logger
