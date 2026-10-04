# Rive avatar renderer

The default renderer uses the downloaded, unmodified **Expressive Floating
Character Rig (Old Work Share)** by **kouidero**, licensed **CC BY 4.0**.
Source: https://rive.app/marketplace/25311-47232-expressive-floating-character-rig-old-work-share/
License: https://creativecommons.org/licenses/by/4.0/
The adapter changes playback only; the third-party binary is not modified.

This real file has one artboard (‘Artboard’), one state machine (‘State Machine 1’),
two boolean inputs (‘isTalking’, ‘isListening’), eighteen authored animations, and no
ViewModels. Runtime metadata comes from actual decoder objects. State/layer
enumeration and binding targets remain explicitly unknown because this runtime
cannot enumerate them.

The application supplies semantic AvatarFrame snapshots. expressiveFloatingRig
maps listening/talking to the native booleans and uses real authored animation
instances for Thinking, Waving, a resting mouth, a limited smile, graded talk
animation energy, and open/closed eyes. Speech energy zero always restores the
authored resting mouth. Graded speech is animation mixing, not an exposed numeric
jaw control or viseme rig. Ten distinct continuous emotion expressions, gaze,
head rotation, and six unsupported gestures are not claimed.

RiveAvatarRenderer.create(canvas, options) loads matching local WASM and artwork.
The caller owns the animation clock; render(frame, deltaMs), resize(), and
dispose() manage drawing and WASM resource lifetime. SM and animation diagnostics
are separate: getMappingDiagnostics(frame) and getAnimationMappingDiagnostics(frame).
Pure diagnoseMappings / diagnoseAnimationMappings also work without a mounted
canvas. Optional missing controls or clips are reported UNMAPPED and skipped;
invalid artwork or a missing artboard produces a recoverable load error.

Supply an assetUrl and RiveRigAdapter to replace the character. Typed optional
animation mappings allow authored clips without changing providers, director, or
semantic contracts. Animation instances are created only for verified names and
deleted on dispose. createProductionRig remains a parameterized target for a
future AMYU_Main rig; its visual capabilities are unknown until tested. The
original developer rig remains only a development/test fixture.

Tests execute the real WASM decoder, inspect actual input types, apply the actual
clips, and capture emitted Canvas2D vector commands. They check quiet speech,
graded speech, smile, eyes, thinking, wave, and missing mappings. These tests do
not substitute for browser pixel review or a real-time resource-use acceptance run.

The adapter supplies optional framing bounds for presentation. These crop excess
blank artboard space with uniform Fit.contain scaling, based on actual transformed
Canvas2D path measurements across authored clips. The binary, including its
background, remains unchanged; generic adapters default to the artboard bounds.

Authored idle is reapplied before the native state machine and overlays so pose
properties return to rest after Thinking or Waving. The adapter explicitly loops
selected clip work ranges. Mouth-talk replays its existing open segment (30–60%
of the authored work range) at a matching half-second cadence; speech energy
controls the blend strength and zero always restores the normal mouth. The
Listening clip only provides a subtle mouth contour; it has no authored head,
hand, or eyelid pose. This asset cannot provide strongly distinct listening
body language without additional artwork or selecting a different asset.

The final adapter composes Listening by holding an existing Waving arm-raise
frame (30% of its work range, 80% blend) alongside the native listening boolean
and authored Listening mouth contour. This is an AMYU playback composition,
not a native Listening posture. The authored idle baseline is also reasserted
after native SM application so its independent clock cannot retain overlay poses.

Thinking, Talking, and Waving also restore their own authored start poses before
the idle baseline. Talking keys arm-path deformation and body translation that
the idle clip does not key; simply skipping a zero-weight overlay is insufficient.
