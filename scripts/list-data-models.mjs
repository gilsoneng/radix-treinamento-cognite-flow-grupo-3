import { readFileSync } from 'node:fs';

function loadEnv(path) {
  const env = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

async function getAccessToken(env) {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: env.IDP_CLIENT_ID ?? '',
    client_secret: env.IDP_CLIENT_SECRET ?? '',
    scope: env.IDP_SCOPES ?? '',
  });

  if (env.IDP_AUDIENCE) {
    body.set('audience', env.IDP_AUDIENCE);
  }

  const tokenResponse = await fetch(env.IDP_TOKEN_URL ?? '', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!tokenResponse.ok) {
    throw new Error(
      `Token request failed (${tokenResponse.status}): ${await tokenResponse.text()}`
    );
  }

  const tokenPayload = await tokenResponse.json();
  if (typeof tokenPayload.access_token !== 'string') {
    throw new Error('Token response did not include access_token');
  }

  return tokenPayload.access_token;
}

function getBaseUrl(env) {
  if (env.CDF_URL) {
    return env.CDF_URL.replace(/\/$/, '');
  }

  if (env.CDF_CLUSTER) {
    return `https://${env.CDF_CLUSTER}.cognitedata.com`;
  }

  throw new Error('Missing CDF_URL or CDF_CLUSTER');
}

async function main() {
  const env = loadEnv('.env');
  const token = await getAccessToken(env);
  const baseUrl = getBaseUrl(env);
  const project = env.CDF_PROJECT ?? 'cognitecore';

  const headers = {
    Authorization: `Bearer ${token}`,
    'cdf-version': 'alpha',
  };

  const spacesUrl = `${baseUrl}/api/v1/projects/${encodeURIComponent(project)}/models/spaces?limit=100`;
  const spacesResponse = await fetch(spacesUrl, { headers });

  if (!spacesResponse.ok) {
    throw new Error(
      `Spaces request failed (${spacesResponse.status}): ${await spacesResponse.text()}`
    );
  }

  const spacesPayload = await spacesResponse.json();
  const spaces = Array.isArray(spacesPayload.items) ? spacesPayload.items : [];

  const dataModels = [];

  const targetSpaces = process.argv.slice(2);
  const spacesToScan =
    targetSpaces.length > 0
      ? spaces.filter((s) => targetSpaces.includes(s.space))
      : spaces.slice(0, 10);

  for (const space of spacesToScan) {
    const modelsUrl = `${baseUrl}/api/v1/projects/${encodeURIComponent(project)}/models/datamodels?space=${encodeURIComponent(space.space)}&limit=100`;
    const modelsResponse = await fetch(modelsUrl, { headers });

    if (!modelsResponse.ok) {
      continue;
    }

    const modelsPayload = await modelsResponse.json();
    const items = Array.isArray(modelsPayload.items) ? modelsPayload.items : [];

    for (const model of items) {
      dataModels.push({
        space: model.space,
        externalId: model.externalId,
        version: model.version ?? '1',
        name: model.name ?? model.externalId,
      });
    }
  }

  console.log(
    JSON.stringify(
      {
        project,
        cluster: env.CDF_CLUSTER,
        instanceSpaces: spaces.map((s) => s.space),
        dataModels,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
