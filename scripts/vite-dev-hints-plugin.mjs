/**
 * Logs URLs locais e abre o Fusion no navegador padrão (Windows-friendly).
 * Complementa fusionOpenPlugin do @cognite/app-sdk.
 */

import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Mesmo segmento usado pelo fusionOpenPlugin do @cognite/app-sdk. */
const FLOWS_SUBAPP_PATH = 'custom-apps';

function openInBrowser(url) {
  if (process.platform === 'win32') {
    spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).unref();
    return;
  }
  const cmd = process.platform === 'darwin' ? 'open' : 'xdg-open';
  spawn(cmd, [url], { detached: true, stdio: 'ignore' }).unref();
}

function buildFusionUrl(port) {
  const appJsonPath = join(process.cwd(), 'app.json');
  if (!existsSync(appJsonPath)) {
    return null;
  }
  const appJson = JSON.parse(readFileSync(appJsonPath, 'utf-8'));
  const deployment = appJson.deployments?.[0];
  const { org, project, baseUrl } = deployment ?? {};
  const cluster = baseUrl?.split('//')[1];
  if (!org || !project || !baseUrl || appJson.infra !== 'appsApi' || !appJson.externalId) {
    return null;
  }
  return `https://${org}.fusion.cognite.com/${project}/${FLOWS_SUBAPP_PATH}/development/${appJson.externalId}/${port}?cluster=${cluster}&workspace=industrial-tools`;
}

export function devServerHintsPlugin() {
  return {
    name: 'xpto-app:dev-server-hints',
    configureServer(server) {
      const previousPrintUrls = server.printUrls;
      server.printUrls = () => {
        const address = server.httpServer?.address();
        const port = address && typeof address === 'object' ? address.port : 3001;
        const localUrl = `https://localhost:${port}/`;
        const fusionUrl = buildFusionUrl(port);

        // No Windows o fusionOpenPlugin usa `explorer`, que não abre URLs HTTPS no navegador.
        if (process.platform !== 'win32' && typeof previousPrintUrls === 'function') {
          previousPrintUrls();
        } else if (fusionUrl) {
          server.config.logger.info(`  ➜  Fusion: ${fusionUrl}`);
        }

        server.config.logger.info('');
        server.config.logger.info(`  ➜  Local (iframe do Fusion): ${localUrl}`);
        server.config.logger.info(
          '  ➜  Mantenha `npm start` rodando e use o link Fusion (auth só funciona no host).'
        );
        server.config.logger.info(
          '  ➜  Se o iframe falhar: abra o Local acima, aceite o certificado (Avançado → Continuar), depois recarregue o Fusion.'
        );
        server.config.logger.info(
          '  ➜  Certificado confiável (opcional): instale mkcert (`choco install mkcert`) e rode `npm run setup-https`.'
        );
        server.config.logger.info('');

        if (fusionUrl && process.env.XPTO_SKIP_OPEN !== '1') {
          openInBrowser(fusionUrl);
        }
      };
    },
  };
}
