# Skills boundary — reserved

A Skill describes how to perform a category of work. A Tool is an executable operation. A Connector grants scoped access to an external account. A Capability is an ability available on a particular device/environment. A Playbook provides the detailed instructions for a Skill.

No registry or Skills UI is implemented in this milestone. Future manifests declare name/version, tools, capabilities, permissions, memory read/write and embodiment style. Skills are lazily loaded, provider independent, versioned, testable, permission aware and eval gated. Tool execution always goes through the capability gateway.

Feedback updates an explicit user preference through memory, or creates a reviewed candidate playbook revision through a feedback dataset and evaluations. No autonomous rewriting of production prompts. No marketplace or downloaded arbitrary executable code.
