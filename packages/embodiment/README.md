# Embodiment

The director implements the semantic avatar contract. Seeded local life owns blinking, breathing, gaze drift and posture independently from conversation. `tick(deltaMs)` smooths semantic intent into a physical frame. Each frame owns copies of its weights and gaze.

Timing uses elapsed milliseconds, not frame counts. Deltas are capped at 64 ms after suspension to avoid a large visual jump; missing background time is deliberately not replayed. Local random events are scheduled with jitter, gestures have a bounded queue, and all outputs remain finite and bounded. Reduced motion preserves eye contact and blinking while reducing body motion.

Implementation plan: keep random life in `local-life.ts`, combine intent and pose in `director.ts`, and validate semantic transitions, seeded replay, bounded gesture pressure, interruption and a simulated 30-minute run with pure tests. No network, browser timers, provider or renderer dependency is needed.

The research addendum is applied to the semantic API: six conversation states, ten emotions, seven gestures, weighted `setGaze(x, y, weight?)` and `setAwake(awake)`. Sleep/wake timing is private local behavior rather than a public gesture. `GazeController` uses a 0.035 dead zone, an eye range of 0.9, 90 ms eye response, 320 ms head response with 0.28 head weight, and 240 ms neutral return. Seeded idle attention breaks occur every 6–11 seconds for 650–1300 ms; conversation attention remains direct. These are behavior timings, independent of how an asset renders the pose.
