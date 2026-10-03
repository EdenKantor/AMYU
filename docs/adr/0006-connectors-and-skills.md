# ADR 0006 — Connectors are distinct from skills

Status: accepted for a later milestone; not implemented.

A Connector controls scoped access to an external account/service. A Skill describes a task that may use several connectors/tools. Cloud accounts belong to the AMYU account while capabilities belong to a device.

Consequence: authorization can be revoked independently of a Skill. Provider/core interfaces do not contain Gmail/Calendar SDK objects. The first later connectors are web/search, Calendar and Gmail; consequential writes remain confirmation gated.
