# Feature Specification: Painel de Action Items de Chão de Fábrica (Checklists)

<!--
  Spec viva deste app (Cognite Flows). Edite diretamente ou peça ao agente para
  colaborar. App externalId: `xpto-app` · Infra: appsApi · Tier 1 (Monitoring & reporting).
-->

> **Resumo.** App somente leitura que dá ao gerente de times de chão de fábrica uma
> visão unificada e quase em tempo real do status das rondas (Checklists) e suas
> tarefas (ChecklistItems) do data model **APMAppData (v13)**, eliminando a
> consolidação manual de planilhas/e-mails e as perdas na passagem de turno.

## User Scenarios & Testing

### User Stories

1. Como **gerente de times de chão de fábrica**, quero ver num único painel o status de todas as rondas (Checklists) das equipes, para acompanhar prazos, responsáveis e conclusão sem consolidar planilhas e e-mails manualmente.
2. Como **gerente**, quero filtrar as rondas por status, por prazo (incl. "somente atrasadas"), por prioridade e por ativo/área, para focar imediatamente no que exige ação.
3. Como **gerente**, quero abrir uma ronda e ver suas tarefas (ChecklistItems) com status individual, para entender onde a ronda está travada.
4. Como **gerente**, quero KPIs no topo (abertos, atrasados, % no prazo, distribuição por status e por prioridade/área), para ter o pulso da operação em segundos.
5. Como **gerente em troca de turno**, quero que o painel atualize automaticamente (~30s) e destaque os itens atrasados, para que nada seja perdido na passagem de turno.
6. Como **gerente**, quero que, ao recarregar a página ou abrir um link compartilhado, o painel reabra na mesma visão (filtros, ordenação, ronda selecionada), para não refazer o contexto.

### Acceptance Scenarios

- **Visão consolidada** — Dado que existem rondas no APMAppData, quando o gerente abre o app, então vê o dashboard de KPIs e a lista de Checklists carregada com título, responsável, status, prazo, prioridade e ativo/área.
- **Destaque de atrasados** — Dada uma ronda com prazo vencido e não concluída, quando a lista é exibida, então ela é classificada como **Atrasado** e destacada visualmente (badge + texto/ícone, não só cor) e somada ao contador de atrasados.
- **Filtro combinável** — Dado o filtro "somente atrasados" + uma área específica, quando ambos são aplicados, então a lista e os KPIs refletem apenas as rondas atrasadas daquela área.
- **Detalhe da ronda** — Dado que o gerente seleciona uma Checklist, quando o detalhe abre, então são listados os ChecklistItems daquela ronda com status individual (ex.: OK / Not OK / Blocked / pendente), ativo e medição quando houver.
- **Atualização automática** — Dado o app aberto por mais de 30s, quando o intervalo de atualização expira, então os dados são recarregados e o horário de "última atualização" é atualizado; o gerente também pode forçar via botão de refresh.
- **Persistência de estado** — Dado que o gerente aplicou filtros e selecionou uma ronda, quando recarrega a página ou abre o link compartilhado, então a mesma visão (filtros, ordenação, seleção) é restaurada.
- **Estados de borda** — Dado que a consulta ao CDF falha ou não há rondas no período, quando a tela renderiza, então é exibida uma mensagem de erro (Aura `Alert`) ou um estado vazio claro, sem travar a UI.

## Requirements

### Functional Requirements

- **FR-001:** O sistema MUST ler rondas (Checklist) e suas tarefas (ChecklistItem) do data model **APMAppData (v13)** em modo **somente leitura** — sem criar, editar ou excluir instâncias no CDF.
- **FR-002:** O sistema MUST exibir um dashboard de topo com os KPIs: (a) contador de itens **abertos**; (b) contador de itens **atrasados**; (c) **% concluído no prazo (SLA)**; (d) **distribuição por status**; (e) **distribuição por prioridade** e **por área/ativo**.
- **FR-003:** O sistema MUST exibir uma tabela/lista de Checklists contendo, no mínimo: título, responsável (`assignedTo`), status, prazo, prioridade e ativo/área.
- **FR-004:** O sistema MUST classificar cada Checklist em um dos baldes de status: **Aberto/a fazer**, **Em andamento**, **Atrasado**, **Concluído**. "Atrasado" = prazo vencido **e** não concluído.
- **FR-005:** O sistema MUST destacar visualmente os itens **Atrasados** (badge/cor) pareando sempre com texto e/ou ícone — nunca apenas cor (acessibilidade, conforme `specs/design.md`).
- **FR-006:** O sistema MUST permitir **filtrar** a lista por **status**, por **prazo** (incluindo "somente atrasados"), por **prioridade** e por **ativo/área**. Os filtros MUST ser combináveis e refletir-se também nos KPIs.
- **FR-007:** Ao selecionar uma Checklist, o sistema MUST abrir um **detalhe** (drawer/expansão) listando os ChecklistItems daquela ronda com status individual (ex.: OK / Not OK / Blocked / pendente), ativo e medição quando houver.
- **FR-008:** O sistema MUST atualizar os dados **automaticamente a cada ~30s** e oferecer um **botão de atualização manual**, indicando o horário da última atualização.
- **FR-009:** A **janela de dados padrão** ao abrir MUST ser: itens abertos + itens dos últimos **30 dias**. O usuário pode ampliar/alterar via filtro de período.
- **FR-010:** O sistema MUST permitir **ordenar** a lista no mínimo por **prazo** e por **status**.
- **FR-011:** O sistema MUST sincronizar com o host (`syncInternalState` / `initialState`) todo o estado que decide o que o usuário vê — visão ativa (dashboard/lista), filtros aplicados, ordenação, busca e ronda selecionada / detalhe aberto — de modo a sobreviver a reload e a links compartilhados. Esse estado MUST NOT viver apenas em `useState`/`useRef` locais (ver `CLAUDE.md` §2).
- **FR-012:** O sistema MUST tratar estados de **carregamento**, **vazio** e **erro** (falha ao conectar ao host ou consultar o CDF) com componentes Aura (`Loader`, `Alert`), sem quebrar a tela.
- **FR-013:** O sistema MUST obter cluster/projeto/token via `@cognite/app-sdk` (`CogniteSdkProvider` / `useCogniteSdk`), sem hardcode de URL ou projeto.
- **FR-014:** O sistema SHOULD oferecer **busca textual** por título da ronda e/ou ativo, complementando os filtros.
- **FR-015:** O sistema MUST seguir a paleta de marca e os tokens semânticos definidos em `specs/design.md`, priorizando componentes Aura sobre markup/Tailwind cru.

