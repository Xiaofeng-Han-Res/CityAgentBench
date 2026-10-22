# Contributing

Contributions should make the reconstructed city, task evidence or evaluation easier to
inspect and reproduce. Read [architecture](docs/architecture.md), [evaluation](docs/evaluation.md)
and [current status](docs/status.md) before choosing work.

## Workflow

1. Open an issue with the concrete problem, affected scene/protocol and acceptance evidence.
2. Create a focused branch. Keep generated scenes and large datasets outside Git; reference
   their versioned Hugging Face artifacts and checksums.
3. Implement the change and run checks relevant to its behavior. Include before/after native
   views for scene changes and one full trajectory for runtime/evaluation changes.
4. Open a PR describing the trigger, resulting behavior, validation and remaining limitations.
   Reference the issue and exact data/scene versions.

Contributors without repository write access can fork and submit a PR. Maintainers may grant
collaborator access for ongoing work. Coordinate exclusive ownership before driving a shared
UE session, and use separate scene candidates for concurrent construction work.

## Task contributions

Write a natural on-location need, with enough context to identify the target but without
revealing private evidence labels. Save English model text and separate Chinese review notes.
Bind native screenshots and actual camera positions. Revalidate starts and visibility after
scene changes. L2 must require physical arrival, not only turning or stating a destination.

Keep task drafting, image evidence, human approval, reference-route validation and formal
activation as separate states. Do not change truth or replace tasks after seeing model failures.
Group related images/scenes when designing splits to avoid near-duplicate leakage.

## Repository checks

```bash
python3 -B -m unittest discover -s tests -v
python3 -B scripts/verify_task_preview.py /path/to/downloaded/CityAgentBench-tasks
```

The second check needs the separately downloaded preview. Neither check runs a live UE
evaluation. Tests should verify observable behavior and meaningful failure cases.

Private answers, endpoint keys, runtime access tokens, local account paths and unredacted
request logs do not belong in public PRs. Describe a configuration by field names and safe
example values. Contributor agreements and release licenses have not yet been established;
see [attribution](docs/attribution.md).
