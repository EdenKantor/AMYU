# ADR 0007 — Permissions are enforced outside prompts

Status: accepted; Tauri lab ACL implemented, product engine reserved.

Every future action passes through one capability gateway and a policy engine in code. Model prompts, external inputs and Skill text are untrusted as authorization. Consequential writes require a concrete confirmation. Secrets stay in native/backend storage.

Consequence: absence of the policy engine means absence of executable capabilities, never a default-allow stub. The lab grants only metadata diagnostics to its one local window and has no arbitrary shell, capture or connector operation.
