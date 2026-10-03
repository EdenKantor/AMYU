# Vision boundary — reserved

No capture or inspection is implemented. Future `VisualContextProvider` adapters are desktop screen, active window and camera in that order. Windows capture uses native Rust/platform APIs; later macOS capture uses ScreenCaptureKit. Browser `getDisplayMedia` is not the long-term desktop design.

An explicit request passes through the capability gateway and permission engine, shows a visible capture indication, captures an approved source and passes an ephemeral frame to a replaceable `VisionProvider`. Its result is a normalized `SceneObservation`, not a provider SDK object. Audit metadata without persisting image content by default. Screen awareness can be disabled globally. Camera is optional, explicit and normally single-frame.

No continuous desktop/cloud stream, hidden recording or always-on camera is included.
