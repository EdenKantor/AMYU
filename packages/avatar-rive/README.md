# @amyu/avatar-rive

Rive Canvas WASM renderer and replaceable development rig adapter.
The caller creates it asynchronously, advances the director, renders each
`AvatarFrame`, resizes the canvas, and disposes the renderer on unmount.
The matching WASM and `.riv` are bundled locally by Vite.

```ts
const renderer = await RiveAvatarRenderer.create(canvas, { signal });
renderer.resize();
renderer.render(director.tick(deltaMs), deltaMs);
renderer.dispose();
```

The real development Rive state machine owns 23 continuous blend layers. Only the
adapters know artwork input names. The development character is original and has no
external raster assets or fonts. Rive load failures and mismatched inputs are
reported instead of falling back to a different character renderer.

Missing optional inputs and type mismatches are reported as `UNMAPPED` and
skipped. Invalid files and missing artboards produce recoverable load errors.
`renderer.assetInfo` reports actual artboards, state machines, typed inputs,
animations, ViewModels and their properties. Complete state lists and binding
targets remain explicitly unknown because the pinned runtime cannot enumerate
them. `renderer.mappingDiagnostics` and the pure
`diagnoseMappings(adapter, discoveredInputs, frame)` helper expose current values
and missing controls. Capability support is tri-state and downgrades when
inspected controls do not satisfy the adapter's requirements.

`createProductionRig()` defines the separate parameterized `AMYU_Main` target:
18 number inputs (including emotion index), 5 booleans, and 10 triggers.
This is a mapping specification with unverified capabilities, not a bundled
production asset. Supply inspected names through its `mapping` configuration.
Tests exercise a second mapping without changing a core frame, missing
features, type mismatches, and actual WASM number/boolean/trigger discovery.

Runtime implementation follows the official [low-level API workflow](https://rive.app/docs/runtimes/web/low-level-api-usage).
The binary writer uses the official [generated schemas](https://github.com/rive-app/rive-runtime/tree/main/include/rive/generated)
and [runtime header](https://github.com/rive-app/rive-runtime/blob/main/include/rive/runtime_header.hpp).
The writer is specific to this rig and the installed runtime. Production art
should be authored and exported from the Rive editor, then checked against its
own adapter contract.