## Success Criteria

- **SC-001:** O gerente consolida o status dos action items em **< 5 minutos** (vs. ~30 min hoje), medido em teste com usuário.
- **SC-002:** **100% das rondas abertas** no período aparecem num único painel, com responsável e prazo visíveis.
- **SC-003:** Itens **atrasados** são identificáveis em **< 5 segundos** após abrir o app (contador + destaque na lista).
- **SC-004:** **Zero rondas perdidas na passagem de turno**: toda ronda aberta aparece com responsável e status atualizados a cada ≤ 30s.
- **SC-005:** O **% no prazo (SLA)** é exibido e atualizado a cada refresh; meta operacional a definir (ex.: ≥ 90% — ver Clarifications).
- **SC-006:** Recarregar a página ou abrir um **link compartilhado** restaura a mesma visão (filtros, ordenação, seleção) em 100% dos casos.

## Clarifications

<!-- Resolver antes/junto ao planejamento. -->

- **Prioridade:** Checklists no APMAppData v13 podem não ter prioridade nativa. Confirmar no modelo do `radix-dev` se a prioridade está na própria Checklist, no Template/Activity associado, ou se deve ser **derivada** (atraso/criticidade do ativo). *(Resposta do usuário: "confirmar no modelo".)*
- **Definição de "prazo":** qual propriedade representa o prazo da ronda (`endTime` planejado, `dueDate`, outro)? E o que conta como "no prazo" para o SLA (concluída antes de qual data)?
- **Equipe/turno:** `assignedTo` aponta para usuário/disciplina. Há campo de **turno/equipe** para agrupar, ou precisamos mapear a partir de `assignedTo`?
- **Área/ativo:** a "área" vem do `assetExternalId` do ChecklistItem, do `rootLocation` da Checklist, ou da hierarquia de ativos? Como agrupar "por área"?
- **Nomes/versões exatos:** confirmar as versões das views `Checklist` e `ChecklistItem` dentro do APMAppData v13 e os nomes precisos das propriedades.
- **Meta de SLA:** qual percentual de "no prazo" é considerado saudável (alvo do SC-005)?
- **Volume:** quantas checklists/itens são esperados? Define paginação e estratégia de consulta para manter o refresh de 30s performático.

## Assumptions

- Suporte **somente desktop** no v1 (gerente trabalha em escritório); responsividade mobile fora de escopo.
- App **somente leitura**: nenhuma escrita no CDF.
- Autenticação, cluster e projeto resolvidos pelo `@cognite/app-sdk`; nada hardcoded.
- UI em **português (pt-BR)** e horário local da planta.
- "Tempo real" é atendido por **polling de ~30s** (não streaming/websocket).

---

## Data Models & CDF Integration *(mandatory)*

### Existing views

CDF views que o app lê (formato `<space>.<view>:<version>` — confirmar a versão exata de cada view dentro do APMAppData v13):

- **`APMAppData.Checklist:v13`** — ronda / operator round. Propriedades de interesse (confirmar nomes na v13): `title`, `description`, `status`, `assignedTo`, `startTime`, `endTime`/`dueDate` (prazo), `rootLocation`, `templateExternalId`, `createdTime`/`lastUpdatedTime`.
- **`APMAppData.ChecklistItem:v13`** — tarefa dentro da ronda. Propriedades: `title`/`name`, `status` (OK / Not OK / Blocked / pendente), `order`, `assetExternalId` (ativo/área), referência à Checklist pai e à(s) medição(ões).
- **`APMAppData.Measurement:v13`** *(condicional)* — leituras associadas a itens, se exibirmos medições no detalhe (FR-007).
- **`APMAppData.Template:v13`** / **`APMAppData.Activity:v13`** *(condicional)* — apenas se a **prioridade** vier do Template/Activity (ver Clarifications). Sem isso, não serão consultadas.

### New views

- **Nenhuma** view nova no v1. O app é somente leitura sobre views existentes do APMAppData. Caso a prioridade não exista nativamente, ela será **derivada** (atraso/criticidade) — sem criar view nova.

### Spaces

- **`APMAppData`** — space do data model e (conforme definido) das instâncias de checklist lidas pelo app. Acesso **somente leitura**. *(Confirmar se há um root location / instance space distinto — ver Clarifications.)*
