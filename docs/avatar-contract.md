# Semantic avatar contract

`@amyu/avatar-contract` owns the renderer-independent `AvatarController`. Consumers request conversational meaning through six methods and never address Rive parameters:

```typescript
interface AvatarController {
  setConversationState(state: ConversationState): void;
  setEmotion(emotion: Emotion, intensity: number): void;
  setGaze(x: number, y: number, weight?: number): void;
  setSpeechEnergy(value: number): void;
  triggerGesture(gesture: Gesture): void;
  setAwake(awake: boolean): void;
}
```

Conversation states are `idle`, `listening`, `thinking`, `speaking`, `acting`, and `sleeping`.

Emotions are `neutral`, `happy`, `excited`, `curious`, `concerned`, `surprised`, `empathetic`, `amused`, `focused`, and `confused`. Sleep is an awake/state behavior rather than an extra emotion.

Gestures are `wave`, `nod`, `shake_head`, `head_tilt`, `bounce`, `celebrate`, and `shrug`. Wake/sleep transition poses are private director behavior; consumers use `setAwake` rather than artwork-specific wake triggers.

## Value semantics

Emotion intensity and speech energy are finite normalized values in `[0, 1]`. Gaze is a normalized coordinate inside `[-1, 1]` on each axis; X grows rightward and Y grows downward in the stage coordinate system. Pointer projection is relative to the character stage and bounded. Consumers do not use pixels as semantic gaze.

The director interpolates between requested and displayed values. A high-intensity emotion must have a visibly stronger effect than a low-intensity instance of the same emotion. A new gesture is an edge-triggered request, not an instruction to restart it every frame. The lab reset is a director convenience, outside the six-method public controller contract; it clears transient speech, gestures and pointer reactions and returns to calm idle.

## Precedence

Explicit conversation state wins over local idle variation. `setAwake(false)` enters sleeping, suppresses speech and reduces life energy; waking restores the last awake conversation state. Speaking uses outgoing energy as its mouth clock. Pointer attention competes with local gaze only while active and returns gently toward idle after departure. Local reactions must not overwrite the selected lab emotion permanently.

The provider-facing language of the contract remains the same for a future mobile, 3D or AR renderer. Renderer-specific asset failures must report diagnostics and offer recovery without changing these semantics.

## Contract validation

Protocol schemas reject unknown discriminants, nonfinite/out-of-range values, and malformed payloads at ingress. Pure logic tests cover arbitration, transitions and value bounds. The Rive asset handshake introspects actual control names and types before reporting capabilities. Missing or mismatched controls are visible as `UNMAPPED`, downgrade the relevant capabilities and do not crash a renderable asset. Invalid files and absent artboards still surface a recoverable error.

`AvatarCapabilities` reports `supported`, `unsupported` or `unknown` for gaze, blink, continuous mouth, emotion blend, head control, visemes and each of the seven gestures. `createAvatarCapabilities` fills omitted or invalid declarations as unknown. Asset loading alone is not proof that a particular feature works. The lab introspection panel must show actual artboard/state-machine names and input names/types for an inspected file, including absent controls; a third-party data-binding rig must not be described as a state-machine-input rig.

See [Rive specification](rive-character-spec.md) for the mapping owned by the adapter and [embodiment](embodiment.md) for runtime behavior.
