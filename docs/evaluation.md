# Evaluation guide

This guide describes the current **development protocol** and the route to a reproducible
release. A portable UE environment, public agent runner and frozen official test split are
not yet shipped. The public reference scorer can be inspected and tested now.

## 1. Choose a protocol and matching artifacts

| Protocol | Available use | Movement |
| --- | --- | --- |
| `legacy-l1-static-20260928` | 35-image historical preview; data-format inspection | One image, zero actions |
| `deepseek-motion-pilot-20261010` | Existing workstation development pilot | L1 optional movement; L2 actual arrival |
| Future public benchmark | Pending reviewed tasks, portable runtime and frozen rules | To be stated in its release manifest |

Pin the code commit, data revision, scene hash and protocol ID. Do not silently substitute
another scene or transfer old image annotations to a changed view. Later GPT-authored
candidates do not become official test tasks because they have a draft question or screenshot.

## 2. Validate the environment and task before model calls

Confirm the scene identity, initial native pose, ground support, body/head clearance and
camera settings. Inspect the actual screenshot for target visibility and unambiguous evidence.
For L2, walk a reference route and fix the arrival region, required observations and budget.
Freeze task selection and scoring before starting model attempts. Changes after model failure
produce a new protocol version rather than replacing a failed task in the original result.

The current pilot uses a 1.80 m eye height, 90° horizontal FOV and 1920×1080 observations.
It acquires exclusive ownership of its UE session and restores the original pose afterward.
Another scene editor or capture job must not drive that session concurrently.

## 3. Connect an agent

The task, system/output contract, command descriptions and feedback are in English. Visible
sign text retains its original language. Agent input contains observations and public action
feedback, not private answers, target coordinates, reference routes or reset controls.

The development command vocabulary includes:

| Command | Example | Effect |
| --- | --- | --- |
| Forward | `{"command":"forward","meters":2}` | Collision-checked physical movement |
| Turn | `{"command":"turn","degrees":30}` | Turn right; negative values turn left |
| Look | `{"command":"look","pitch":0}` | Set viewing pitch |
| Observe | `{"command":"observe"}` | Capture another observation |
| Answer | `{"command":"answer","answer":"B"}` | Submit and end the episode |
| Stop | `{"command":"stop"}` | End without a text answer |

For this pilot, forward commands span 0.5–5 m; turns span −60–60°; pitch spans −20–45°.
L2 also retains ordinary public map search, place, route and view commands. L1's current
pilot allows movement but retains its no-map condition. These ranges are pilot settings,
not universal limits for future versions.

Physical actions produce a new image and actual movement feedback. Asking to move five
metres does not mean five metres were completed. `uneven_ground` and `obstacle` reports
must remain visible in the trajectory.

## 4. Fix budgets and record the first attempt

The October 10 L1 pilot budget is 24 commands, 30 m and 600 s. Its L2 budgets are derived
per task from native reference walks; they are not the old short-demo limits. Invalid
commands, map queries, observations and final submissions count toward the command budget.
Keep the first model attempt, actual returned model identifier, API receipts, elapsed time,
distance, observations and executed commands. Record any retry policy explicitly.

## 5. Score answers and physical arrival

| Task | Development rule |
| --- | --- |
| L1 A: identity/basic function | Fixed A/B/C/D option letter |
| L1 B: target localization | Normalized box; any valid target; IoU ≥ 0.5 against the bound image |
| L1 C: sign information | Requested visible text/facts with frozen normalization/equivalents |
| L1 D: spatial relation | Frozen facts/equivalent answers, otherwise independent semantic review |
| L1 E: count | Exact integer |
| L1 F: visible state | Visible evidence and frozen equivalents, otherwise semantic review |
| L2 F: find and arrive | Native arrival region and actual travelled-distance requirement |
| L2 I: check information at arrival | Physical arrival AND requested information |
| L2 S: observe along a route | Required route coverage AND requested information |

`cityagentbench/scoring.py` preserves the existing pilot implementation for reference.
Its unresolved semantic or box cases return `None` and require review. A claimed arrival
does not satisfy an L2 task. Arrival tolerance and minimum travel are task-specific.
The pilot route-checkpoint implementation checks sampled positions with a 4 m radius and
does not enforce checkpoint order; an ordered-route benchmark needs a separately validated
implementation. This is one reason the module is labelled a reference, not an official scorer.

```bash
python3 -B -m unittest discover -s tests -v
```

## 6. Keep results interpretable

Store one result per frozen task with `task_id`, protocol/scene/code/data versions, selected
and actual model identifiers, final answer, success or pending-review state, termination,
budget usage and evidence references. Classify model errors, API failures and environment
failures separately. State the planned, attempted, scored and pending counts explicitly;
do not silently remove failures from the denominator.

The recorded L1 pilot total of 13/20 includes assistant semantic decisions and is pending
independent blind review. It is not a leaderboard result or an estimate over the full bank.
Environment probes and authored-task visual checks are not independent model evaluation runs.

Record actual first-person execution separately from reference-route demonstrations and
third-person action replay. A replay must be labelled and checked against original poses;
it is not a simultaneous third camera or another model trial.

## Collaborator access to the existing workstation

The working tree contains `question/portal_20261010/launch.py` for review/practice and
`evaluation/deepseek_motion_pilot_20261010_v1/scripts/run_pilot.py` for the bound pilot.
These are **workstation paths, not files supplied by this public repository**. The pilot
requires its private frozen manifest, checked runtime session, source hashes and model setup;
its historical command is `python3 -B scripts/run_pilot.py --level L1` from that pilot folder.
Do not run it against a changed session or treat it as a public quick-start command.

The release work is to parameterize those dependencies, package the native environment,
publish a development task bundle, and validate a clean-machine single-task run before
documenting batch execution. Track that work in [the roadmap](roadmap.md).
