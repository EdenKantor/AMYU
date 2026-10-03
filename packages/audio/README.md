# Audio

The amplitude lip-sync driver consumes outgoing PCM RMS and has configurable attack/release smoothing, a noise gate and saturation. Playback is always the clock; animation does not schedule audio. A Web Audio adapter reads an existing playback analyser without requesting microphone access. A future viseme driver can replace the same sample/reset boundary. There is no voice provider or playback service in this milestone.

`VisemeIndex` reserves values 0–14. `VisemeLipSyncDriver` is an interface only; no advanced viseme implementation or external viseme-kit dependency is included.
