"""
IoT Device Simulator
This script simulates two kinds of device behavior:

  1) AUDIO INGEST:
     Upload one or more WAV audio files to
       POST /api/v1/ingest/event

  2) HEARTBEAT:
     Periodically send a heartbeat to
       POST /api/v1/devices/{device_id}/heartbeat

Examples:

# AUDIO: send a specific audio file using device-id only 
python simulator/simulate_device.py audio --file simulator/audio/5-9032-A.wav --device-id 2

# RANDOM AUDIO: send random 3 WAVs files from a folder to random device, 5 seconds apart
python simulator/simulate_device.py random-audio --sleep 5 --count 3

# HEARTBEAT: send 1 beats to specific device
python simulator/simulate_device.py heartbeat --device-id 2 --count 1

# HEARTBEAT: send heartbeat to specific device every 30 seconds (Ctrl+C to stop)
python simulator/simulate_device.py heartbeat --device-id 2 --interval 10

# HEARTBEAT: send 5 heartbeat to **ALL devices** every 30 seconds
python simulator/simulate_device.py heartbeat --interval 30 --count 5

# HEARTBEAT: send heartbeat to **ALL devices** every 30 seconds (Ctrl+C to stop)
python simulator/simulate_device.py heartbeat --interval 30
"""

from __future__ import annotations
import os, sys, time, argparse
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable, Optional
import random

try:
    import requests
except ImportError:
    print("ERROR: This script requires the 'requests' package. Install with:\n  pip install requests", file=sys.stderr)
    sys.exit(2)

DEFAULT_BACKEND = os.getenv("BACKEND_URL", "http://127.0.0.1:8000")

# Time
def iso_utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()

# AUDIO INGEST
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

def fetch_houses(backend: str):
    url = f"{backend.rstrip('/')}/api/v1/iot/houses"    
    resp = requests.get(url, timeout=30)
    data = resp.json()
    return data.get("houses", data)

def fetch_devices_for_house(backend: str, house_id: int):
    url = f"{backend.rstrip('/')}/api/v1/iot/devices?house_id={house_id}"
    resp = requests.get(url, timeout=30)
    data = resp.json()
    return data.get("devices", data)

def pick_random_wav(directory: Path) -> Path:
    wavs = list(directory.glob("*.wav"))
    if not wavs:
        raise RuntimeError(f"No WAV files found in {directory}")
    return random.choice(wavs)

def fetch_device_info(backend: str, device_id: int):
    url = f"{backend.rstrip('/')}/api/v1/iot/devices?device_id={device_id}"
    resp = requests.get(url, timeout=30)
    data = resp.json()

    if isinstance(data, dict) and "devices" in data:
        devices = data["devices"]
        if not devices:
            raise RuntimeError(f"Device {device_id} not found")
        return devices[0]
    if isinstance(data, list):
        if not data:
            raise RuntimeError(f"Device {device_id} not found")
        return data[0]

    raise RuntimeError(f"Unexpected device info response: {data}")

def fetch_all_devices(backend: str):
    """Fetch all devices from the public IoT API."""
    url = f"{backend.rstrip('/')}/api/v1/iot/devices"
    resp = requests.get(url, timeout=30)
    data = resp.json()

    if isinstance(data, dict) and "devices" in data:
        return data["devices"]
    if isinstance(data, list):
        return data

    raise RuntimeError(f"Unexpected /iot/devices response: {data}")

def cmd_audio(args: argparse.Namespace) -> int:
    if args.file:
        files = [Path(args.file)]
    else:
        d = Path(args.dir)
        files = list(iter_wavs(d))
        if args.limit is not None: files = files[: args.limit]
    house_id = args.house_id
    if house_id is None:
        print(f"[audio] Fetching house_id for device {args.device_id} ... ", end="")
        info = fetch_device_info(args.backend, args.device_id)
        house_id = info.get("house_id")
        if not house_id:
            raise RuntimeError(f"Device {args.device_id} has no house_id!")
        print(f"FOUND house_id={house_id}")

    print(f"[audio] Sending {len(files)} file(s) to {args.backend}")

    for i, path in enumerate(files, 1):
        ts = args.timestamp or iso_utc_now()
        print(f"[{i}/{len(files)}] Uploading {path.name} ... ", end="", flush=True)
        try:
            payload = post_ingest(args.backend, house_id, args.device_id, ts, path)  
            print("OK")
        except Exception as e:
            print(f"FAIL ({e})")
            if not args.continue_on_error:
                return 1
        if args.sleep and i < len(files):
            time.sleep(args.sleep)

    return 0

