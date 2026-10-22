# CityAgentBench

**Urban reconstruction and embodied-agent evaluation in Shenzhen.**

[Project page](https://xiaofeng-han-res.github.io/CityAgentBench/) ·
[中文介绍](docs/README.zh-CN.md) · [Evaluation](docs/evaluation.md) ·
[Data and scene downloads](docs/resources.md) · [Contributing](CONTRIBUTING.md)

![Reconstructed Shenzhen urban scene](site/assets/hero.webp)

CityAgentBench studies how multimodal agents understand and move through a reconstructed
city. The project connects geospatial data and Blender scene construction, an Unreal Engine
environment, a public map, and tasks that require observation, action and verifiable arrival.
Its working area includes Shenzhen Talent Park, the Chunsun commercial district and the
Chuncan sports venue and surrounding streets. CityAgentBench remains a working project name.

This repository is the entry point for understanding the project and contributing to its
development. The project website presents scenes and demonstrations; Hugging Face carries
versioned data and larger scene resources. The public runtime release is being prepared.

## What is available

| Component | Available now | Status |
| --- | --- | --- |
| Project website | Bilingual overview, native videos, city atlas, map/navigation demonstration | Published; website source in `site/` |
| Historical task preview | 35 English L1 prompts and 35 original 1920×1080 images | Development preview; no official test split or public answers |
| Evaluation documentation | Actions, observations, task review, scoring, experiment records | Describes the current development protocol |
| Reference answer/arrival scorer | Dependency-free Python module and focused tests | Extracted from the development pilot; not a released benchmark |
| Portable UE environment and agent runner | Release work tracked in the roadmap | Not yet distributed as an install-and-run package |
| Full city scenes | Resource card and intended artifact organization | Scene binaries and dependencies pending packaging/acceptance |

The 35-image preview preserves the **September 28 static, single-image condition**. Current
L1 development permits movement; L2 requires actual arrival. These are separate protocol
versions and their scores must not be pooled. The preview is not the current saved193 test set.

## Explore and start contributing

1. Visit the [project page](https://xiaofeng-han-res.github.io/CityAgentBench/) for the scene,
   acquisition examples and interactive map. The browser map demo does not drive the UE agent.
2. Read [architecture](docs/architecture.md) and [evaluation](docs/evaluation.md).
3. Download the [historical task preview](https://huggingface.co/datasets/haxiaofeng/CityAgentBench-tasks).
4. Pick a bounded task from the [roadmap](docs/roadmap.md), discuss its acceptance criteria
   in an issue, then contribute a branch and pull request.

You can check the reference scoring code without UE or a GPU:

```bash
git clone https://github.com/Xiaofeng-Han-Res/CityAgentBench.git
cd CityAgentBench
python3 -B -m unittest discover -s tests -v
```

Python 3.10+ is sufficient for these repository checks. This command tests the reference
scorer; it does not launch an agent or reproduce a benchmark score.

## How evaluation works

```text
Pinned scene + reviewed task + fixed budget and scoring
    → verified initial observation
    → agent command → native movement/map feedback → new observation
    → answer or stop → arrival/answer checks → per-task result and trajectory
```

L1 covers object identification, target localization, sign information, local spatial
relations, counting and visible state. L2 covers finding and reaching a destination,
checking information at arrival, and observing along a route. Higher levels are research
designs. The six-level website taxonomy and later five-level authoring experiments are
versioned designs, not interchangeable released benchmarks.

See [the full evaluation guide](docs/evaluation.md) for input boundaries, scoring,
technical failures and the work needed before an independent user can run the environment.
Current progress and pilot limitations are in [project status](docs/status.md).

## Repository map

```text
site/                   Existing public project website
docs/                   Architecture, evaluation, resources, status and roadmap
cityagentbench/         Reference scoring logic
tests/                  Scoring regression checks
scripts/                Website assembly and public dataset verification
.github/                Contribution templates and automated checks
CONTRIBUTING.md          Collaboration workflow
```

Scene meshes, textures, UE binaries, task images and future neural checkpoints are distributed
separately; use [the resource guide](docs/resources.md) to select a matching release.
Website maintenance instructions are in [docs/website.md](docs/website.md).

## Attribution and reuse

The presentation and evaluation documentation structure was informed by
[UrbanGround](https://github.com/UrbanGround/UrbanGround). This project has its own scenes,
tasks and development protocol; it does not claim UrbanGround's capabilities or results.
No project-wide code or dataset license has yet been selected. Third-party components retain
their original terms. See [attribution and licensing status](docs/attribution.md).
