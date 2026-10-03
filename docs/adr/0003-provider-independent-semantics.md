# ADR 0003 — Provider-independent avatar semantics

Status: accepted.

Conversation and local inputs request state, emotion/intensity, gaze, gesture and speech energy. The deterministic director resolves those meanings and the Rive adapter maps the result to artwork controls. No provider or conversation package knows Rive input names.

Consequence: artwork and model providers can change independently. Local life continues without a network session; future renderers reuse the controller. Tests can assert semantic transitions without loading Rive or a provider SDK.