def cmd_random_audio(args: argparse.Namespace) -> int:
    backend = args.backend
    audio_dir = Path(args.audio_dir)

    print("[random] Fetching houses...")
    houses = fetch_houses(backend)
    if not houses:
        print("No houses found!")
        return 1

    for i in range(args.count):
        house = random.choice(houses)
        house_id = house.get("house_id") or house.get("id")
        print(f"[random] Selected house_id={house_id}")

        devices = fetch_devices_for_house(backend, house_id)
        if not devices:
            print(f"[random] House {house_id} has no devices, skipping...")
            continue

        device = random.choice(devices)
        device_id = device.get("device_id") or device.get("id")
        print(f"[random] Selected device_id={device_id} (location={device.get('location')})")

        wav = pick_random_wav(audio_dir)
        print(f"[random] Selected WAV: {wav.name}")

        timestamp = iso_utc_now()

        print(f"[random] → ingest event ... ", end="")
        try:
            payload = post_ingest(backend, house_id, device_id, timestamp, wav)
            print("OK")
        except Exception as e:
            print(f"FAIL ({e})")

        if args.sleep:
            time.sleep(args.sleep)

    return 0

# HEARTBEAT
def post_heartbeat(
    backend: str,
    device_id: int,
    status: str | None = None,
    firmware: str | None = None,
    timestamp: str | None = None,
    timeout: int = 30,
) -> dict:
    
    url = f"{backend.rstrip('/')}/api/v1/devices/{device_id}/heartbeat"

    if status is None:
        status = "online"

    if timestamp is None:
        timestamp = iso_utc_now()

    payload: dict = {
        "status": status,
        "timestamp": timestamp,
    }

    if firmware:
        payload["firmware_version"] = firmware

    resp = requests.post(url, json=payload, timeout=timeout)

    try:
        body = resp.json()
    except Exception:
        body = {"raw": resp.text}

    if not resp.ok:
        raise RuntimeError(f"HTTP {resp.status_code}: {body}")

    return body

def cmd_heartbeat(args: argparse.Namespace) -> int:
    backend = args.backend
    interval = args.interval
    count = args.count or 0   
    status = args.status
    firmware = args.firmware

    if args.device_id is not None:
        target_devices = [args.device_id]
        print(f"[heartbeat] Using single device_id={args.device_id}")
    else:
        print("[heartbeat] Fetching ALL devices from backend ...", end=" ")
        devices = fetch_all_devices(backend)
        if not devices:
            print("no devices found!")
            return 1
        target_devices = [
            d.get("device_id") or d.get("id")
            for d in devices
            if d.get("device_id") or d.get("id")
        ]
        print(f"found {len(target_devices)} devices")

    if not target_devices:
        print("[heartbeat] No valid device IDs to send heartbeat to.")
        return 1

    beat_num = 0
    print(
        f"[heartbeat] Sending heartbeat to {len(target_devices)} device(s) "
        f"every {interval}s (count={count or '∞'})"
    )

    try:
        while True:
            beat_num += 1
            for device_id in target_devices:
                ts = iso_utc_now()
                effective_status = status or "online"
                print(
                    f"[heartbeat] #{beat_num} → device {device_id} "
                    f"status={effective_status}, fw={firmware} ... ",
                    end="",
                    flush=True,
                )
                try:
                    payload = post_heartbeat(
                        backend=backend,
                        device_id=device_id,
                        status=effective_status, 
                        firmware=firmware,
                        timestamp=ts,  
                    )
                    print("OK")
                except Exception as e:
                    print(f"FAIL ({e})")

            if count and beat_num >= count:
                break

            time.sleep(interval)

    except KeyboardInterrupt:
        print("\n[heartbeat] Stopped by user (Ctrl+C)")

    return 0

# Hearbeat Parser
def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Unified IoT Device Simulator (audio ingest + heartbeat)")
    p.add_argument("--backend", type=str, default=DEFAULT_BACKEND)
    sub = p.add_subparsers(dest="cmd", required=True)

    a = sub.add_parser("audio", help="Send WAV files to ingestion endpoint")
    src = a.add_mutually_exclusive_group(required=True)
    src.add_argument("--file", type=str)
    src.add_argument("--dir", type=str)
    a.add_argument("--house-id", type=int, required=False)
    a.add_argument("--device-id", type=int, required=True)
    a.add_argument("--timestamp", type=str)
    a.add_argument("--sleep", type=float, default=0)
    a.add_argument("--limit", type=int)
    a.add_argument("--continue-on-error", action="store_true")
    a.set_defaults(func=cmd_audio)

    ra = sub.add_parser("random-audio", help="Send a random WAV to a random house/device")
    ra.add_argument("--audio-dir", type=str, default="simulator/audio")
    ra.add_argument("--sleep", type=float, default=0)
    ra.add_argument("--count", type=int, default=1)
    ra.set_defaults(func=cmd_random_audio)


    hb = sub.add_parser("heartbeat", help="Send periodic heartbeat")
    hb.add_argument("--device-id", type=int, required=False)
    hb.add_argument("--interval", type=float, default=30)
    hb.add_argument("--count", type=int)
    hb.add_argument(
        "--status",
        type=str,
        default=None,
        help="Device status (defaults to 'online' if omitted)",
    )
    hb.add_argument(
        "--firmware",
        type=str,
        default=None,
        help="Firmware version (optional, will not be updated if omitted)",
    )
    hb.set_defaults(func=cmd_heartbeat)
    return p

def main(argv: Optional[list[str]] = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    return args.func(args)

if __name__ == "__main__":
    raise SystemExit(main())
