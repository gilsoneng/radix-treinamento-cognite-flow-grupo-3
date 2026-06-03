# Feature Specification: Visualização de OK/Not Ok e Drill-down Temporal por Asset

<!--
  App: XPTO (Cognite Flows — treinamento Radix)
  externalId: xpto-app
  infra: appsApi
  Tier: 1
  Escopo: feature NOVA e separada (specs/). Numeração FR/SC própria desta spec.
  Referencia o SPEC.md raiz (FR-001..FR-015 / SC-001..SC-006) quando estende comportamento existente.
-->

> **Resumo.** Esta feature adiciona ao dashboard do XPTO dois gráficos focados na qualidade das rondas de chão de fábrica: (1) um gráfico **instantâneo** que mostra a quantidade de itens de checklist classificados como **OK** vs **Not Ok**, e (2) um gráfico **ao longo do tempo** de OK/Not Ok com escala visual selecionável (**7 dias**, **30 dias** ou **12 meses**, com granularidade adequada a cada escala). Ao clicar num ponto/barra (uma combinação x,y) do gráfico temporal, todos os demais componentes da tela (KPIs, tabela, drawer e o outro gráfico) são recortados (**cross-filtering**) conforme aquela seleção, e o usuário pode ver **quais são os assets** correspondentes àquele ponto/barra (**drill-down**). O dashboard, o drawer e os filtros por status e área já existem no app e são tratados aqui como contexto de integração. A feature é **somente leitura** sobre o CDF, com agregação **client-side** sobre os dados já carregados, e a seleção/escala dos gráficos é **host-synced** (sobrevive a reload e a link compartilhado).

## User Scenarios & Testing

### User Stories

1. Como **gerente de times de chão de fábrica**, quero ver de relance quantos itens de ronda estão **OK** versus **Not Ok** para avaliar rapidamente a saúde operacional do período em foco.
2. Como **gerente de times de chão de fábrica**, quero ver a evolução de **OK/Not Ok ao longo do tempo** e poder alternar a escala entre **7 dias**, **30 dias** e **12 meses** para identificar tendências de qualidade em diferentes horizontes.
3. Como **gerente de times de chão de fábrica**, quero **clicar num ponto ou barra** do gráfico temporal (uma combinação data × status) para que **todos os outros componentes da tela** (KPIs, tabela, gráfico instantâneo e drawer) sejam **filtrados** por aquela informação, sem precisar reconfigurar filtros manualmente.
4. Como **gerente de times de chão de fábrica**, quero **descobrir quais assets** estão por trás de um ponto/barra selecionado para saber **onde** atuar (qual equipamento/área concentra problemas).
5. Como **gerente de times de chão de fábrica**, quero **limpar a seleção** do gráfico com um clique para voltar à visão completa do período.
6. Como **gerente de times de chão de fábrica**, quero **compartilhar um link** (ou recarregar a página) e reencontrar a **mesma escala e a mesma seleção de gráfico**, para discutir o mesmo recorte com a minha equipe.
7. Como **gerente de times de chão de fábrica**, quero que os gráficos sejam **legíveis sem depender só de cor** (texto, legenda, rótulos, aria) para que toda a equipe consiga interpretá-los.

### Acceptance Scenarios

- **Gráfico instantâneo OK vs Not Ok** — Dado que estou no dashboard com dados carregados e filtros vigentes, quando o gráfico instantâneo é exibido, então vejo a quantidade de itens **OK** e a quantidade de itens **Not Ok** (contagens derivadas de `classifyItemStatus`), com rótulos numéricos e legenda textual, computadas sobre os itens já filtrados (estende FR-006 do SPEC.md).

- **Comportamento-default das contagens OK vs Not Ok** — Dado que o recorte atual contém itens classificados como `ok`, `not_ok`, `blocked`, `pendente` ou `em_andamento`, quando o gráfico instantâneo renderiza, então exibe **OK** (balde `ok`) e **Not Ok** (balde `not_ok`) conforme pedido pelo PO, e os demais baldes (`blocked`, `pendente`, `em_andamento`) são apresentados como uma categoria **"outros"** rotulada e contável — enquanto a Clarification #2 não define tratamento distinto, nenhum item é silenciosamente omitido das contagens.

- **Troca de escala temporal** — Dado que estou vendo o gráfico ao longo do tempo na escala padrão, quando seleciono **7 dias**, **30 dias** ou **12 meses**, então o gráfico reagrega e replota OK/Not Ok com a granularidade correspondente (7d → bins diários; 30d → bins diários ou semanais; 12 meses → bins mensais), e a escala escolhida é persistida no estado host-synced.

