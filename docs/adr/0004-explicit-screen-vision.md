# ADR 0004 — Explicit, on-demand screen vision

Status: accepted for a later milestone; not implemented.

Screen understanding has priority over continuous camera vision. A user request passes through native capture permission, produces a visible indication and captures an approved screen/window. Frames are ephemeral by default; audit only metadata. Camera is separate, explicit and secondary.

Consequence: no continuous cloud screen stream, background recording or hidden camera capture. Windows and later macOS implementations remain platform adapters behind normalized visual context/inspection contracts.
