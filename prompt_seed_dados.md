# Skill: create-cdf-seed

## Purpose

Create realistic, repeatable, auditable, and production-safe seed data for Cognite Flows applications running on Cognite Data Fusion (CDF).

This skill establishes the engineering process for generating workshop, demo, testing, onboarding, and enablement datasets.

Seed generation is considered a software engineering activity and must follow Cognite Data Modeling and CDF operational best practices.

**Default delivery format:** generate seed datasets as **CSV files**, review them with humans **before** any write to CDF, then upload only after explicit approval.

---

# Related Skills

Run **`prompt_dmbl_impact.md`** (`dmbl-impact-analysis`) before this prompt when the data model is new, extended, or unclear. It produces `model/dmbl.md`, `model/workshop-data-model.dbml`, and `model/impact-map.md` — a business lens on entities, relationships, **planned changes**, and **impacted reference data** (not a full copy of the Cognite DMS schema).

When implementing uploads to CDF, also follow:

- **`dm-limits-and-best-practices`** — concurrency, batching (`instances.upsert` up to 1000 items), pagination, 429 retry, `QueuedTaskRunner` / semaphore patterns.

---

# When to Use

Use this skill when:

- Creating Cognite Flows applications
- Creating workshop environments
- Creating training environments
- Creating onboarding datasets
- Creating proof-of-concept environments
- Creating demo applications
- Creating repeatable testing environments
- Creating synthetic industrial datasets

---

# When NOT to Use

Do NOT use this skill when:

- Migrating production systems
- Performing one-time data loads
- Integrating ERP systems
- Creating temporary ad-hoc datasets
- Importing real production data
- Creating operational production pipelines

---

# Core Principles

Seed generation must be:

## Repeatable

Multiple executions should produce equivalent results.

---

## Auditable

Every generated object must have traceability (CSV row → external ID → CDF instance).

---

## Reviewable (CSV-first)

All seed content must be materialized as **CSV files** that humans can open, filter, and approve **before** any CDF upload.

---

## Incremental

The process must support iterative growth (add rows to CSV, re-review, re-upload).

---

## Idempotent

Multiple uploads must not create duplicates (deterministic external IDs + upsert).

---

## Realistic

Data should represent actual business workflows.

---

## Bounded

Generate only what is necessary for the application.

---

## Safe for CDF

Respect API limits, modeling constraints, and operational best practices (see `dm-limits-and-best-practices`).

---

# Mandatory Inputs

Before generating any seed data, read and understand:

- **`SPEC.md`** (repo root product spec — required)
- Optional: `PRD.md`, `specs/<feature>/spec.md`, `specs/design.md`
- Data Model documentation (Spaces, Containers, Views, Data Models)
- Business workflows and user stories from the spec
- Target **instance space** and view external IDs
- **`model/dmbl.md`**, **`model/workshop-data-model.dbml`**, and **`model/impact-map.md`** (from `prompt_dmbl_impact.md`) when the model has changes or non-trivial references

---

# Critical Rule

Do NOT generate seed data before the first version of **`SPEC.md`** exists.

Do NOT generate seed CSV before **`model/dmbl.md`** and **`model/workshop-data-model.dbml`** are drafted and reviewed when:

- The team is introducing or changing views, edges, or reference entities
- Seed rows depend on master/reference data (sites, assets, catalogs)
- You need to confirm which entities and relations the app actually uses

The specification must define:

- Domain concepts
- User workflows
- Business scenarios
- Expected application behavior

Generating seed data before the specification usually creates plausible but irrelevant datasets.

---

# Recommended Repository Layout

```text
model/
├── dmbl.md                      # Business entities, relations, deltas (from prompt_dmbl_impact.md)
├── workshop-data-model.dbml     # Proposed DBML — review before DML + seed
├── impact-map.md                # Change → impacted seed / app / queries
└── dmbl-diagram.mmd             # Optional Mermaid (business names, not full DMS dump)

seed/
├── SEED_STRATEGY.md          # Coverage matrix, ID rules, quantities (must align with dmbl.md)
├── csv/                      # Human-reviewable datasets (source of truth)
│   ├── nodes-<ViewName>.csv
│   ├── edges-<EdgeType>.csv
│   └── README.md             # Column glossary + scenario mapping
├── mapping/
│   └── view-to-csv.yaml      # CSV column → container property mapping
├── scripts/
│   ├── generate-csv.ts       # Produces / refreshes csv/
│   ├── validate-csv.ts       # Lint CSV before review (no CDF writes)
│   └── upload-to-cdf.ts      # Reads approved csv/ → instances.upsert
└── runs/
    └── <timestamp>/          # Manifest + logs per execution
```

---

# Step 0 — DMBL & impact map (when model matters)

If not already done, follow **`prompt_dmbl_impact.md`** and ensure:

- Main **business entities** and **relationships** are documented
- **Model delta** (as-is → to-be) lists only relevant changes, not the entire CDF schema
- **Reference entities** and blocking dependencies are explicit
- **Impact map** links each change to seed CSVs, validation, and app surfaces

