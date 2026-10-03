# ADR 0002 — Rive instead of GLB for Desktop V1

Status: accepted.

The V1 desktop character uses Rive. A purpose-built developer artboard validates the final semantic contract and is replaceable by an original production asset. A GLB facial morph pipeline, skeletal marketplace assumptions, Three.js and expression-image swapping would add an unsuitable dependency to the first milestone.

Consequence: the renderer adapter owns asset-specific binding and lifecycle. Rig capabilities and artwork provenance must be documented. The production art effort is separate from core logic, and a later 3D renderer can implement the same contract.
