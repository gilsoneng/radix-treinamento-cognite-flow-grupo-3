# Daily — DEV 2, 3 e 4 (em linguagem simples)

> O que foi construído nesta atividade, explicado para qualquer pessoa. Fecha o app: agora
> ele mostra os gráficos, a tabela de rondas e o detalhe — usando os dados reais da Cognite.

## Em uma frase

Pegamos a "fundação" que a DEV 1 deixou pronta e construímos por cima dela **o que o gerente
realmente vê e usa**: indicadores no topo, filtros, a tabela de rondas e a tela de detalhe
de cada ronda. O aplicativo agora está **completo e funcionando de ponta a ponta**.

## Voltando à analogia do carro

- A **DEV 1** entregou o chassi, o motor e o painel (o carro liga e anda).
- A **DEV 2** construiu o **"cérebro"**: as regras que decidem o que cada número significa.
- A **DEV 3** montou o **painel de instrumentos** (os indicadores e os filtros).
- A **DEV 4** montou os **bancos e o acabamento** (a tabela de rondas e a tela de detalhe).

Agora o carro está pronto para dirigir.

## O que cada frente fez

### DEV 2 — o "cérebro" (regras de negócio) — já estava pronto, conferimos

São contas e classificações, sem tela:
- Decide o **status** de cada ronda: *Aberto*, *Em andamento*, *Atrasado* ou *Concluído*
  (atrasado = passou do prazo e não terminou).
- Calcula os **indicadores**: quantas abertas, quantas atrasadas, **% no prazo (SLA)**,
  e a distribuição por status, prioridade e área.
- Sabe **filtrar**, **buscar** e **ordenar** a lista de rondas.
- Conferimos: **98 testes automatizados passando**, tudo certo.

### DEV 3 — o painel de instrumentos (Dashboard + Filtros)

- **Cartões de indicadores** no topo: *Rondas abertas*, *Rondas atrasadas*,
  *No prazo (SLA)* e *Tarefas abertas*. O de "atrasadas" tem cor **e** ícone **e** texto
  (acessível — nunca só cor).
- **Distribuições** em barras: por status, por prioridade e por área.
- **Barra de filtros**: por status, prioridade, "somente atrasados", período (padrão:
  últimos 30 dias), área, **busca** por texto e **ordenação**. Tudo o que você filtra vale
  para os dois lugares ao mesmo tempo (gráficos e tabela) e **fica salvo no link**.

### DEV 4 — a tabela e o detalhe

- **Tabela de rondas** com título, responsável, status, prazo, prioridade e área. Dá para
  **ordenar** clicando nos cabeçalhos, e as **atrasadas ficam destacadas** (faixa + selo
  com texto e ícone).
- **Tela de detalhe** (abre pela lateral ao clicar numa ronda): mostra as **tarefas** da
  ronda, cada uma com seu status (OK / Not OK / Bloqueado / Pendente), o equipamento e as
  medições quando existem. Fecha no "X" ou apertando **Esc**.
- Tudo "lembra do lugar": a ronda aberta volta a abrir ao recarregar ou compartilhar o link.

## Como sabemos que está funcionando

- **137 testes automatizados passam** (os 98 do "cérebro" + os novos das telas).
- A verificação de tipos do código passa **sem erros**.
- A análise de qualidade/estilo (lint) passa **sem apontamentos** no nosso código.
- O **aplicativo compila** para produção com sucesso.

## Como foi construído (boas práticas)

- **Aura primeiro** (a biblioteca de componentes oficial) e as **cores da marca**; quando a
  Aura não tinha o componente (tabela, alguns seletores, o painel lateral), usamos elementos
  padrão de mercado, sempre acessíveis e com as cores da marca.
- Cada tela tem um **"ViewModel"** que concentra a lógica; os componentes só desenham.
- Nada que decide o que aparece fica "solto": tudo passa pela memória compartilhada da
  DEV 1, por isso o link compartilhado e o recarregar funcionam.

> Resultado: o **Painel de Action Items de Chão de Fábrica** está completo — do dado bruto na
> Cognite até os indicadores, a lista e o detalhe que o gerente usa no dia a dia.
