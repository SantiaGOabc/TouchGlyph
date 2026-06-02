import re

HTML_TAG_RE = re.compile(r"<[^>]*>")
EVENT_HANDLER_RE = re.compile(r"\bon\w+\s*=", re.IGNORECASE)
SCRIPT_RE = re.compile(r"</?script[^>]*>", re.IGNORECASE)


def sanitize_text(value: str, max_length: int = 255) -> str:
    if not isinstance(value, str):
        return ""
    value = SCRIPT_RE.sub("", value)
    value = EVENT_HANDLER_RE.sub("", value)
    value = HTML_TAG_RE.sub("", value)
    value = re.sub(r"\s+", " ", value).strip()
    if max_length > 0:
        value = value[:max_length]
    return value


def sanitize_html(value: str, max_length: int = 4096) -> str:
    if not isinstance(value, str):
        return ""
    value = SCRIPT_RE.sub("", value)
    value = EVENT_HANDLER_RE.sub("", value)
    value = re.sub(r"\s+", " ", value).strip()
    if max_length > 0:
        value = value[:max_length]
    return value