- **Cross-filtering por clique no ponto/barra** — Dado o gráfico temporal exibido, quando clico num ponto/barra correspondente a uma combinação (data/bucket temporal × status OK ou Not Ok), então KPIs, tabela, gráfico instantâneo e drawer passam a refletir apenas os itens daquele bin temporal e daquele status, e a seleção fica visualmente destacada no gráfico.

- **Drill-down de assets** — Dado que cliquei num ponto/barra do gráfico temporal, quando consulto a área de drill-down, então vejo a lista dos assets (via `item.asset` → `cdf_core:Asset/v2`, com `externalId`/`title`) cujos itens compõem aquela seleção, sem duplicatas, ordenada e contável.

- **Limpar seleção** — Dado que existe uma seleção de gráfico ativa, quando aciono **Limpar seleção**, então o destaque some, os demais componentes voltam ao recorte definido apenas pelos filtros vigentes, e o estado host-synced reflete a ausência de seleção.

- **Persistência via host-sync (reload/link)** — Dado que defini uma escala (ex.: 12 meses) e uma seleção (ex.: barra "Not Ok" de um mês), quando recarrego a página ou abro o link compartilhado, então a mesma escala e a mesma seleção são restauradas e a tela reaparece recortada do mesmo modo (estende FR-011 do SPEC.md).

- **Coerência com filtros existentes** — Dado que apliquei filtros por status e por área (comportamento já existente), quando os gráficos renderizam, então as contagens e séries respeitam esses filtros, e a seleção de gráfico compõe com eles (não os substitui silenciosamente).

- **Estado vazio** — Dado que o recorte atual (filtros + seleção) não retorna itens, quando os gráficos renderizam, então exibem um estado vazio explícito (mensagem textual), sem quebrar a tela, e o drill-down de assets mostra "nenhum asset".

- **Estado de carregamento** — Dado que os dados ainda estão carregando (ou em refresh ~30s), quando a tela renderiza, então os gráficos exibem um placeholder/skeleton Aura, sem layout shift abrupto.

- **Estado de erro** — Dado que a leitura do CDF falhou, quando a tela renderiza, então os gráficos exibem uma mensagem de erro legível (sem expor detalhes técnicos crus), preservando os controles de escala.

- **Acessibilidade** — Dado qualquer gráfico, quando navego por teclado/leitor de tela, então cada série/ponto/barra tem rótulo textual e aria que não dependem exclusivamente de cor, e a legenda identifica OK/Not Ok por texto.

## Requirements

### Functional Requirements

- **FR-001** — O sistema **MUST** operar **somente em leitura** sobre o CDF para esta feature (estende FR-001 do SPEC.md): nenhuma escrita, toda agregação dos gráficos é **client-side** sobre os dados já carregados pelo `Group3DataService`/`useChecklistData`.

- **FR-002** — O sistema **MUST** exibir um **gráfico instantâneo** com a **quantidade de itens OK** e a **quantidade de itens Not Ok**, derivando as contagens de `classifyItemStatus` (`OK_VALUES = {ok, completed, done}` → `ok`; `NOT_OK_VALUES = {not ok, not_ok, notok, fail, failed}` → `not_ok`) sobre os `ChecklistItem` no recorte atual. Como comportamento-default enquanto a Clarification #2 não for resolvida, o gráfico **MUST** exibir exatamente **OK** e **Not Ok** conforme o pedido do PO e tratar os demais baldes (`blocked`, `pendente`, `em_andamento`) como categoria **"outros"** rotulada e contável — sem omiti-los silenciosamente. A inclusão de `blocked` em "Not Ok" e o tratamento de `pendente`/`em_andamento` ficam como Clarification. **Nota:** no seed atual não existe nenhum item classificado como `not_ok` nem `blocked` (apenas `ok`, `pendente` e `em_andamento`), de modo que a série **Not Ok** pode aparecer **zerada** com os dados de exemplo.

- **FR-003** — O gráfico instantâneo **MUST** apresentar rótulos numéricos e **legenda textual** de OK e Not Ok, e **MUST** ser computado a partir do mesmo pipeline determinístico que alimenta os KPIs (`computeChecklistItemKpis` / `byItemStatus`), reaproveitando `buildChecklistView` (estende FR-006 do SPEC.md). A classificação **MUST** depender apenas de `classifyItemStatus` (símbolo exportado que encapsula `OK_VALUES`/`NOT_OK_VALUES`), sem depender de constantes não exportadas de `src/domain/item-status.ts`.

- **FR-004** — O sistema **MUST** exibir um **gráfico de OK/Not Ok ao longo do tempo**, com duas séries (OK e Not Ok) plotadas em **bins temporais**.

