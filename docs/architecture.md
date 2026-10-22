# Architecture

The project has four connected components.

1. **Scene construction.** Geospatial observations, reconstructed geometry and authored
   buildings/facilities are assembled and checked in Blender. Captures record the scene
   identity, source hashes and actual camera pose. Authored simulation details are not
   represented as surveyed facts.
2. **Native environment.** Unreal Engine runs the assembled city. The development adapter
   checks ground support, collision and camera clearance, executes motion and captures images.
3. **Task and evaluator.** Task text, scene binding, budgets, reference evidence and success
   checks are versioned together. Reset/start positioning is controlled by the evaluator.
4. **Agent.** A multimodal model receives the task and allowed observations, submits a command,
   and sees public action feedback. It cannot reset, teleport or inspect private scoring truth.

```text
Scene source → UE runtime ← evaluator start/reset and recording
                   ↕
             public agent adapter ↔ multimodal model
                   ↕
               public map
```

The public map is ordinary navigation information. A route suggestion is not proof of a
walkable connection or successful arrival; the native environment remains authoritative.
The project website's vector navigation sandbox is a separate demonstration, not the live
evaluation environment.

## Coordinates and capture

The current development conversion is Blender world metres `(x, y, z)` to UE centimetres
`(100*x, -100*y, 100*z)`. Coordinate conversion alone does not validate a start position.
Current captures target eye height 1.80 m above checked ground, horizontal FOV 90° and
1920×1080 pixels. Legacy images have their own provenance and conditions.

Task records distinguish building origins, sign centres, camera positions and arrival regions.
After a scene change, recheck support, clearance and visible evidence at reused positions.
Source hashes and exact runtime versions bind a task to its environment.

## Release boundaries

GitHub stores code and documentation. Hugging Face stores versioned data and scene artifacts.
The future portable runtime must provide an explicit adapter interface and platform requirements;
the current workstation command-queue adapter is not a stable public network API.