Use `model/dmbl.md` when defining quantities, external IDs, and coverage in the steps below.

Skip this step only when re-seeding an unchanged model with an approved existing DMBL.

---

# Step 1 — Understand the Domain

Analyze (cross-check with `model/dmbl.md`):

## Business Domain

Identify:

- Business entities
- Business relationships
- Operational workflows

---

## User Workflows

Identify:

- Happy paths
- Exception paths
- Alert scenarios
- Dashboard scenarios

---

## Application Features

Identify:

- KPIs
- Trends
- Notifications
- Dashboards
- Reports
- Workflows

---

# Step 2 — Create Coverage Matrix

Build a coverage matrix in `seed/SEED_STRATEGY.md`.

Example:

| Scenario | Covered | CSV file(s) |
|----------|---------|-------------|
| Happy Path | Yes | `nodes-Asset.csv` |
| Alert Scenario | Yes | `nodes-Notification.csv` |
| KPI Scenario | Yes | `nodes-Measurement.csv` |
| Trend Scenario | Yes | `nodes-Measurement.csv` |
| Notification Scenario | Yes | `nodes-Notification.csv` |
| Exception Scenario | Yes | `nodes-Checklist.csv` |

Every generated row must support at least one scenario.

---

# Step 3 — Define External ID Strategy

External IDs must be:

- Deterministic
- Stable
- Reproducible
- Human-readable

Include the **`externalId`** column in every node/edge CSV. Never rely on CDF auto-generated IDs for seed data.

---

## Good Examples

```text
asset:site-a:pump-01

asset:site-a:compressor-01

checklist:daily-inspection:pump-01

measurement:vibration:pump-01:2026-01-01

notification:high-vibration:pump-01
```

---

## Bad Examples

```text
2d47a88f

e8af44bc-6e2d

random-12345

uuid-generated-id
```

---

# Step 4 — Define Data Generation Rules

Create explicit rules for:

## Assets

- Quantity
- Hierarchy
- Locations
- Naming convention

---

## Checklists

- Types
- Statuses
- Frequencies

---

## Measurements

- Reading ranges
- Expected values
- Failure values

---

## Notifications

- Severity
- Trigger conditions
- Business meaning

---

## Trends

Data should support:

- Daily views
- Weekly views
- Monthly views

Document date/time columns in CSV with explicit formats (ISO 8601 recommended).

---

# Step 5 — Define Realistic Scenarios

Seed data should include:

## Normal Operations

Healthy equipment.

---

## Warning Conditions

Approaching thresholds.

---

## Critical Conditions

Out-of-range measurements.

---

## Overdue Activities

Missed inspections.

---

## Operational Variability

Expected fluctuations.

Tag scenario coverage in CSV when useful (e.g. column `scenario` = `happy-path` | `alert` | `overdue`).

---

# Step 6 — Generate CSV Files (mandatory)

Generate one CSV per logical dataset (typically per **View** for nodes, per **edge type** for relationships).

## CSV conventions

- **UTF-8** encoding, comma-separated, header row required.
- First column should be **`space`** and **`externalId`** for nodes (or the pair required by your upload script).
- Column names match **container property** names or documented aliases in `seed/mapping/view-to-csv.yaml`.
- Use consistent enums (e.g. `status`: `open` | `completed` | `overdue`) — document allowed values in `seed/csv/README.md`.
- Relations: either a dedicated edges CSV (`startNodeExternalId`, `endNodeExternalId`, `edgeType`) or denormalized reference columns (`assetExternalId`) on the node CSV — pick one pattern per project and document it.

## Generation script

Provide `seed/scripts/generate-csv.ts` (or equivalent) that:

- Reads `SPEC.md` + `SEED_STRATEGY.md` + Data Model definitions
- Writes/overwrites files under `seed/csv/`
- Is **deterministic** (same inputs → same CSV bytes)

## Pre-review validation (`validate-csv`)

Run **before** human review. No CDF API calls. Check:

- Required columns present
- No duplicate `externalId` within a file
- Referenced external IDs exist (cross-file integrity)
- Enum/date/numeric ranges
- Row counts match `SEED_STRATEGY.md` plan
- Coverage matrix scenarios represented by at least one row

Output: validation report (pass/fail + row-level errors) saved under `seed/runs/`.

---

# Step 7 — Human Review Gate (mandatory)

**Do not upload to CDF until CSV files are reviewed and approved.**

## Review checklist for humans

- [ ] Open each CSV in Excel, LibreOffice, or VS Code — spot-check names, statuses, dates
- [ ] Confirm demo scenarios are visible (alerts, overdue, critical readings)
- [ ] Confirm external IDs are readable and stable
- [ ] Confirm quantities are bounded (not excessive for workshop)
- [ ] Confirm `validate-csv` report is green (or exceptions documented)

## Approval