- **FR-005** — O gráfico temporal **MUST** oferecer uma **escala visual selecionável** entre **7 dias (`7d`)**, **30 dias (`30d`)** e **12 meses (`12m`)**, controlada por um novo conceito de granularidade de visualização (`ChartScale`), **distinto** do `Period` de filtro da lista (`'7d'|'30d'|'90d'|'all'`).

- **FR-006** — O gráfico temporal **MUST** aplicar **granularidade de binning** coerente com a escala: `7d` → bins **diários**; `30d` → bins **diários ou semanais**; `12m` → bins **mensais**. A escolha definitiva (diário vs semanal em 30d) fica como Clarification, com padrão proposto `7d → 1 dia`, `30d → 1 dia`, `12m → 1 mês`.

- **FR-007** — O eixo temporal **MUST** ser ancorado num **timestamp de item do `ChecklistItem`**. A escolha do campo-âncora (`endTime` ISO string — prazo/conclusão planejada — vs `lastUpdatedTime` epoch ms — atualização factual; eventualmente `startTime` ISO string — início de execução) fica como Clarification; todos os três são campos confirmados em `src/types/apm.ts`. O binning **MUST** respeitar o fuso `America/Sao_Paulo` (alinhado a `deadline.ts`/`PLANT_TIME_ZONE`).

- **FR-008** — O sistema **MUST** suportar **cross-filtering por clique no gráfico temporal**: ao clicar num ponto/barra do gráfico temporal (combinação bin temporal × status), **MUST** recortar **todos** os demais componentes da tela — KPIs, tabela, drawer e o gráfico instantâneo — para refletir exatamente aquela seleção. A interatividade **análoga do gráfico instantâneo** (clicar numa fatia OK/Not Ok recortar a tela) é **SHOULD**, condicionada à confirmação da Clarification #6; não é exigida como MUST nesta spec, pois o PO solicitou cross-filtering apenas para o gráfico ao longo do tempo.

- **FR-009** — A seleção de gráfico (cross-filter) **MUST** ser representada como **novo estado host-synced** no `AppState` (ex.: `chartSelection` com `{ scale, bucket?, binStart?, binEnd? }` e `chartScale`), seguindo o padrão existente: campo no `AppState`, type guard próprio em `parseAppState` (tolerante a valores inválidos/ausentes → default), setter semântico no `AppStateContextValue` implementado via `commit()` + `syncToHost` (estende FR-011 do SPEC.md; sem `any`/`as`, conforme CLAUDE.md §7).

- **FR-010** — O sistema **MUST** oferecer **drill-down de assets**: para a seleção ativa, **MUST** listar os **assets distintos** cujos itens compõem aquele ponto/barra, resolvidos via `item.asset` (`AssetSummary` → `externalId`/`title`, mapeado de `cdf_core:Asset/v2`), com contagem e ordenação determinística.

- **FR-011** — O sistema **MUST** oferecer ação **Limpar seleção**, que remove `chartSelection` do estado host-synced e restaura o recorte definido apenas pelos filtros vigentes, mantendo a `chartScale` escolhida.

- **FR-012** — A seleção de gráfico **MUST compor** com os filtros existentes por **status** e **área** (e demais filtros host-synced), sem sobrescrevê-los silenciosamente. Se a Clarification de "cross-filter altera o `Period` da lista" for resolvida como **sim**, a alteração **MUST** ser explícita e host-synced.

- **FR-013** — O sistema **SHOULD** persistir e restaurar **escala + seleção** de forma idempotente via serialização JSON do `AppState` (`serializeAppState`/`parseAppState`), garantindo **forward-compatibility** com links antigos (campos ausentes caem em default).

- **FR-014** — Os gráficos **MUST** ser **acessíveis**: não depender **exclusivamente de cor** para distinguir OK/Not Ok (usar texto, legenda, rótulos e `aria-*`), expor pontos/barras interativos como elementos focáveis por teclado e anunciar a seleção ativa.

- **FR-015** — Os gráficos **MUST** seguir **Aura-first** e os **tokens de marca** definidos em `specs/design.md` (paleta International Paper Green/Clover Green/Sky Blue/etc., papéis semânticos e pares de contraste acessíveis), plugando nos **view-slots** existentes (`DashboardSlot`/`ChecklistListSlot`) via feature-slots, sem introduzir estado local que decida "o que o usuário vê".

- **FR-016** — Os gráficos **MUST** tratar **loading**, **empty** e **erro** com componentes Aura (skeleton/shimmer, mensagem vazia, alerta de erro), preservando os controles de escala e sem layout shift abrupto, coerentes com o refresh periódico (~30s).

