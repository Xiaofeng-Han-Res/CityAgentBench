# Data and scene resources

| Resource | Location | Contents |
| --- | --- | --- |
| Project and collaboration | [GitHub](https://github.com/Xiaofeng-Han-Res/CityAgentBench) | Source, docs, issues, PRs and checks |
| Tasks | [HF Dataset: CityAgentBench-tasks](https://huggingface.co/datasets/haxiaofeng/CityAgentBench-tasks) | Historical task/image preview; future versioned task releases |
| Scene resources | [HF Dataset: CityAgentBench-scenes](https://huggingface.co/datasets/haxiaofeng/CityAgentBench-scenes) | Resource card and manifest; full scene package pending |

Blender/UE three-dimensional models are **scene assets**, so they belong in a Dataset resource
repository. Neural-network weights belong in a Model repository when a specific checkpoint
is ready for release. No neural checkpoint repository is required merely because scene files
are called “models”. A Space is optional for a hosted demo; it is not needed for file downloads.

## Task preview

```bash
python -m pip install huggingface_hub
hf download haxiaofeng/CityAgentBench-tasks --repo-type dataset   --local-dir downloads/CityAgentBench-tasks
python3 -B scripts/verify_task_preview.py downloads/CityAgentBench-tasks
```

The dataset uses an ImageFolder layout with original PNGs and `metadata.jsonl`, allowing
the Hub to show images beside questions. Its `legacy_preview` split is historical,
not a train/validation/test benchmark split. The manifest lists every published file's size
and SHA-256. Use a pinned Hub revision for repeatable downloads.

## Planned complete release

Publish related but separately versioned components:

- **Task bundle:** stable task IDs, English prompts, response contract, initial images,
  protocol/scene versions, review state and explicit split membership.
- **Environment bundle:** matching runtime application or UE project, scene assets,
  configuration, startup instructions, dependency list and verification manifest.
- **Evaluator materials:** start binding, arrival predicates, scoring and reference-route
  evidence; keep hidden-test truth outside agent inputs and public static serving roots.
- **Optional result bundle:** redacted trajectories, observations and explicitly labelled
  reference/model/replay videos for a declared run.

Use development splits with clearly identified public answers when useful for debugging.
Hidden-test truth belongs in separate restricted evaluator storage. A gated public dataset
still gives approved downloaders its contents, so gating is not a hidden-answer boundary.

Each release should bind `code_commit`, `protocol_id`, `task_revision`, `scene_revision`,
`scene_sha256`, artifact checksums and a compatibility note. Large scene archives can be
split into independently named parts, with exact restoration order and SHA-256 checks.
Do not upload engine caches, redundant scene histories or credentials as project assets.

See [HF dataset cards](https://huggingface.co/docs/hub/datasets-cards),
[image datasets](https://huggingface.co/docs/hub/datasets-image), and
[large repository guidance](https://huggingface.co/docs/hub/repositories-recommendations).
