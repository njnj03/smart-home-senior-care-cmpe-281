#!/usr/bin/env python3
"""
Simple IoT Audio Simulator
--------------------------
This script simulates an IoT device by uploading WAV audio files to the backend
ingestion API endpoint:

  POST /api/v1/ingest/event   (multipart/form-data)

# Send one file once
python simulate_device.py --file simulator/audio/5-9032-A.wav --house-id 2 --device-id 2

# Send first 3 WAVs in a folder, 5 seconds apart (small, safe test)
python simulate_device.py --dir simulator/audio --house-id 2 --device-id 2 --limit 3 --sleep 5

# Use a fixed timestamp (e.g., to match demo script)
python simulate_device.py --file simulator/audio/5-9032-A.wav --house-id 2 --device-id 2 --timestamp 2025-11-15T12:00:00Z

Environment
-----------
BACKEND_URL: base URL for the API (default: http://127.0.0.1:8000)

Exit Codes
----------
0 = success, 1 = partial/total failure, 2 = missing dependency
"""

from __future__ import annotations

import os
import sys
import time
import argparse
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable, Optional

try:
    import requests  # HTTP client for Python
except ImportError:
    print("ERROR: This script requires the 'requests' package.\n"
          "Install it with:  pip install requests", file=sys.stderr)
    sys.exit(2)


# Default backend URL (can be overridden by BACKEND_URL env or --backend flag)
DEFAULT_BACKEND = os.getenv("BACKEND_URL", "http://127.0.0.1:8000")


def iso_utc_now() -> str:
    """Return current time as ISO-8601 string in UTC without microseconds."""
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def iter_wavs(directory: Path) -> Iterable[Path]:
    """Yield .wav files in the directory in sorted order."""
    for p in sorted(directory.glob("*.wav")):
        if p.is_file():
            yield p


def post_ingest(
    backend: str,
    house_id: int,
    device_id: int,
    timestamp: str,
    audio_path: Path,
    timeout: int = 60,
) -> dict:
    """
    POST a single audio file to the ingestion endpoint.
    Returns the JSON payload (dict) from the server or raises on HTTP error.
    """
    url = f"{backend.rstrip('/')}/api/v1/ingest/event"

    # Use a context manager to ensure the file handle is closed.
    with open(audio_path, "rb") as f:
        files = {
            # (filename, fileobj, mimetype)
            "audio_file": (audio_path.name, f, "audio/wav"),
        }
        data = {
            "house_id": str(house_id),
            "device_id": str(device_id),
            "timestamp": timestamp,  # must be ISO-8601
        }
        # NOTE: Do not set Content-Type header here; 'requests' handles multipart.
        resp = requests.post(url, files=files, data=data, timeout=timeout)

    # Try to decode JSON regardless of success/failure for better error messages
    try:
        payload = resp.json()
    except Exception:
        payload = {"raw": resp.text}

    if not resp.ok:
        # Raise a meaningful error including status and any server-provided detail
        detail = payload.get("detail") if isinstance(payload, dict) else payload
        raise RuntimeError(f"HTTP {resp.status_code} from {url}: {detail}")

    return payload


def build_arg_parser() -> argparse.ArgumentParser:
    """Create and return an argument parser."""
    parser = argparse.ArgumentParser(
        description="Simulate an IoT device by uploading WAV files to /api/v1/ingest/event"
    )

    # Exactly one of --file or --dir is required
    src = parser.add_mutually_exclusive_group(required=True)
    src.add_argument("--file", type=str, help="Single .wav file to send")
    src.add_argument("--dir", type=str, help="Directory containing .wav files")

    parser.add_argument("--house-id", type=int, required=True, help="House ID (integer)")
    parser.add_argument("--device-id", type=int, required=True, help="Device ID (integer)")

    parser.add_argument(
        "--backend",
        type=str,
        default=DEFAULT_BACKEND,
        help=f"Backend base URL (default from BACKEND_URL env or {DEFAULT_BACKEND})",
    )
    parser.add_argument(
        "--timestamp",
        type=str,
        help="Optional ISO-8601 UTC timestamp (e.g., 2025-11-15T12:00:00Z). "
             "If omitted, current UTC time is used for each file.",
    )
    parser.add_argument(
        "--sleep",
        type=float,
        default=0.0,
        help="Seconds to sleep between files (default: 0). Helpful to throttle uploads.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        help="Maximum number of files to send from the directory (ignored for --file).",
    )
    parser.add_argument(
        "--continue-on-error",
        action="store_true",
        help="Do not stop on first error; continue with remaining files.",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=60,
        help="HTTP request timeout in seconds (default: 60).",
    )

    return parser


def resolve_files(args: argparse.Namespace) -> list[Path]:
    """Resolve and return the list of files to send based on --file or --dir."""
    if args.file:
        p = Path(args.file)
        if not p.exists():
            raise FileNotFoundError(f"File not found: {p}")
        if p.suffix.lower() != ".wav":
            raise ValueError(f"Not a .wav file: {p}")
        return [p]

    # Directory mode
    d = Path(args.dir)
    if not d.exists():
        raise FileNotFoundError(f"Directory not found: {d}")
    files = list(iter_wavs(d))
    if not files:
        print(f"WARNING: No .wav files found in {d}", file=sys.stderr)
    if args.limit is not None and args.limit >= 0:
        files = files[: args.limit]
    return files


def main(argv: Optional[list[str]] = None) -> int:
    parser = build_arg_parser()
    args = parser.parse_args(argv)

    try:
        files = resolve_files(args)
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 1

    if not files:
        # Nothing to do (no .wav files). Not an error, so exit 0.
        print("[sim] No files to send. Exiting.")
        return 0

    print(f"[sim] Backend:   {args.backend}")
    print(f"[sim] House ID:  {args.house_id}")
    print(f"[sim] Device ID: {args.device_id}")
    print(f"[sim] Files:     {len(files)} to upload")
    failures = 0

    for idx, path in enumerate(files, start=1):
        # Use provided timestamp or generate a fresh UTC timestamp per file
        ts = args.timestamp or iso_utc_now()
        print(f"[{idx}/{len(files)}] → Uploading {path.name}  ts={ts} ... ", end="", flush=True)

        try:
            payload = post_ingest(
                backend=args.backend,
                house_id=args.house_id,
                device_id=args.device_id,
                timestamp=ts,
                audio_path=path,
                timeout=args.timeout,
            )

            # Try to read out useful fields for quick feedback
            event_id = None
            is_processed = None
            if isinstance(payload, dict):
                event_id = payload.get("event_id") or payload.get("event", {}).get("event_id")
                is_processed = payload.get("is_processed") or payload.get("event", {}).get("is_processed")

            print("OK")
            if event_id is not None:
                print(f"      event_id={event_id}  is_processed={is_processed}")
            else:
                # Fallback: show compact payload
                print(f"      response={str(payload)[:200]}")

        except Exception as e:
            failures += 1
            print("FAIL")
            print(f"      Error: {e}", file=sys.stderr)
            if not args.continue_on_error:
                # Stop immediately on first failure unless flag is set
                return 1

        # Optional delay between files
        if args.sleep > 0 and idx < len(files):
            try:
                time.sleep(args.sleep)
            except KeyboardInterrupt:
                print("\n[sim] Interrupted by user.")
                return 1

    print(f"[sim] Done. Failures: {failures}")
    return 0 if failures == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
