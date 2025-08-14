# FAP Room Protocol (real-time collaboration)

QUIC-based real-time protocol for rooms (docs, whiteboard, chat).

## Transport
- One QUIC connection; stream per room
- Length-prefixed frames; control (CBOR/JSON), binary for Y updates

## Messages
- join, part, state_vector, update, awareness, snapshot_announce, snapshot_request, snapshot_chunk, error
- Envelope: { type, room, cid?, seq?, payload?, meta? }

## Flows
- Join: join → state_vector ↔ update until synced
- Awareness: periodic broadcasts; expire stale entries
- Live updates: update frames; dedupe by sender+seq
- Snapshots: announce → request → chunked transfer → install

## Backpressure & reliability
- QUIC per-stream flow control; drop awareness first on pressure; retransmit missing chunks

## Discovery & security
- MVP: static peers/relays; later DHT/discovery
- Post-MVP: X25519 encryption; signatures on snapshots; join tokens

