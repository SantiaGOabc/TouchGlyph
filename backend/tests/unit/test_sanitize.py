import pytest
from shared.sanitize import sanitize_text, sanitize_html


class TestSanitizeText:
    def test_clean_string_passes(self):
        assert sanitize_text("hello") == "hello"

    def test_strips_html_tags(self):
        assert sanitize_text("<script>alert('xss')</script>") == "alert('xss')"

    def test_strips_event_handlers(self):
        assert 'onclick' not in sanitize_text('onclick="evil()"')

    def test_truncates_long_string(self):
        long_str = "a" * 300
        result = sanitize_text(long_str, max_length=10)
        assert len(result) == 10
        assert result == "a" * 10

    def test_normalizes_whitespace(self):
        assert sanitize_text("hello    world") == "hello world"

    def test_non_string_returns_empty(self):
        assert sanitize_text(None) == ""
        assert sanitize_text(123) == ""

    def test_strips_script_tags(self):
        result = sanitize_text("<script>malicious code</script>hello")
        assert "hello" in result
        assert "<script>" not in result
        assert "</script>" not in result


class TestSanitizeHtml:
    def test_allows_html_without_script(self):
        text = "<b>hello</b>"
        result = sanitize_html(text)
        assert result == "<b>hello</b>"

    def test_strips_script_tags(self):
        text = "<b>hello</b><script>alert(1)</script>"
        result = sanitize_html(text)
        assert "<script>" not in result
        assert result == "<b>hello</b>alert(1)"

    def test_strips_event_handlers(self):
        text = '<div onclick="evil()">click</div>'
        result = sanitize_html(text)
        assert "onclick" not in result
