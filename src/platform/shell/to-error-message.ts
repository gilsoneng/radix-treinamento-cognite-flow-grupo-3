/** Extrai uma mensagem legível de um erro `unknown` (sem vazar stack/segredos). */
export function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'Não foi possível consultar o CDF. Tente atualizar em instantes.';
}
