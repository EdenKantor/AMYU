# Protocol

Discriminated semantic events are validated with Zod at trust boundaries. Every event has a monotonic millisecond timestamp supplied by its producer. The synchronous typed bus isolates listeners and snapshots subscribers during emission. Observation and memory payloads define future boundaries only; this milestone implements neither capture nor memory.