- **FR-017** — Como a Aura ^0.1.7 **não** possui primitivos de gráfico, o sistema **MUST** adotar uma estratégia de renderização explícita (SVG/HTML puro mapeando tokens Aura, **ou** biblioteca externa com wrapper de tema mapeando os tokens de marca). A biblioteca/abordagem definitiva fica como Clarification e **MUST** ser registrada antes da implementação (sem `any`/`as`, test-first, DI e ViewModel pattern conforme CLAUDE.md §3/§5/§6/§7).

## Success Criteria

- **SC-001** — Em dados de seed, o gráfico instantâneo exibe contagens de OK e Not Ok **idênticas** às computadas por `computeChecklistItemKpis.byItemStatus` para o mesmo recorte (diferença = 0), e a categoria "outros" soma exatamente os itens `blocked`/`pendente`/`em_andamento` do recorte.

- **SC-002** — A troca de escala entre `7d`/`30d`/`12m` reagrega e replota o gráfico temporal em **≤ 300 ms** sobre o conjunto já carregado (sem nova chamada ao CDF), com o número de bins correto para cada escala.

- **SC-003** — Clicar num ponto/barra do gráfico temporal recorta **100%** dos componentes da tela (KPIs, tabela, gráfico instantâneo, drawer) de forma consistente: a soma das contagens visíveis nos componentes corresponde exatamente à seleção.

- **SC-004** — O drill-down lista os assets **distintos** da seleção sem duplicatas, e a contagem de assets ≤ contagem de itens da seleção; 100% dos assets listados são resolvíveis via `item.asset`.

- **SC-005** — Após reload **ou** abertura de link compartilhado, a **escala** e a **seleção** são restauradas em **100%** dos casos válidos; links sem esses campos (legados) carregam sem erro, caindo em default.

- **SC-006** — Acionar **Limpar seleção** restaura a visão definida pelos filtros em **≤ 1 interação**, e o `AppState` resultante não contém `chartSelection`.

- **SC-007** — Verificação de acessibilidade: cada série/ponto/barra possui rótulo textual + `aria-*`; nenhuma informação de OK/Not Ok é transmitida **apenas** por cor (validado por inspeção e por teste de presença de rótulos).

## Clarifications

1. **Timestamp-âncora do eixo temporal.** Qual campo do `ChecklistItem` ancora o eixo X: `endTime` (prazo/conclusão planejada), `lastUpdatedTime` (atualização factual no CDF) ou `startTime` (início de execução)? Cada opção muda a semântica (vencimentos vs. progresso real). A estratégia de **binning** (dia/semana/mês) é ortogonal a esta escolha e está coberta por FR-006/Clarification #4.

2. **Definição exata de "Not Ok" e tratamento de `pendente`/`em_andamento`.** "Not Ok" considera **apenas** `NOT_OK_VALUES` (`not ok/not_ok/notok/fail/failed`), ou também inclui `blocked`? E o que fazer com `pendente`/`em_andamento` no gráfico instantâneo: agrupá-los na categoria default "outros" (proposta de FR-002), tratá-los como "não-ok", omiti-los, ou exibir como categorias adicionais? **Nota factual:** o seed atual (`seed/app_seed/data/apm-app-data-route-1-seed.json`) não possui nenhum item `not_ok` nem `blocked` — apenas `ok`, `pendente` e `em_andamento` —, então a série Not Ok aparecerá zerada nos dados de exemplo.

3. **`ChartScale` (`7d`/`30d`/`12m`) vs `Period` da lista (`'7d'|'30d'|'90d'|'all'`).** São conceitos distintos (escala de **visualização** vs janela de **filtro**). Confirmar: `ChartScale` é campo **novo** e independente no `AppState`? Existe `12m` no `Period` hoje (não existe) — a escala `12m` do gráfico **altera** o `Period` da lista, ou são desacoplados?

4. **Granularidade de binning por escala.** `7d` → 1 dia ou 6 h? `30d` → 1 dia ou 1 semana? `12m` → 1 mês (confirmar). Padrão proposto: `7d → 1 dia`, `30d → 1 dia`, `12m → 1 mês`.

5. **Cross-filter altera a janela `Period`?** Ao clicar num bin temporal (ex.: um mês na escala `12m`), o recorte deve **também** ajustar o `filters.period` da lista para coincidir com o bin, ou a seleção age como filtro **adicional** sem tocar no `Period`?

