"""
Unified IoT Device Simulator
============================
This script simulates two kinds of device behavior against your FastAPI backend:

  1) AUDIO INGEST:
     Upload one or more WAV audio files to
       POST /api/v1/ingest/event

  2) HEARTBEAT:
     Periodically send a heartbeat to
       POST /api/v1/devices/{device_id}/heartbeat

The tool uses **sub-commands**:
  - audio       -> send audio files
  - heartbeat   -> send periodic heartbeat

Examples:

# AUDIO: send one file
python simulate_device.py audio --file simulator/audio/5-9032-A.wav --house-id 2 --device-id 2

# AUDIO: send first 3 files from a folder, 5 seconds apart
python simulate_device.py audio --dir simulator/audio --house-id 2 --device-id 2 --limit 3 --sleep 5

# AUDIO: fixed timestamp (ISO 8601, UTC)
python simulate_device.py audio --file simulator/audio/5-9032-A.wav --house-id 2 --device-id 2 --timestamp 2025-11-15T12:00:00Z

# HEARTBEAT: send 5 beats, 10 seconds apart
python simulate_device.py heartbeat --device-id 2 --interval 10 --count 5 --status online --firmware 1.0.3

# HEARTBEAT: run indefinitely every 30s (Ctrl+C to stop)
python simulate_device.py heartbeat --device-id 2 --interval 30
"""

from __future__ import annotations
import os, sys, time, argparse
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable, Optional

try:
    import requests
except ImportError:
    print("ERROR: This script requires the 'requests' package. Install with:\n  pip install requests", file=sys.stderr)
    sys.exit(2)

DEFAULT_BACKEND = os.getenv("BACKEND_URL", "http://127.0.0.1:8000")

# ------------------------- Helpers -------------------------
def iso_utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()

# ------------------------- AUDIO INGEST ---------------------
def iter_wavs(directory: Path) -> Iterable[Path]:
    for p in sorted(directory.glob("*.wav")):
        if p.is_file():
            yield p

def post_ingest(backend: str, house_id: int, device_id: int, timestamp: str, audio_path: Path, timeout: int = 60) -> dict:
    url = f"{backend.rstrip('/')}/api/v1/ingest/event"
    with open(audio_path, "rb") as f:
        files = {"audio_file": (audio_path.name, f, "audio/wav")}
        data = {"house_id": str(house_id), "device_id": str(device_id), "timestamp": timestamp}
        resp = requests.post(url, files=files, data=data, timeout=timeout)
    try:
        payload = resp.json()
    except Exception:
        payload = {"raw": resp.text}
    if not resp.ok:
        raise RuntimeError(f"HTTP {resp.status_code}: {payload}")
    return payload

def cmd_audio(args: argparse.Namespace) -> int:
    if args.file:
        files = [Path(args.file)]
    else:
        d = Path(args.dir)
        files = list(iter_wavs(d))
        if args.limit is not None: files = files[: args.limit]
    print(f"[audio] Sending {len(files)} file(s) to {args.backend}")
    for i, path in enumerate(files, 1):
        ts = args.timestamp or iso_utc_now()
        print(f"[{i}/{len(files)}] Uploading {path.name} ... ", end="", flush=True)
        try:
            payload = post_ingest(args.backend, args.house_id, args.device_id, ts, path)
            print("OK")
        except Exception as e:
            print(f"FAIL ({e})")
            if not args.continue_on_error: return 1
        if args.sleep and i < len(files): time.sleep(args.sleep)
    return 0

# ------------------------- HEARTBEAT ------------------------
def post_heartbeat(backend: str, device_id: int, status: str | None, firmware: str | None, timeout: int = 30) -> dict:
    url = f"{backend.rstrip('/')}/api/v1/devices/{device_id}/heartbeat"
    payload = {}
    if status: payload["status"] = status
    if firmware: payload["firmware_version"] = firmware
    resp = requests.post(url, json=payload, timeout=timeout)
    try:
        body = resp.json()
    except Exception:
        body = {"raw": resp.text}
    if not resp.ok:
        raise RuntimeError(f"HTTP {resp.status_code}: {body}")
    return body

def cmd_heartbeat(args: argparse.Namespace) -> int:
    print(f"[hb] Backend: {args.backend}  Device: {args.device_id}  Every {args.interval}s")
    i = 0
    try:
        while True:
            i += 1
            print(f"[{i}] → heartbeat status={args.status or 'online'} ... ", end="", flush=True)
            try:
                body = post_heartbeat(args.backend, args.device_id, args.status, args.firmware)
                print("OK")
            except Exception as e:
                print(f"FAIL ({e})")
            if args.count and i >= args.count: break
            time.sleep(args.interval)
    except KeyboardInterrupt:
        print("\n[hb] Stopped.")
    return 0

# ------------------------- CLI Parser -----------------------
def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Unified IoT Device Simulator (audio ingest + heartbeat)")
    p.add_argument("--backend", type=str, default=DEFAULT_BACKEND)
    sub = p.add_subparsers(dest="cmd", required=True)

    a = sub.add_parser("audio", help="Send WAV files to ingestion endpoint")
    src = a.add_mutually_exclusive_group(required=True)
    src.add_argument("--file", type=str)
    src.add_argument("--dir", type=str)
    a.add_argument("--house-id", type=int, required=True)
    a.add_argument("--device-id", type=int, required=True)
    a.add_argument("--timestamp", type=str)
    a.add_argument("--sleep", type=float, default=0)
    a.add_argument("--limit", type=int)
    a.add_argument("--continue-on-error", action="store_true")
    a.set_defaults(func=cmd_audio)

    hb = sub.add_parser("heartbeat", help="Send periodic heartbeat")
    hb.add_argument("--device-id", type=int, required=True)
    hb.add_argument("--interval", type=float, default=30)
    hb.add_argument("--count", type=int)
    hb.add_argument("--status", type=str)
    hb.add_argument("--firmware", type=str)
    hb.set_defaults(func=cmd_heartbeat)
    return p

def main(argv: Optional[list[str]] = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    return args.func(args)

if __name__ == "__main__":
    raise SystemExit(main())
