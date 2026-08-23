"""HTTP helpers for live-stack acceptance tests."""

from __future__ import annotations

import json
import time
import urllib.error
import urllib.request
from typing import Any

from .env import HarnessEnv

_DEFAULT_KEY = object()


class HttpClient:
    def __init__(self, env: HarnessEnv | None = None) -> None:
        self.env = env or HarnessEnv()

    def request(
        self,
        method: str,
        path: str,
        *,
        base: str | None = None,
        key: str | None | object = _DEFAULT_KEY,
        body: dict | None = None,
        timeout: int = 60,
    ) -> tuple[int, dict[str, Any] | bytes]:
        root = (base or self.env.api_base).rstrip("/")
        data = None
        headers: dict[str, str] = {}
        if key is _DEFAULT_KEY:
            key = self.env.api_key
        if key is not None:
            headers["X-API-Key"] = key  # type: ignore[arg-type]
        if body is not None:
            data = json.dumps(body).encode()
            headers["Content-Type"] = "application/json"
        req = urllib.request.Request(f"{root}{path}", data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=timeout) as res:
                raw = res.read()
                ctype = res.headers.get("Content-Type", "")
                if "audio" in ctype:
                    return res.status, raw
                return res.status, json.loads(raw.decode())
        except urllib.error.HTTPError as e:
            raw = e.read()
            try:
                return e.code, json.loads(raw.decode())
            except json.JSONDecodeError:
                return e.code, {"raw": raw.decode(errors="replace")}

    def get(self, path: str, **kwargs: Any) -> tuple[int, dict[str, Any] | bytes]:
        return self.request("GET", path, **kwargs)

    def post(self, path: str, body: dict, **kwargs: Any) -> tuple[int, dict[str, Any] | bytes]:
        return self.request("POST", path, body=body, **kwargs)


def poll_job(
    client: HttpClient,
    job_id: str,
    *,
    timeout_sec: int | None = None,
    interval_sec: float = 2.0,
) -> dict[str, Any]:
    limit = timeout_sec if timeout_sec is not None else client.env.job_poll_timeout
    start = time.time()
    last: dict[str, Any] | None = None
    while time.time() - start < limit:
        code, body = client.get(f"/v1/jobs/{job_id}")
        if not isinstance(body, dict):
            raise RuntimeError(f"unexpected poll body for {job_id}")
        last = body["data"]
        if last["status"] in ("completed", "failed"):
            return last
        time.sleep(interval_sec)
    raise TimeoutError(job_id)
