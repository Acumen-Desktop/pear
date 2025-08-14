# FAP Daemon ↔ GUI IPC schema (MVP)

Local IPC between Tauri GUI and Rust Daemon.

## Transport
- Unix socket (macOS), named pipe (Windows)
- JSON Lines envelopes; binary streams bound by stream_id for room updates

## Envelope
{ id, type: request|response|event, cmd, ok?, error?, data?, stream_id? }

## Commands
- identify → { platform_id, version }
- start(link) → events: progress{phase,file?,pct?}, ready{app_id,entry}
- get_manifest(app_id) → Manifest
- open_room(room) → { stream_id }
- send_update(room, payload)
- subscribe_room(room) → events: room_update{payload}, room_awareness{payload}
- close_room(room)

## Errors
- { ok:false, error:{ code, message } }

## Flow: start
1) GUI start(link)
2) progress(resolve)
3) progress(fetch..., pct)
4) ready(entry)

