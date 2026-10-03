# Conversation boundary — reserved

Realtime conversation is intentionally not implemented. `packages/conversation` defines a provider-independent lifecycle and normalized events. `providers/mock-live`, `gemini-live`, and `openai-live` are reserved; none connects or emits simulated speech in the Avatar Lab milestone.

Future normalized events include user speech start/end, assistant thinking/speech start/audio/end, user/assistant transcript, tool request, provider error and language change. Provider SDK objects stay within adapters. The core personality is warm, observant, concise, lightly playful and comfortable with silence.

Preferred language defaults to Hebrew for greetings/UI/ambiguous first interactions. Current conversation language follows the user's Hebrew or English naturally, even after a switch. Realtime voice is the low-latency path; longer agent tasks use a separate cancellable task path. Affect runs alongside speech and must never delay audio.

Barge-in must stop/duck audio quickly, zero mouth energy, change to attentive listening and cancel provider generation where supported. Instrument the stop latency with real measured samples before claiming readiness.
