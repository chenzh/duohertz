"""HTTP acceptance must distinguish API JSON from page and audio bytes."""

import io
import json
import urllib.error
import urllib.request

import pytest

from harness import HttpClient


class Response(io.BytesIO):
    def __init__(self, body: bytes, content_type: str) -> None:
        super().__init__(body)
        self.status = 200
        self.headers = {"Content-Type": content_type}


@pytest.mark.parametrize("content_type", [
    "application/json", "Application/JSON; charset=utf-8", "application/problem+json",
])
def test_json_media_types_are_decoded(monkeypatch, content_type):
    monkeypatch.setattr(urllib.request, "urlopen", lambda *args, **kwargs: Response(b'{"data": 1}', content_type))
    assert HttpClient().get("/fixture", key=None) == (200, {"data": 1})


@pytest.mark.parametrize(("content_type", "body"), [
    ("text/html; charset=utf-8", b'<!doctype html><div id="root"></div>'),
    ("application/octet-stream", b"RIFF\xff\x00WAVE"),
    ("audio/wav", b"RIFF\xff\x00WAVE"),
    ("", b"untyped bytes"),
])
def test_static_resources_remain_bytes(monkeypatch, content_type, body):
    monkeypatch.setattr(urllib.request, "urlopen", lambda *args, **kwargs: Response(body, content_type))
    assert HttpClient().get("/fixture", key=None) == (200, body)


@pytest.mark.parametrize(("body", "expected"), [
    (b'{"error": {"message": "Rate limit exceeded"}}', {"error": {"message": "Rate limit exceeded"}}),
    (b"Service unavailable", {"raw": "Service unavailable"}),
    (b"upstream \xff error", {"raw": "upstream \ufffd error"}),
])
def test_http_errors_keep_json_or_raw_messages(monkeypatch, body, expected):
    def fail(*args, **kwargs):
        raise urllib.error.HTTPError("http://localhost/fixture", 503, "Unavailable", {}, io.BytesIO(body))

    monkeypatch.setattr(urllib.request, "urlopen", fail)
    assert HttpClient().get("/fixture", key=None) == (503, expected)


def test_malformed_api_json_is_not_silently_accepted(monkeypatch):
    monkeypatch.setattr(urllib.request, "urlopen", lambda *args, **kwargs: Response(b"invalid", "application/json"))
    with pytest.raises(json.JSONDecodeError):
        HttpClient().get("/fixture", key=None)
