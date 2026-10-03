# Permission boundary — reserved

Future policy runs in code, outside prompts. The reserved interface returns `allow`, `ask` or `deny` with a reason and relevant permission. Skill manifests use `confirm` for a confirmation requirement; a future policy adapter normalizes that declaration to engine `ask`. A requested operation has a capability, intent and consequence classification. Do not implement a default-allow stub while the real engine is absent.

Microphone, screen awareness and camera must be separately explained and controlled. Screen/camera capture is explicit; cloud account scopes are revocable. Consequential external writes (including calendar creation and sending email) require confirmation tied to the concrete action. A prompt, Skill manifest or model response is not authorization by itself.

The Tauri lab uses its own minimal ACL; the product permission engine is not active yet. See [security](security.md).
