#!/usr/bin/env python3
"""susume-engine の状態から安全な数値だけを集計し data/status.json を書く。
タイトル・ID・パス等の文字列は一切含めない（数値と状態のみ）。
"""
import json
import os
import re
from datetime import datetime, timedelta, timezone

ENGINE_DIR = os.path.expanduser("~/.susume-engine")
STATE_PATH = os.path.join(ENGINE_DIR, "state.json")
RUN_LOG_PATH = os.path.join(ENGINE_DIR, "run.log")
STOP_PATH = os.path.join(ENGINE_DIR, "STOP")
OUT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "status.json")

JST = timezone(timedelta(hours=9))


def load_exec_times():
    """state.json破損時は空リストで安全側に倒す（既知の限界: 直近破損例あり）。"""
    try:
        with open(STATE_PATH, encoding="utf-8") as f:
            state = json.load(f)
        return state.get("exec_times", [])
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def count_exec_24h(exec_times):
    now = datetime.now()
    cutoff = now - timedelta(hours=24)
    count = 0
    for ts in exec_times:
        try:
            t = datetime.fromisoformat(ts)
        except ValueError:
            continue
        if t >= cutoff:
            count += 1
    return count


def read_run_log_tail(max_lines=20):
    try:
        with open(RUN_LOG_PATH, encoding="utf-8") as f:
            lines = f.readlines()
        return lines[-max_lines:]
    except FileNotFoundError:
        return []


def count_pattern(pattern):
    try:
        with open(RUN_LOG_PATH, encoding="utf-8") as f:
            text = f.read()
        return len(re.findall(pattern, text))
    except FileNotFoundError:
        return 0


def determine_status(tail_lines):
    if os.path.exists(STOP_PATH):
        return "STOPPED"
    for line in reversed(tail_lines):
        if "実行上限" in line and "SKIP" in line:
            return "WAITING"
        if "実行開始" in line or "実行終了" in line:
            return "RUNNING"
    return "WAITING"


def main():
    exec_times = load_exec_times()
    exec_24h = count_exec_24h(exec_times)
    done_total = count_pattern(r"判定=done")
    attempts_total = count_pattern(r"実行開始")
    tail_lines = read_run_log_tail()
    status = determine_status(tail_lines)

    payload = {
        "status": status,
        "exec_24h": exec_24h,
        "done_total": done_total,
        "attempts_total": attempts_total,
        "updated": datetime.now(JST).isoformat(),
    }

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    print(json.dumps(payload, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
