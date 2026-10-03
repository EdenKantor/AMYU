# Capability boundary — reserved

All future executable actions flow through one capability gateway. Models do not call native OS APIs directly. A device capability descriptor identifies an operation, availability and permission requirement; account connector identity is separate.

Desktop capabilities may later include screen/window capture, files, applications, clipboard, notifications, cursor, microphone and camera. Mobile capabilities and cloud accounts are separate scopes. The current Rust lab diagnostic reads only fixed metadata; it is not a general capability executor.