Record approval in `seed/SEED_STRATEGY.md` or `seed/csv/README.md`:

```text
Reviewed by: <name>
Date: <YYYY-MM-DD>
Approved for upload: yes
```

Only proceed to Step 8 when **Approved for upload: yes**.

---

# Step 8 — CDF Upload (after CSV approval)

The upload script (`seed/scripts/upload-to-cdf.ts`) must:

1. Read **only** from approved `seed/csv/`
2. Map rows → `instances.upsert` items via `seed/mapping/`
3. Support **`--dry-run`** — print batch counts and sample payloads, **zero writes**
4. Support **`--execute`** — perform upserts after dry-run approval

## Upsert semantics

Use:

```text
instances.upsert()
```

- Prefer **`mode: 'upsert'`** with default merge behavior when updating existing workshop data.
- Use **`replace`** only when you intentionally overwrite the full instance body and understand the impact on properties not present in CSV.
- Avoid blind insert-only flows that fail on re-run or create duplicates.

## Batch sizing

- Max **1000 items** per `instances.upsert` call.
- Configurable chunk size; never send unbounded payloads.

## Concurrency control

Use semaphore / `QueuedTaskRunner` — see `dm-limits-and-best-practices`.

Avoid uncontrolled `Promise.all` over hundreds of batches.

## Rate limiting

Handle **`429 Too Many Requests`** with retry and exponential backoff.

## Provenance

Each run manifest must record:

- CSV file paths and checksums (e.g. SHA-256)
- Git commit or strategy version
- Row counts uploaded per file
- Upsert batch results (success / failed external IDs)

## Logging

Write execution logs under `seed/runs/<timestamp>/`.

---

# Step 9 — Required Artifacts

Generate and maintain:

## Model artifacts (from prompt_dmbl_impact.md)

- `model/dmbl.md` — business lens, deltas, reference entities
- `model/workshop-data-model.dbml` — logical model for review
- `model/impact-map.md` — change impact on seed and app
- Optional `model/dmbl-diagram.mmd`

## Strategy artifacts

- `seed/SEED_STRATEGY.md` — coverage matrix, quantities, ID rules (aligned with DMBL)
- `seed/csv/README.md` — column glossary, enums, scenario tags

## CSV artifacts (source of truth)

- `seed/csv/*.csv` — all node and edge datasets
- `seed/mapping/view-to-csv.yaml` — column mapping to DM properties

## Validation artifacts

- `validate-csv` report (pre-upload)
- Post-upload validation report (CDF queries)

## Execution artifacts

- Run manifest (CSV checksums, counts, approval metadata)
- Upload logs
- Dry-run output (when used)

## Identity artifacts

- External ID strategy (in `SEED_STRATEGY.md`)
- Naming conventions

## Optional artifacts

- Snapshot export from CDF after upload (backup)
- Fixture package for tests

---

# Step 10 — Post-Upload Validation (CDF)

After `--execute`, validate in CDF:

## Entity counts

Match planned quantities from `SEED_STRATEGY.md`.

---

## Relationship integrity

Edge endpoints and reference properties resolve to existing instances.

---

## Coverage

All required scenarios still visible via app queries.

---

## Dashboard readiness

KPIs render with seeded data.

---

## Trend readiness

Time-series or time-stamped properties support charts (day / week / month).

---

## Alert readiness

Notification scenarios appear in the app.

Re-run idempotency: second upload with same CSV should not duplicate instances.

---

# Step 11 — Deliverables

Return to the user:

## DMBL package

`model/dmbl.md`, `model/workshop-data-model.dbml`, `model/impact-map.md`, and optional diagram.

---

## Seed strategy

Overall approach and coverage matrix (traceable to DMBL entities).

---

## CSV package

All files under `seed/csv/` + README + mapping.

---

## Validation reports

Pre-review (`validate-csv`) and post-upload (CDF).

---

## External ID strategy

Naming rules and examples.

---

## Execution plan

How to run `generate-csv` → review → `upload-to-cdf --dry-run` → `upload-to-cdf --execute`.

---

## Approval record

Who reviewed CSV and when upload was authorized.

---

# Cognite Flows Best Practice

Always follow:

```text
SPEC.md
    ↓
prompt_dmbl_impact.md  →  dmbl.md + workshop-data-model.dbml + impact-map.md  (human review)
    ↓
Data Model (DMS/DML publish — technical schema)
    ↓
Seed Strategy (SEED_STRATEGY.md) — driven by DMBL + SPEC
    ↓
Generate CSV  →  validate-csv  →  Human review & approval
    ↓
upload-to-cdf (--dry-run, then --execute)
    ↓
Post-upload validation
    ↓
Application Development
```

Never:

```text
Upload to CDF
    ↓
Invent Scenarios
    ↓
Adapt Application
```

Never:

```text
Push directly to CDF without CSV review
```

The application should drive the seed.

The seed should never drive the application.

CSV review is the quality gate that keeps workshop data adequate before it touches CDF.
