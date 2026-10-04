# Milestone roadmap

Current milestone: **Avatar Correction / Replacement**. The user has not accepted the avatar's visual quality. Foundation and architecture remain useful; the immediate work is real researched artwork, readable conversation states and dynamic visible speech. Onboarding is paused.

| Order | Milestone | Gate |
| --- | --- | --- |
| 1 | Foundation / architecture / avatar runtime | Existing boundaries and tests retained; generated artwork rejected for product quality |
| 2 | Avatar Correction / Replacement — current | Actual downloaded researched `.riv`; inspect controls; visible idle/listening/thinking/speaking; 8s silent speaking demo and 15s state demo; attribution; ten screenshots; user visual approval |
| 3 | Onboarding — paused | Starts only after explicit user avatar approval; Hebrew default, editable identities, optional context, separate permissions and durable profiles |
| 4 | Desktop shell | Transparent pet and management panel; focus safety; drag/position persistence; multi-monitor safe; tray; hide/show; startup disabled by default |
| 5 | Mock conversation | Local sample audio; normalized events; lip sync; bilingual transcript; interruption measured |
| 6 | Realtime voice | Replaceable provider; Hebrew/English switching; streaming; reconnect; barge-in; sessions and latency |
| 7 | Screen awareness | Explicit approved capture through native gateway; visible indicator; ephemeral frame; normalized observation |
| 8 | Durable memory | Profile/facts/preferences/projects; correction and deletion; clean repository; no premature vector infrastructure |
| 9 | Skills | Small versioned registry; capability declarations; permission policy; evaluation gates |
| 10 | Connectors | Scoped web/search, calendar and email; consequential writes confirmed |
| Later | Polish and expansion | Original sonic identity, startup sequence, additional devices/renderers only after earlier gates |

## Readiness rule

Automated tests and telemetry do not decide visible avatar quality. The current milestone remains **not accepted** until real third-party artwork is integrated and the user approves it visually. The user must distinguish listening, thinking and speaking without labels and accept the mouth/talking motion. A negative answer for any of those behaviors keeps the milestone incomplete.

Browser Avatar Lab is sufficient for this corrective selection. Native Windows error 4551 remains recorded in [native validation](native-validation.md); do not spend this milestone bypassing or solving it. Native runtime and long-session desktop acceptance remain later validation work. Do not generate another mascot or redesign the old developer rig. Candidate order is Expressive Floating Character Rig, AI Orb Mascot, then Interactive Character Rig. Candidate B was actually inspected in scratch and not integrated because no mouth/talking clip or energy control was exposed. Candidate A remains preferred, with its native mouth-only Listening limitation and AMYU-composed attention cue requiring human review. Stop after presenting screenshots, repeatable demo instructions and the current results for human review. Do not begin onboarding until the user explicitly approves the avatar.

## Explicit exclusions

No GLB/Three.js character, Electron, AR/WebXR, mobile, Unity/Unreal, continuous webcam or cloud screen stream, arbitrary shell, unrestricted computer control, skill marketplace/download execution, autonomous production-prompt rewriting, payments, voice cloning, large connector catalog or elaborate cloud infrastructure. No copied JARVIS music, dialogue or assets.

For each future milestone: inspect architecture, update docs and ADRs, identify packages, implement, add appropriate tests, run lint/typecheck/tests/build, record manual checks and remaining issues. Never turn a skipped check into a passing result.
