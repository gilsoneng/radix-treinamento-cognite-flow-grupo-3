# Modelo de dados — workshop (grupo 4)

Artefatos de **planejamento** antes da seed. Ordem recomendada:

1. `CDM-REFERENCES.md` — o que reutilizar do Cognite Core / IDM (leitura obrigatória)  
2. `dmbl.md` — visão de negócio, delta e entidades de referência  
3. `workshop-data-model.dbml` — diagrama revisável (DBML) no dbdiagram.io  
4. `impact-map.md` — o que muda no seed e no app  
5. Depois: `prompt_seed_dados.md` → CSV → upload CDF  

## Como visualizar o DBML

- [dbdiagram.io](https://dbdiagram.io) — colar o conteúdo de `workshop-data-model.dbml`  
- VS Code — extensão “DBML” ou “Database Client”  
- CLI: `dbdocs build model/workshop-data-model.dbml` (se usar dbdocs)  

## Modelo do treinamento

| Campo | Valor |
|-------|--------|
| Space | **`cdf_apm`** |
| Data model | **`ApmAppData`** |

## As-is vs to-be

| Camada | As-is | To-be |
|--------|-------|-------|
| APM | `ApmAppData` no projeto (system) | **Reutilizar** views: Checklist, Template, Observation, … |
| Core | `CogniteAsset` via `asset` / `rootLocation` | Seed mínimo de hierarquia se vazio |
| App workshop | Scaffold; `SPEC.md` vazio | Queries contra `cdf_apm` + CDM |
| Seed | Não existe | CSV por view/edge APM (não inventar DM paralelo) |

O DBML **não** é o schema publicado no DMS — é a representação acordada antes de gerar DML/views e seed.
