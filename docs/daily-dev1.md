# Daily — DEV 1 (em linguagem simples)

> O que a DEV 1 construiu nesta atividade, explicado para qualquer pessoa — sem jargão.

## Em uma frase

Montamos o **"esqueleto" do aplicativo**: a parte que liga o app à plataforma da Cognite,
busca as rondas de fábrica, atualiza sozinho a cada ~30 segundos e "lembra" da tela em que
você estava. Ainda não são os gráficos e a tabela finais — esses ficam com a DEV 3 e a DEV 4 —
mas tudo o que eles precisam para começar já está pronto e funcionando.

## Uma analogia

Pense num carro:

- A **DEV 1 (nós)** entregou o **chassi, o motor e o painel**: o carro liga, anda e os
  ponteiros funcionam.
- A **DEV 2** está construindo o "cérebro" que decide o que cada número significa
  (o que está atrasado, o quanto está no prazo).
- A **DEV 3** e a **DEV 4** vão montar os **bancos e o acabamento** (os gráficos bonitos e a
  tabela de rondas) — encaixando nas conexões que já deixamos prontas.

## O que isso resolve (o problema do gerente)

O gerente de chão de fábrica hoje junta planilhas e e-mails na mão para saber o status das
rondas. O app vai mostrar tudo num só lugar. Nesta etapa garantimos que **o app abre,
conversa com a Cognite, traz os dados reais e se mantém atualizado** — a fundação para tudo
o que vem depois.

## O que foi feito, em miúdos

1. **Conexão com a plataforma (o "aperto de mão").** O app se apresenta à Cognite e recebe
   permissão e endereço corretos automaticamente — nada é digitado ou "chumbado" no código.

2. **Memória da tela (link compartilhável).** Filtros, ordenação, busca e a ronda aberta
   ficam guardados no endereço (URL). Se você **recarregar a página** ou **mandar o link
   para um colega**, ele abre na **mesma tela**. Também é à prova de links antigos: se algo
   no endereço estiver estranho, o app não quebra — ele volta ao padrão.

3. **Busca de dados automática.** O app traz as rondas da Cognite e **se atualiza sozinho a
   cada ~30 segundos**. Tem também um botão **"Atualizar"** e mostra o **horário da última
   atualização**, para nada se perder na troca de turno.

4. **Tela base (o layout).** Cabeçalho com o título, um seletor para alternar entre
   **"Dashboard"** e **"Lista"**, e a área principal de conteúdo. Tudo usando o **design da
   marca** (as cores e componentes oficiais).

5. **Mensagens claras quando algo acontece.** Se estiver **carregando**, aparece um aviso de
   carregamento; se **der erro** na Cognite, aparece um aviso de erro legível; se **não houver
   rondas**, aparece "Nenhuma ronda no período". A tela nunca trava nem fica em branco.

6. **Espaços reservados para os colegas.** Onde entram os gráficos (DEV 3) e a tabela (DEV 4),
   deixamos "caixas" temporárias que **já mostram a quantidade real de rondas vinda da
   Cognite** — prova de que o encanamento funciona de ponta a ponta.

## Como sabemos que está funcionando

- **63 testes automatizados passam** (29 que já existiam + **34 novos** que escrevemos).
- A verificação de tipos do código (uma checagem de qualidade) passa **sem erros**.
- Todo o código novo passa na análise de estilo/qualidade (lint) **sem apontamentos**.

> Em resumo: a base do app está **de pé, testada e pronta** para a DEV 3 e a DEV 4
> construírem as telas finais por cima — sem precisar mexer no que fizemos.

## O que NÃO entrou nesta etapa (de propósito)

- Os **cálculos de negócio** (o que é "atrasado", o "% no prazo", os KPIs) → são da **DEV 2**.
- Os **gráficos do dashboard** e a **barra de filtros** → são da **DEV 3**.
- A **tabela de rondas** e a **tela de detalhe** → são da **DEV 4**.

Os detalhes técnicos do que deixamos pronto para esses colegas estão em
[dev-1-para-outros-devs.md](dev-1-para-outros-devs.md).
