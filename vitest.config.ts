import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['vitest.setup.ts'],
    // Testa apenas o código da app; ignora skills/refs vendorizados (.agents, .cursor, .claude).
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      // Mede só o código da app (exclui skills/scripts vendorizados) para o gate de 80% ser significativo.
      include: ['src/**'],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/__fixtures__/**',
        '**/*.d.ts',
        'src/main.tsx', // bootstrap (exceção §6)
        // Arquivos somente-tipo (interfaces/entidades): sem código executável a cobrir.
        'src/types/**',
        'src/services/group3/checklist-data-gateway.ts',
      ],
    },
  },
});
