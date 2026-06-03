import { readFileSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(scriptDir, '..');
const envPath = join(projectRoot, '.env');
const configPath = join(scriptDir, 'cdf-mcp.config.json');

function loadEnvFile(path) {
  if (!existsSync(path)) {
    throw new Error(`Missing ${path}. Copy .env.example to .env and fill in your credentials.`);
  }

  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function mapCdfEnv() {
  const mappings = [
    ['CDF_CLIENT_ID', 'IDP_CLIENT_ID'],
    ['CDF_CLIENT_SECRET', 'IDP_CLIENT_SECRET'],
    ['CDF_TENANT_ID', 'IDP_TENANT_ID'],
    ['CDF_TOKEN_URL', 'IDP_TOKEN_URL'],
    ['CDF_CLUSTER', 'CDF_CLUSTER'],
    ['CDF_PROJECT', 'CDF_PROJECT'],
  ];

  for (const [targetKey, sourceKey] of mappings) {
    const value = process.env[targetKey] ?? process.env[sourceKey];
    if (typeof value === 'string' && value.length > 0) {
      process.env[targetKey] = value;
    }
  }

  const requiredKeys = [
    'CDF_CLIENT_ID',
    'CDF_CLIENT_SECRET',
    'CDF_TENANT_ID',
    'CDF_CLUSTER',
    'CDF_PROJECT',
  ];

  const missingKeys = requiredKeys.filter((key) => !process.env[key]);
  if (missingKeys.length > 0) {
    throw new Error(`Missing required environment variables: ${missingKeys.join(', ')}`);
  }
}

function applyMcpConfig() {
  const config = JSON.parse(readFileSync(configPath, 'utf8'));

  if (!process.env.CDF_DATA_MODELS && Array.isArray(config.dataModels)) {
    process.env.CDF_DATA_MODELS = JSON.stringify(config.dataModels);
  }

  if (!process.env.CDF_INSTANCE_SPACES && Array.isArray(config.instanceSpaces)) {
    process.env.CDF_INSTANCE_SPACES = JSON.stringify(config.instanceSpaces);
  }
}

function resolveMcpCommand() {
  if (process.platform === 'win32') {
    return 'cog-mcp-experimental.exe';
  }

  return 'cog-mcp-experimental';
}

loadEnvFile(envPath);
mapCdfEnv();
applyMcpConfig();

const child = spawn(resolveMcpCommand(), [], {
  cwd: projectRoot,
  env: process.env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

child.on('error', (error) => {
  console.error(
    error instanceof Error
      ? `${error.message}\nInstall the MCP server with: pip install cog-mcp-experimental`
      : error
  );
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
