/**
 * Relógio injetável (DI, CLAUDE.md §3): `Date.now` é uma dependência não-determinística,
 * então os ViewModels o recebem por contexto e os testes passam um relógio fixo. As funções
 * de domínio (DEV 2) recebem `now: number` — os ViewModels chamam `clock()` uma vez por
 * recomputação e repassam, mantendo a classificação de "atrasado"/SLA estável e testável.
 */

export type Clock = () => number;

export const systemClock: Clock = () => Date.now();
