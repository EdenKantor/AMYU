# ADR 0008 — Realtime voice and complex tasks use separate paths

Status: accepted for later milestones; neither path is implemented.

Realtime voice prioritizes audio latency, continuous session lifecycle and immediate barge-in. Long tasks require permission checks, progress, cancellation and durable task status. Couple them through normalized events and semantic activity rather than blocking the realtime audio path.

Consequence: affect interpretation runs in parallel and animation follows audio. Tool execution cannot hold up speech playback. Task providers and voice providers can change independently.
