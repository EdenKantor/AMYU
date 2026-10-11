# AMYU Pet Shell

The Pet Shell is the desktop product surface. It uses the current Friendly Floating Bot Rive asset and the existing embodiment architecture. Avatar Lab remains a secondary development surface with diagnostic controls; those controls are not part of the normal pet UI.

## Entry points

| Surface | Entry point | Purpose |
| --- | --- | --- |
| Native Pet Shell | `pnpm dev:desktop` or the packaged AMYU executable | Compact floating desktop presence |
| Pet browser preview | `pnpm --filter @amyu/desktop dev`, port 1420 | Frontend layout and interaction checks; explicitly labeled preview |
| Native Avatar Lab | Pet options → Avatar Lab · DEV | Separate decorated developer window |
| Desktop frontend lab route | `http://127.0.0.1:1420/?mode=lab` | Same developer surface without mixing lab CSS into the pet |
| Standalone browser lab | `pnpm dev`, port 5173 | Existing avatar audit and visual review workflow |

The desktop entry point selects the product or lab route. Lab UI and styles load separately. `PetSession` owns product state; it does not reuse lab demonstration/session controls. The native `open_avatar_lab` command opens or focuses the separate lab window.

## Presence and controls

The native pet is configured as transparent, frameless, always-on-top and resizable. Default size is **360 × 460 logical pixels**, with normal minimum **300 × 360** and maximum **560 × 700**. The robot occupies the central space and scales with the window; the small composer and status remain attached below it. No large dashboard or raw sliders appear in the product view.

Use the top handle to move the window. Use the bottom-right grip for real Windows resize dragging. The menu's S/M/L presets provide another resize route, including keyboard use. In browser preview these presets and the grip change preview dimensions only; movement, minimize and close remain native-only.

The chat icon shows/hides the composer. Escape closes the menu first, or hides the composer. The menu also offers sleep/wake, a short acting demo, the developer lab, minimize and close. The taskbar entry provides a way to recover a minimized pet; this milestone does not add a tray service or launch-at-login registration.

## Composer and state flow

The composer has a text input, send action and microphone placeholder. It accepts up to 500 characters and ignores whitespace-only submissions. Text is local session state; this milestone does not save a transcript or send messages to any AI service.

Focusing or editing the composer enters listening. Sending clears the draft and starts a silent local sequence:

| Time after send | Semantic state | Product behavior |
| --- | --- | --- |
| 0–550 ms | Listening | Brief receipt/attention cue |
| 550–1,750 ms | Thinking | Authored thinking composition |
| 1,750–5,300 ms | Speaking | Silent speech envelope and explicit local placeholder reply |
| After 5,300 ms | Idle | Speech energy cleared; placeholder can be dismissed |

The reply says that this is a local demo and real conversations come later. The persistent note states **Local demo · No AI or audio connected**. Timings advance with bounded animation frames; a hidden/suspended window does not race through a wall-clock catch-up sequence.

Typing again interrupts the active mock flow. Sleep, wake, acting and avatar clicks cancel prior activity and clear speech energy. The acting demo lasts about 2.6 seconds and states that no task is being run. Sleeping can be ended through the menu, composer interaction or a click on the robot. Clicking the microphone only explains that voice is unavailable; it requests no microphone permission.

## Runtime and native boundary

`PetSession` drives `EmbodimentDirector`, retaining `AvatarController` and local-life behavior. `RiveAvatarRenderer` draws the existing source asset. Rendering uses one animation loop, a resize observer, bounded frame deltas, reduced-motion preference handling and teardown for the renderer/session. A failed renderer offers retry instead of showing a functioning fake avatar.

Rust owns the pet window and geometry persistence. Position is stored in physical desktop pixels and size in logical pixels. Restoration validates the saved schema, bounds dimensions, chooses an available monitor by overlap, and clamps the window to that monitor's work area. Missing/invalid data or an unavailable saved monitor falls back to a visible primary-display position. An exceptionally small work area may reduce the normal minimum so the window remains recoverable.

Native permissions are limited to the pet's required window actions, fixed diagnostic metadata and opening Avatar Lab. The shell has no arbitrary executable capability. See [native validation](native-validation.md) for the actual build/launch record and persistence implementation details.

## Known limitations and acceptance

- The robot remains attributed third-party prototype art. Listening resembles a greeting; thinking and acting share a prop; speech has a small coupled mouth/arm route; sleeping freezes the body. Idle uses authored float/blink motion, not newly independent breath or eyelid controls.
- Reduced motion reduces the main pose and speech motion, but some authored nested props can continue moving. Independent gaze, head-follow, mouth aperture and blink scheduling are unsupported.
- The window's transparent rectangular region is not dynamic click-through. The dedicated handle/grip are the supported drag/resize affordances.
- The compact pet controls are currently English; input uses automatic text direction. Avatar Lab retains its existing Hebrew/English tools.
- Browser screenshots demonstrate layout and canvas rendering only. Native transparency, always-on-top, focus behavior, drag/resize, DPI changes and restart persistence need recorded native acceptance.
- Installer signing, tray behavior, startup registration, real AI/audio, onboarding and production character design are outside this milestone.

See [manual acceptance](../tests/manual-acceptance.md) for completed and pending checks, [Windows builds](windows-build.md) for artifact instructions, and [avatar review](avatar-deep-review.md) for the source character's visual evidence. Do not treat a successful test or configured window flag as proof of desktop appearance.
