# Design — Seed App (OEC Route 1 → cdf_apm.ApmAppData:v13)

This document is the single source of truth for the design of **`app_seed`**: the Python application that **generates** the seed JSON from the OEC route CSV and **populates** CDF (data model `cdf_apm.ApmAppData:v13`). Use it when evolving the generator, the populator, the data mapping, or when reviewing the seed against the real model.

**Source of truth (input data):** [references/A Line OEC Routes 1(Route 1 - Dig IV Diff).csv](../references/A%20Line%20OEC%20Routes%201%28Route%201%20-%20Dig%20IV%20Diff%29.csv)

**Source of truth (target model):** **live** introspection of the `radix-dev` project (cluster `az-eastus-1`) via the Data Modeling API — not the SPEC, not the original JSON. Identifiers are centralized in [config/model_ids.py](../seed/app_seed/app_seed/config/model_ids.py).

**Supporting artifacts:**

| Artifact | Path |
|----------|------|
| Generated seed JSON | [seed/app_seed/data/apm-app-data-route-1-seed.json](../seed/app_seed/data/apm-app-data-route-1-seed.json) |
| Operational README | [seed/app_seed/README.md](../seed/app_seed/README.md) |
| Product spec (reader app) | [SPEC.md](../SPEC.md) |

---

## Purpose and scope

`app_seed` has **one business responsibility**: turn the OEC (Operator Equipment Care) round spreadsheet into valid APM instances and write them to CDF, to populate the dashboard described in [SPEC.md](../SPEC.md).

There are two use cases, exposed by a CLI:

1. **`generate`** — reads the CSV and (re)generates the seed JSON already in the real model shape (`cdf_apm`, with edges). Does not require CDF.
2. **`populate`** — reads the JSON and upserts into CDF. **Dry-run by default**; `--apply` writes.

Out of scope: reading/consumption by the app (that is `SPEC.md`), modeling new APM types, and any destructive write (the seed only does idempotent upserts).

---

## Why the JSON was regenerated (real vs. fictional model)

The original JSON ([references/apm-app-data-route-1-seed.json](../references/apm-app-data-route-1-seed.json)) reproduced the CSV with **perfect content fidelity** (8 floors / 35 equipment / 193 checks / 4 measurements), but modeled a data model that **does not exist** in `radix-dev`. Live introspection proved the divergences below — all fatal to `instances.apply`:

| The original JSON used… | …but the real one is | Consequence |
|-------------------------|-----------------------|-------------|
| space `APMAppData`, views `@13` | `cdf_apm`, `Checklist@v7`/`ChecklistItem@v7`, `MeasurementReading@v4` | `400 — views do not exist` |
| `Asset@13` with a `name` field | `cdf_core.Asset@v2` with `title` (no `name`) | property rejected |
| view `Measurement` with `name/unit/limit` | `MeasurementReading@v4`: `title/type/min/max/options/...` | non-existent properties |
| `CDF_User` in `cognite_app_data` | `cdf_apps_shared.CDF_User@v1` (`email` **required**) | wrong space + missing field |
| `checklistItems`/`measurements` as a **property** | **edges** `referenceChecklistItems` / `referenceMeasurements` | relations not created |
| `exception` field on ChecklistItem | **does not exist** in the model | property rejected |

**Conclusion:** CSV fidelity is necessary but not sufficient — the seed must be valid for the real data model. `app_seed` solves both.

---

## Target data model (`cdf_apm.ApmAppData:v13`)

Everything below was verified live and is centralized in [config/model_ids.py](../seed/app_seed/app_seed/config/model_ids.py) (DRY).

### Views (nodes)

| Concept | View | Key fields used | Relations |
|---------|------|-----------------|-----------|
| Round | `cdf_apm:Checklist/v7` | `title, status, startTime, endTime, assignedTo, type, visibility, isArchived, sourceId, source, labels` | `rootLocation`→Asset; `createdBy`/`updatedBy`→CDF_User; `checklistItems` (**edge**) |
| Task | `cdf_apm:ChecklistItem/v7` | `title, status, order, note, startTime, endTime, visibility, isArchived, sourceId, source, labels` | `asset`→Asset; `createdBy`/`updatedBy`→CDF_User; `measurements` (**edge**) |
| Measurement | `cdf_apm:MeasurementReading/v4` | `title, type, min, max, options, visibility, isArchived` | `createdBy`/`updatedBy`→CDF_User |
| Asset | `cdf_core:Asset/v2` | `title, description, labels, source, sourceId` | `parent`/`root`→Asset |
| User | `cdf_apps_shared:CDF_User/v1` | `name, email` (**email required**) | — |