6. **Interatividade do gráfico instantâneo (escopo de produto).** O PO solicitou cross-filtering apenas para o gráfico ao longo do tempo; o gráfico instantâneo foi pedido apenas como "gráfico que mostre quantidade de OK e Not Ok", sem interação. Confirmar se clicar numa fatia (OK/Not Ok) deve **(a)** não ter interação, **(b)** apenas destacar localmente, ou **(c)** atualizar a seleção host-synced impactando tabela/KPIs/drawer. (FR-008 trata essa interatividade como **SHOULD** condicional a esta resposta.)

7. **Escopo do drill-down.** Ao clicar, listar **(a)** os assets distintos da seleção (assumido), **(b)** os checklists que contêm aqueles itens, ou **(c)** os itens individuais? E a relação com o drawer existente (FR-007 do SPEC.md, drill-down de item dentro do checklist).

8. **Biblioteca/abordagem de gráfico.** SVG/HTML puro com tokens Aura, **recharts**, **nivo**, ou **visx**? Como expor os tokens de marca de `specs/design.md` à camada de gráfico (CSS variables vs theme object/wrapper)? Decisão obrigatória antes do código.

9. **Volume/performance da agregação temporal.** `12m` com bins diários poderia gerar ~360 pontos; com bins mensais, 12. O `Group3DataService.getChecklists()` traz lista plana. Os itens já carregados (no seed atual: **193 itens / 8 checklists / 36 assets**; em produção, o volume real do space `cognite-flows-grupo-3` — a confirmar, ver Clarification de Volume no SPEC.md raiz) são suficientes para 12 meses, ou é preciso histórico/agregação adicional além do snapshot atual? Confirmar que a agregação **client-side** atende SC-002.

10. **Dimensão dos dados nos gráficos.** As séries OK/Not Ok são de **itens** (`ChecklistItemKpis`) — confirmar que o gráfico não mistura dimensão de **ronda** (`ChecklistKpis`). `MeasurementReading/v4` permanece fora de escopo desta feature.

## Assumptions

- **Somente desktop** (sem otimização mobile específica nesta feature).
- **Somente leitura** sobre o CDF; nenhuma escrita.
- **pt-BR** em toda a UI e rótulos.
- **Polling ~30s** (refresh periódico já existente); os gráficos reagregam sobre o snapshot atual.
- **Agregação client-side** sobre os dados já carregados (`useChecklistData` + `buildChecklistView`), sem novas views/consultas dedicadas a time-series.
- A seleção e a escala dos gráficos são **decisórias de visão** e, portanto, **host-synced** (sobrevivem a reload e link compartilhado), conforme CLAUDE.md §2.
- Reaproveitamento do **pipeline determinístico** existente (`buildChecklistView`, `computeChecklistItemKpis`, `classifyItemStatus`) sem duplicar lógica de classificação, dependendo apenas de símbolos exportados (`classifyItemStatus`, não das constantes privadas `OK_VALUES`/`NOT_OK_VALUES`).

---

## Data Models & CDF Integration *(mandatory)*

### Existing views

- **`cdf_apm:ChecklistItem/v7`** — fonte primária das séries OK/Not Ok. Campos relevantes: `status: string | null` (classificado por `classifyItemStatus`), `startTime`/`endTime` (ISO string | null), `createdTime`/`lastUpdatedTime` (epoch ms), e relação direta `asset → cdf_core:Asset/v2` (`AssetSummary` com `externalId`/`title`) usada no drill-down.
- **`cdf_apm:Checklist/v7`** — contexto de agrupamento (ronda); `status`/`endTime`/`assignedTo`/`rootLocation`. Os gráficos plotam dimensão de **item**, mas a seleção compõe com os filtros de ronda existentes.
- **`cdf_core:Asset/v2`** — alvo do drill-down de assets (`externalId`/`title`).
- **`cdf_apps_shared:CDF_User/v1`** — contexto de atribuição (`assignedTo`), sem papel direto nos gráficos.
- **`cdf_apm:MeasurementReading/v4`** — **fora de escopo** desta feature (condicional, somente se medições forem exibidas no futuro).

> Data model raiz: **`cdf_apm.ApmAppData:v13`**. Não há views novas e nenhuma referência a views `@v13` de Checklist/Item (as views são `@v7`/`@v4`/`@v2`/`@v1`).

### New views

- **Nenhuma.** A feature é **read-only** e a agregação temporal/instantânea, o binning, o cross-filtering e o drill-down são **client-side** sobre os dados já carregados. Não há criação de views, contêineres ou time-series dedicados.

### Spaces

- **`cognite-flows-grupo-3`** — espaço das instâncias, acessado em **modo somente leitura**. Auth/cluster/projeto resolvidos via `@cognite/app-sdk`. Nenhuma escrita é realizada neste ou em qualquer outro space.
