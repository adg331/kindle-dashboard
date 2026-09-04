#!/usr/bin/env python3
"""Read Codex rate limits locally and update the public dashboard JSON."""

import argparse
import datetime
import json
import pathlib
import subprocess
import sys


ROOT = pathlib.Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "quota.json"


def rpc_write(process, message):
    process.stdin.write(json.dumps(message, separators=(",", ":")) + "\n")
    process.stdin.flush()


def rpc_result(process, request_id):
    for line in process.stdout:
        message = json.loads(line)
        if message.get("id") == request_id:
            if "error" in message:
                raise RuntimeError(message["error"])
            return message["result"]
    raise RuntimeError("Codex app-server closed before returning data")


def read_limits():
    process = subprocess.Popen(
        ["codex", "app-server", "--stdio"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        text=True,
        bufsize=1,
    )
    try:
        rpc_write(process, {
            "id": 1,
            "method": "initialize",
            "params": {
                "clientInfo": {"name": "kindle-dashboard", "version": "1.0.0"},
                "capabilities": {"experimentalApi": True},
            },
        })
        rpc_result(process, 1)
        rpc_write(process, {"method": "initialized"})
        rpc_write(process, {"id": 2, "method": "account/rateLimits/read"})
        return rpc_result(process, 2)
    finally:
        process.terminate()
        try:
            process.wait(timeout=3)
        except subprocess.TimeoutExpired:
            process.kill()


def display_time(timestamp):
    if timestamp is None:
        return "--"
    return datetime.datetime.fromtimestamp(timestamp).astimezone().strftime("%m-%d %H:%M")


def window(value):
    value = value or {}
    return {
        "used_percent": int(value.get("usedPercent", 0)),
        "resets_at": display_time(value.get("resetsAt")),
    }


def update_file(result):
    limits = result.get("rateLimits") or {}
    payload = {
        "plan": (limits.get("planType") or "Codex").title(),
        "five_hour": window(limits.get("primary")),
        "weekly": window(limits.get("secondary")),
        "updated_at": datetime.datetime.now().astimezone().strftime("%Y-%m-%d %H:%M"),
    }
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
    return payload


def publish():
    subprocess.run(["git", "add", str(OUTPUT)], cwd=ROOT, check=True)
    changed = subprocess.run(
        ["git", "diff", "--cached", "--quiet"], cwd=ROOT
    ).returncode != 0
    if not changed:
        return False
    subprocess.run(["git", "commit", "-m", "Update Codex quota"], cwd=ROOT, check=True)
    subprocess.run(["git", "push"], cwd=ROOT, check=True)
    return True


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--publish", action="store_true", help="commit and push quota.json")
    args = parser.parse_args()
    payload = update_file(read_limits())
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    if args.publish:
        print("published" if publish() else "unchanged")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print("更新失败：%s" % error, file=sys.stderr)
        sys.exit(1)
