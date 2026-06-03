/**
 * Vocabulário compartilhado dos gráficos de OK/Not Ok
 * (spec `specs/feature-graficos-ok-notok-drilldown.md`).
 *
 * Apenas TIPOS + constantes de validação — a lógica (binning, agregação, drill-down) vive
 * em `charts.ts`. Mantido fora de `types.ts` para não inflar o vocabulário de checklist, mas
 * segue a mesma regra: tanto o estado host-synced (`AppState`) quanto os ViewModels do
 * dashboard dependem deste mesmo conjunto. Mudar algo aqui exige alinhar o time.
 */

/** Escala VISUAL do gráfico temporal — distinta do `Period` de filtro da lista (FR-005). */
export type ChartScale = '7d' | '30d' | '12m';

/** As duas séries plotadas/clicáveis do gráfico. "outros" não é série (ver `charts.ts`). */
export type ChartResult = 'ok' | 'not_ok';

export const CHART_SCALES: readonly ChartScale[] = ['7d', '30d', '12m'];
export const CHART_RESULTS: readonly ChartResult[] = ['ok', 'not_ok'];

/** Escala padrão ao abrir o dashboard (alinhada à janela padrão de 30 dias da lista). */
export const DEFAULT_CHART_SCALE: ChartScale = '30d';

/**
 * Seleção host-synced feita ao clicar num ponto/barra do gráfico temporal (FR-008/009).
 *
 * Carrega o INTERVALO do bin em epoch ms (não só um índice), de modo que o cross-filter
 * independa da escala exibida no momento e sobreviva a reload / link compartilhado.
 */
export interface ChartSelection {
  /** Escala em que a seleção foi feita (contexto para rotular e realçar). */
  scale: ChartScale;
  /** Início do bin (epoch ms, inclusivo). */
  binStart: number;
  /** Fim do bin (epoch ms, exclusivo). */
  binEnd: number;
  /** Série clicada (`ok` ou `not_ok`). */
  result: ChartResult;
  /** Rótulo legível do bin para exibição (ex.: "12/05" ou "mai/26"). */
  binLabel: string;
}
