# Impact map — alinhamento `cdf_apm` / `ApmAppData`

| Change ID | Área | Ação |
|-----------|------|------|
| DM-001 | DBML / DMBL | Remover modelo `FlowTraining*`; usar views APM |
| DM-001 | `SPEC.md` | Existing views: `cdf_apm.<View>:<version>`; Data model: `ApmAppData` |
| DM-002 | `prompt_seed_dados.md` | CSV por view APM + edges `reference*` |
| DM-003 | App queries | `instances.query` com views `cdf_apm`; respeitar edges |
| DM-004 | Assets | Resolver `asset` / `rootLocation` → instâncias asset do projeto |
| DM-005 | Versões | Validar v7/v8 no CDF — não assumir versão do toolkit |

## Risco se ignorar ApmAppData

- Seed em views inexistentes → apply falha.
- App consulta DM errado → listas vazias na demo.
- Duplicar checklist custom → conflito com InField/APM no mesmo tenant.
