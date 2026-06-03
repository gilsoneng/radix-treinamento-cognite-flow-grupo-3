async function getAccessToken() {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.IDP_CLIENT_ID ?? '',
    client_secret: process.env.IDP_CLIENT_SECRET ?? '',
    scope: process.env.IDP_SCOPES ?? '',
  });

  if (process.env.IDP_AUDIENCE) {
    body.set('audience', process.env.IDP_AUDIENCE);
  }

  const tokenResponse = await fetch(process.env.IDP_TOKEN_URL ?? '', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!tokenResponse.ok) {
    throw new Error(`Token request failed (${tokenResponse.status}): ${await tokenResponse.text()}`);
  }

  const tokenPayload = await tokenResponse.json();
  if (typeof tokenPayload.access_token !== 'string') {
    throw new Error('Token response did not include access_token');
  }

  return tokenPayload.access_token;
}

function getBaseUrl() {
  if (process.env.CDF_URL) {
    return process.env.CDF_URL.replace(/\/$/, '');
  }

  if (process.env.CDF_CLUSTER) {
    return `https://${process.env.CDF_CLUSTER}.cognitedata.com`;
  }

  throw new Error('Missing CDF_URL or CDF_CLUSTER');
}

async function main() {
  const project = process.argv[2] ?? process.env.CDF_PROJECT ?? 'cognitecore';
  const token = await getAccessToken();
  const baseUrl = getBaseUrl();
  const assetsUrl = `${baseUrl}/api/v1/projects/${encodeURIComponent(project)}/assets?limit=1`;

  const assetsResponse = await fetch(assetsUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!assetsResponse.ok) {
    throw new Error(`Assets request failed (${assetsResponse.status}): ${await assetsResponse.text()}`);
  }

  const assetsPayload = await assetsResponse.json();
  const firstAsset = Array.isArray(assetsPayload.items) ? assetsPayload.items[0] : undefined;

  if (!firstAsset) {
    console.log(JSON.stringify({ project, message: 'No assets found' }, null, 2));
    return;
  }

  console.log(JSON.stringify(firstAsset, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