### Edges (relations)

| Edge type | Direction | From → To |
|-----------|-----------|-----------|
| `cdf_apm:referenceChecklistItems` | outwards | Checklist → ChecklistItem |
| `cdf_apm:referenceMeasurements` | outwards | ChecklistItem → MeasurementReading |

> ⚠️ The Checklist→Item and Item→Measurement relations **are edges, not properties**. Writing them as properties is rejected by the API.

---

## Architecture (layers)

Clean architecture with a strict dependency rule: `config`/`data`/`services` depend on `domain`, **never the other way around**. The only module that knows the cognite-sdk is the concrete gateway.

```
seed/app_seed/
├── data/                                   # seed JSON (generated artifact)
├── app_seed/
│   ├── config/    model_ids.py · settings.py
│   ├── domain/    entities · instances · refs (Instance/View/EdgeTypeRef, JsonValue) · naming · timestamps · constants
│   ├── models/    seed_bundle.py (serializable DTO, JSON round-trip)
│   ├── data/      csv_route_reader · json_seed_repository · cdf_gateway (port) · cognite_cdf_gateway
│   ├── services/  measurement_mapper · calibration_service · seed_metadata
│   │   ├── seed_builder_service.py    (orchestrator)
│   │   ├── seed_populator_service.py  (validate + upsert)
│   │   └── factories/ user · asset · measurement · checklist · edge
│   ├── injectors/ container.py (composition root)
│   └── cli.py
└── tests/                                  # pytest
```

### Responsibility per layer

| Layer | Responsibility | Highlighted principle |
|-------|----------------|------------------------|
| `domain` | Pure entities, value objects, naming policy, timestamps, constants | No IO/SDK; stable core |
| `models` | `SeedBundle` DTO (nodes + edges + meta), round-trip (de)serialization | One format for JSON and CDF (DRY) |
| `data` | Read CSV, persist JSON, validate/write to CDF | `CdfGateway` is a **port** (Protocol) |
| `services` | Use cases: map, calibrate, build, populate | SRP: builder **orchestrates**, factories construct |
| `injectors` | Dependency wiring | Dependency Inversion / composition root |

### Applied principles

- **SRP** — `SeedBuilderService` only orchestrates; each factory (`user/asset/measurement/checklist/edge`) builds one instance type.
- **Dependency Inversion** — the populator depends on `CdfGateway` (Protocol), not on the cognite-sdk; testable with a fake gateway.
- **DRY** — model ids, naming policy, and timestamp formatting are centralized.
- **KISS / Clean Code** — linear `generate` → `populate` flow, no speculative abstractions.

---

## CSV → CDF mapping

| CSV element | Becomes | View / Edge |
|-------------|---------|-------------|
| Floor line (`7th Floor`, `Ground Floor`…) | 1 Checklist | `cdf_apm:Checklist/v7` |
| `Task Complete` line (equipment) | 1 Asset | `cdf_core:Asset/v2` |
| Checkbox line `;? ;` | 1 ChecklistItem + 1 edge to the Checklist | `ChecklistItem/v7` + `referenceChecklistItems` |
| Column D/E (measurement spec) | MeasurementReading (dedup. catalog) + edge from the Item | `MeasurementReading/v4` + `referenceMeasurements` |
| (synthetic) | 1 route root Asset + 4 CDF_User | `Asset/v2` + `CDF_User/v1` |

The whole route sits under 1 **root Asset** (`asset-route-root_group_3`); each Checklist points its `rootLocation` to it, and each equipment Asset has `parent`/`root` = root.

---

## Measurement mapping (rich)

The `MeasurementReading:v4` view has no `name/unit/limit`; we translate the semantics of the checks:

| Spec in CSV (D \| E) | `type` | Fields written |
|----------------------|--------|----------------|
| `OK / Not OK` | `checkbox` | `options=[{label,value} …]` |
| `Yes / No` | `checkbox` | `options=[{label,value} …]` |
| `?F` + `>170` | `numerical` | `max=170.0`, `title="Temperature (°F)"` |
| `ips` | `numerical` | `title="Vibration (ips)"` (no limit) |

> ⚠️ **`options` requires an array of JSON OBJECTS** (`{"label":"OK","value":"OK"}`); an array of strings is rejected with `400`. Limit comparators: `>x` → `max=x`; `<x` → `min=x`; `=x` → `min=max=x`.

---

## KPI calibration

