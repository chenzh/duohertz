"""Case runner with ACCEPTANCE.md-style reporting."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable


@dataclass
class CaseResult:
    case_id: str
    ok: bool
    detail: str = ""


@dataclass
class Harness:
    """Collects PASS/FAIL results and prints a summary."""

    name: str
    results: list[CaseResult] = field(default_factory=list)

    def record(self, case_id: str, ok: bool, detail: str = "") -> None:
        self.results.append(CaseResult(case_id, ok, detail))
        mark = "PASS" if ok else "FAIL"
        suffix = f" {detail}" if detail else ""
        print(f"[{mark}] {case_id}{suffix}")

    def run_case(self, case_id: str, fn: Callable[[], bool], detail: str = "") -> None:
        try:
            ok = bool(fn())
        except Exception as exc:  # noqa: BLE001 — harness should not crash on one case
            self.record(case_id, False, f"{detail} error={exc}".strip())
            return
        self.record(case_id, ok, detail)

    @property
    def passed(self) -> int:
        return sum(1 for r in self.results if r.ok)

    @property
    def failed_ids(self) -> list[str]:
        return [r.case_id for r in self.results if not r.ok]

    def summary(self) -> int:
        print(f"\n=== {self.name} Summary ===")
        print(f"PASS {self.passed} / {len(self.results)}")
        if self.failed_ids:
            print("FAILED:", ", ".join(self.failed_ids))
            return 1
        return 0
