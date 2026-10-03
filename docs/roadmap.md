# Milestone roadmap

Work stops after foundation and Avatar Lab. Later directories are boundaries, not completed features.

| Order | Milestone | Gate |
| --- | --- | --- |
| 1 | Foundation + Avatar Lab | Rive reliably renders; local life, pointer, affect, gestures and mouth respond; pure tests pass; native visual acceptance and human 30-minute soak recorded |
| 2 | Onboarding | Hebrew default; language/user/companion identity editable; optional context; separate permission explanations; durable profiles; companion appears only after completion |
| 3 | Desktop shell | Transparent pet and management panel; focus safety; drag/position persistence; multi-monitor safe; tray; hide/show; startup disabled by default |
| 4 | Mock conversation | Local sample audio; normalized events; lip sync; bilingual transcript; interruption measured |
| 5 | Realtime voice | Replaceable provider; Hebrew/English switching; streaming; reconnect; barge-in; sessions and latency |
| 6 | Screen awareness | Explicit approved capture through native gateway; visible indicator; ephemeral frame; normalized observation |
| 7 | Durable memory | Profile/facts/preferences/projects; correction and deletion; clean repository; no premature vector infrastructure |
| 8 | Skills | Small versioned registry; capability declarations; permission policy; evaluation gates |
| 9 | Connectors | Scoped web/search, calendar and email; consequential writes confirmed |
| Later | Polish and expansion | Original sonic identity, startup sequence, additional devices/renderers only after earlier gates |

## Readiness rule

Successful browser builds and pure logic tests are necessary but do not prove a polished native companion. The next milestone becomes ready only after the current Rive rig, native Windows build, one-minute perception-of-life check and 30-minute visual soak pass. The purpose-built developer rig is permitted for this gate; a finished production character design is a separate deliverable. Until validation results are recorded, status is **foundation ready for validation; onboarding gated**. Do not auto-advance to AI integration.

## Explicit exclusions

No GLB/Three.js character, Electron, AR/WebXR, mobile, Unity/Unreal, continuous webcam or cloud screen stream, arbitrary shell, unrestricted computer control, skill marketplace/download execution, autonomous production-prompt rewriting, payments, voice cloning, large connector catalog or elaborate cloud infrastructure. No copied JARVIS music, dialogue or assets.

For each future milestone: inspect architecture, update docs and ADRs, identify packages, implement, add appropriate tests, run lint/typecheck/tests/build, record manual checks and remaining issues. Never turn a skipped check into a passing result.
