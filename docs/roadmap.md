# Milestone roadmap

Current milestone: **Windows Native Desktop Pet Shell**, following the user's revised direction. The main product is a compact floating pet with a composer; Avatar Lab remains a separate developer surface. This direction supersedes the previous requirement to finish avatar selection before doing native shell work. It does not grant final visual approval of the prototype robot or authorize onboarding and providers.

| Stage | Scope | Gate |
| --- | --- | --- |
| Foundation — retained | Renderer-independent avatar contracts, deterministic embodiment and local life, original source provenance | Existing boundaries and tests remain intact |
| Avatar research — retained | Friendly Floating Bot is the current soft robot prototype; A is historical and C was rejected | Known visual limitations remain documented; final artwork approval is separate |
| **Windows Desktop Pet — current** | Tauri Pet Shell, compact composer, six semantic states, local silent mock flow, drag/resize, saved geometry, separate lab, native packaging and Windows CI | Native build and launch evidence; actual pet interaction/visual acceptance; clear local 4551 status; GitHub push and user review |
| Native acceptance and polish — recommended next if any current checks remain pending | Test the built artifact on an authorized Windows 11 desktop; verify transparency, focus, drag/resize, restart persistence, monitor/DPI changes and production resources | Close the remaining manual acceptance items without treating browser or CI checks as desktop proof |
| Onboarding — paused | Hebrew default, editable identities, optional context, separate permissions and durable profiles | Explicit user approval to start this stage |
| Conversation integration — paused | Replace the local demo with normalized provider events, audio boundaries and interruption behavior | A separately approved scope; retain renderer independence and truthful connection state |
| Realtime voice — paused | Replaceable provider, Hebrew/English switching, streaming, reconnect, barge-in and latency | Permission and performance acceptance |
| Screen awareness — paused | Explicit capture, visible indication, ephemeral frames and normalized observations | Separate capture/permission review |
| Durable memory — paused | User-correctable profiles, facts, preferences and projects with deletion | Separately approved data model and persistence |
| Skills and Connectors — paused | Versioned capability declarations, scoped integrations and permission policy | Separate functional and consequential-action acceptance |
| Later polish | Original character and sonic identity, tray/startup choices, additional renderers or devices | User-approved priority after the earlier gates |

## Current acceptance rule

October 13 evidence: Windows CI compilation, 11 Rust tests, EXE/NSIS packaging and process smoke passed. The downloaded EXE runs locally; composer flow, drag, L size preset, saved geometry after restart, sleep/wake and separate lab were observed. Local compilation still hits 4551. Grip resize, foreground always-on-top, taskbar recovery, remaining native interaction stress, monitor/DPI hardware cases and sustained native review remain open. The next recommended scope is **Windows Pet acceptance and polish**, subject to the user's decision.

The native app must open the **Pet Shell** by default, render and animate the robot, accept text in the compact bar, and demonstrate listening → thinking → speaking → idle. Acting and sleeping must also be available in the product shell. Dragging, real native resizing and restoration after restart require native acceptance; a browser layout check is useful but insufficient.

Build tests establish code and packaging health. A CI process launch establishes only the observations recorded for that run. Neither substitutes for a manual desktop review. Track exact evidence in [native validation](native-validation.md), [build report](build-report.md), and [manual acceptance](../tests/manual-acceptance.md). Preserve the historical 4551 record; fix repository issues and use Windows CI while respecting host policy.

Do not replace the mascot during this milestone without an actual blocker. The current authored asset still has limited speech, greeting-like listening and a still sleeping pose. These are disclosed in the [avatar review](avatar-deep-review.md), not hidden by state labels.

## Explicit exclusions

No onboarding, real AI provider, microphone streaming, TTS, memory, vision, Skills, Connectors, AR/mobile, or full tray ecosystem is included in this milestone. No copied OpenAI mascot, logo or proprietary UI artwork. No arbitrary shell execution, unrestricted computer control or security-policy bypass.

After the native pet milestone is pushed and reported, **stop and wait for the user's approval**. Any unfinished native acceptance remains visible rather than being converted into a passing result.
