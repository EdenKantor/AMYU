# Deterministic embodiment

The embodiment package turns semantic intent and local observations into a living character independently of an AI model. The `EmbodimentDirector` orchestrates local life, state targets, affect, speech and pointer attention, then commits a snapshot through the semantic controller.

## Time and randomness

Use an injected monotonic clock and seeded random source for reproducibility. Frames advance through elapsed time rather than a fixed increment per render. Bound a large elapsed delta when resuming a hidden tab; do not fast-forward gestures or spin an unbounded catch-up loop. Reduced motion should attenuate posture/micro movement while retaining understandable state and mouth feedback.

Blink intervals vary within calm bounds. Breathing is subtle and continuous. Eye saccades, posture changes and idle head movement have independent bounded schedules. The same visible idle sequence should not restart every N seconds. A seeded run can be replayed for a defect without making every user's idle cycle identical.

## State and attention

State transitions update targets, with smooth convergence of head, body, eye and face values. Listening favors attentive posture; thinking uses measured gaze/motion; speaking follows outgoing energy. Sleeping closes or lowers the eyes and reduces life motion. The six public states contain no provider-connectivity state. `setAwake(false)` sleeps and `setAwake(true)` restores the last awake state; private wake/sleep body poses do not add public gesture names.

The pointer is measured locally within the lab stage. A separate `GazeController` gives pupils a 90ms response and the head a slower 320ms response with weight 0.28. Eye range is bounded to 0.9 and head range to 0.35. A radial dead zone of 0.035 prevents small center jitter. When attention clears, eyes ease toward neutral over a 240ms response instead of snapping.

During idle pointer tracking, seeded attention breaks occur after 6–11 seconds, last 650–1300ms and reduce pointer weight to 0.22. This allows the character to briefly look elsewhere rather than staring mechanically at the cursor. The director supplies local neutral/saccade targets and retains controlled randomness.

Hover adds curiosity/anticipation. Click adds a brief contextual reaction; repeated clicks can add a bounded playful reaction. On departure, attention decays and local life regains control. Global desktop cursor tracking, dragging and persisted native position belong to the desktop shell milestone.

The seven public gesture requests are one-shot. They compose with state and return toward the underlying pose. Speech energy is normalized, follows outgoing audio and resets on sleep; the lab reset clears transients. `AvatarFrame` records both `awake` and `speechEnergy` without leaking any Rive control name. LLMs will eventually supply semantic affect and intent, never per-frame numeric rig values.

## Audio and observability

The local audio package computes RMS from PCM and normalizes it. Attack/release smoothing follows the signal. The UI's manual speech-energy control tests the same output contract. A local audio demonstration, if enabled, must require a user gesture before browser playback. A future `VisemeLipSyncDriver` remains a typed pluggable boundary; no viseme timeline is implemented or advertised as supported by the developer rig. Any future scheduler follows the audio's adaptive clock and returns to silence on stop.

The lab shows measured FPS/frame time, semantic state, affect, gaze, last gesture and bounded event history. Avatar-state and affect latency measure intent to the next director frame in `LabSession.tick`; they stop before Rive applies or draws that frame and can be collected while the renderer is unmounted. They do not measure completed rendering or emotion classification. Rive advance/draw timing is recorded separately. Future speech/provider/vision/tool metrics have reserved names but should display as unavailable until real samples exist. An empty metric must not be presented as zero latency.

## Tests and acceptance

Pure tests should verify bounds, deterministic replay, smooth transition convergence, pointer decay, sleep/reset semantics, gesture lifecycle and attack/release response. Visual review checks that those mathematically correct signals still look calm and expressive in the actual Rive artwork. Automated frame stepping does not satisfy the human 30-minute quality criterion.
