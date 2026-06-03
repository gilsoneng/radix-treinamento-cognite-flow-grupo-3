/** Texto do horário da última atualização (ou ausência dela). Puro e testável sem render. */
export function formatLastUpdatedLabel(lastUpdatedAt: number | null): string {
  if (lastUpdatedAt === null) return 'Sem atualização ainda';
  const time = new Date(lastUpdatedAt).toLocaleTimeString('pt-BR');
  return `Atualizado às ${time}`;
}