The 8 Checklists (1 per floor) are distributed **deterministically** across the dashboard's 4 buckets (2 each), to exercise the KPIs from [SPEC.md](../SPEC.md). `Overdue` is **derived** (past `endTime` + not completed), so it is stored as `Ongoing` with a past `endTime`.

| Bucket | stored `status` | `startTime` | `endTime` |
|--------|-----------------|-------------|-----------|
| Completed | `Completed` | past | past |
| In progress | `Ongoing` | past | future |
| Open | `To Do` | — | future |
| Overdue | `Ongoing` | past | **past** |

ChecklistItems get statuses consistent with the parent Checklist (progression completed → in progress → to do). Fixed reference date: **2026-06-03** (100% deterministic output).

---

## externalId convention (`_group_3`)

Idempotent scheme — re-running generates the same ids (no duplicates).

| Instance | Pattern | Example |
|----------|---------|---------|
| Checklist | `eq-{floor}_group_3` | `eq-7th-floor_group_3` |
| ChecklistItem | `eq-{floor}-{equip}-{order}-check-{n}_group_3` | `eq-7th-floor-diffuser-scraper-1-check-1_group_3` |
| Asset (equipment) | `asset-{floor}-{equip}-{order}_group_3` | `asset-7th-floor-diffuser-scraper-1_group_3` |
| Asset (root) | `asset-route-root_group_3` | `asset-route-root_group_3` |
| Measurement | `measurement-{slug(key)}_group_3` | `measurement-ok-not-ok_group_3` |
| CDF_User | `cdf-user-{role}-seed_group_3` | `cdf-user-supervisor-seed_group_3` |
| Edge → item | `rci-{item-base}_group_3` | `rci-eq-7th-floor-…-check-1_group_3` |
| Edge → measurement | `rms-{item-base}_group_3` | `rms-eq-7th-floor-…-check-1_group_3` |

---

## CLI and usage flow

```bash
cd seed/app_seed && pip install -e .          # cognite-sdk + python-dotenv

python -m app_seed generate                   # (re)generate data/...json from the CSV
python -m app_seed populate                   # DRY-RUN: validates views/space, writes nothing
python -m app_seed populate --apply           # writes to CDF (idempotent)
```

Options: `--space <name>`, `--env <path>`, `--csv`, `--out`, `--in`. Credentials come from the `.env` at the repo root.

---

## Idempotency and safety

- **Dry-run by default.** `populate` only writes with `--apply`; without the flag, it makes read-only calls (validation + plan).
- **Validate before writing.** If any required view is missing, it aborts and **writes nothing**.
- **Write order.** Nodes (users → assets → measurements → checklists → items) before edges, so direct relations and endpoints already exist.
- **Transactional.** `instances.apply` rejects the whole request if one item is invalid — nothing is partially written.
- **Idempotent.** Re-running `--apply` returns everything as `unchanged` (same externalIds, `replace=False`).

---

## Do / Don't

| Do | Don't |
|----|-------|
| Centralize model ids in `model_ids.py` | Scatter view/version strings across the code |
| Model relations as **edges** | Write `checklistItems`/`measurements` as a property |
| Use `title` on Asset | Use `name` (does not exist on `cdf_core.Asset:v2`) |
| `options` as an array of `{label,value}` objects | `options` as an array of strings |
| Validate with dry-run before `--apply` | Apply directly without checking the plan/views |
| Regenerate the JSON via `generate` after changing the CSV | Edit the generated JSON by hand |

---

## Quick reference (seed state)

| Metric | Value |
|--------|-------|
| Instance space | `cognite-flows-grupo-3` |
| Nodes | **245** (8 Checklist + 193 ChecklistItem + 36 Asset + 4 MeasurementReading + 4 CDF_User) |
| Edges | **385** (193 `referenceChecklistItems` + 192 `referenceMeasurements`) |
| Data model | `cdf_apm.ApmAppData:v13` |
| Status | **Applied and verified** in `radix-dev` (2026-06-03) |
| Tests | 44 (pytest) |

> The root Asset brings the total to 36 (35 equipment + 1 root). Only 1 of the 193 items ("No. of Open Nozzles") has no measurement → 192 measurement edges.

---

## Related documentation

- Operational README: [seed/app_seed/README.md](../seed/app_seed/README.md)
- Model identifiers: [config/model_ids.py](../seed/app_seed/app_seed/config/model_ids.py)
- Product spec (reader app): [SPEC.md](../SPEC.md)
- Design system / brand: [specs/design.md](design.md)
