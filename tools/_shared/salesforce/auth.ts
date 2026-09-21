/**
 * Shared Salesforce credential loader for kronos framework-shipped tools.
 *
 * Two credential sources supported at v0.1:
 *   1. File on disk (default): `credentials/salesforce.json` — gitignored
 *      per each tool's `credentials/.gitignore`.
 *   2. Environment variables (fallback): KRONOS_SF_{USERNAME, PASSWORD,
 *      SECURITY_TOKEN, LOGIN_URL}.
 *
 * `redactCredentials()` scrubs the password, security token, and session
 * id from any string before it hits stderr or the run manifest. Every
 * kronos tool that emits credential-adjacent errors must pass its
 * outbound strings through this function.
 *
 * Future: ephemeral scoped credentials via secure channel (FD, UDS,
 * kernel keyring) or secret-broker reference, per TOOL-BINDING.md §Sandbox
 * and isolation.
 */

import { readFileSync, existsSync } from 'node:fs';

export interface SalesforceCredentials {
  username: string;
  password: string;
  securityToken: string;
  loginUrl?: string;
  source: 'file' | 'env';
  sourcePath?: string;
}

export interface LoadCredentialsOptions {
  credentialsPath: string;
  loginUrlOverride?: string;
}

export class CredentialError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'credentials-missing'
      | 'credentials-malformed'
      | 'credentials-incomplete',
  ) {
    super(message);
    this.name = 'CredentialError';
  }
}

export function loadCredentials(opts: LoadCredentialsOptions): SalesforceCredentials {
  if (existsSync(opts.credentialsPath)) {
    return loadFromFile(opts.credentialsPath, opts.loginUrlOverride);
  }
  if (hasEnvCredentials()) {
    return loadFromEnv(opts.loginUrlOverride);
  }
  throw new CredentialError(
    `No credentials found. Provide a JSON file at "${opts.credentialsPath}" ` +
      `or set KRONOS_SF_USERNAME / KRONOS_SF_PASSWORD / KRONOS_SF_SECURITY_TOKEN in the environment.`,
    'credentials-missing',
  );
}

function loadFromFile(path: string, loginUrlOverride: string | undefined): SalesforceCredentials {
  let raw: string;
  try { raw = readFileSync(path, 'utf8'); }
  catch (err) {
    throw new CredentialError(
      `Failed to read credentials file at "${path}": ${(err as Error).message}`,
      'credentials-missing',
    );
  }
  let parsed: Record<string, unknown>;
  try { parsed = JSON.parse(raw); }
  catch (err) {
    throw new CredentialError(
      `Credentials file at "${path}" is not valid JSON: ${(err as Error).message}`,
      'credentials-malformed',
    );
  }
  const missing = ['username', 'password', 'securityToken'].filter(
    (k) => typeof parsed[k] !== 'string' || (parsed[k] as string).length === 0,
  );
  if (missing.length) {
    throw new CredentialError(
      `Credentials file at "${path}" is missing required fields: ${missing.join(', ')}.`,
      'credentials-incomplete',
    );
  }
  return {
    username: parsed['username'] as string,
    password: parsed['password'] as string,
    securityToken: parsed['securityToken'] as string,
    loginUrl:
      loginUrlOverride ??
      (typeof parsed['loginUrl'] === 'string' ? (parsed['loginUrl'] as string) : undefined),
    source: 'file',
    sourcePath: path,
  };
}

function hasEnvCredentials(): boolean {
  return (
    !!process.env['KRONOS_SF_USERNAME'] &&
    !!process.env['KRONOS_SF_PASSWORD'] &&
    !!process.env['KRONOS_SF_SECURITY_TOKEN']
  );
}

function loadFromEnv(loginUrlOverride: string | undefined): SalesforceCredentials {
  const username = process.env['KRONOS_SF_USERNAME'];
  const password = process.env['KRONOS_SF_PASSWORD'];
  const securityToken = process.env['KRONOS_SF_SECURITY_TOKEN'];
  if (!username || !password || !securityToken) {
    throw new CredentialError(
      'KRONOS_SF_USERNAME / KRONOS_SF_PASSWORD / KRONOS_SF_SECURITY_TOKEN must all be set.',
      'credentials-incomplete',
    );
  }
  return {
    username,
    password,
    securityToken,
    loginUrl: loginUrlOverride ?? process.env['KRONOS_SF_LOGIN_URL'],
    source: 'env',
  };
}

export function redactCredentials(
  s: string,
  creds: Pick<SalesforceCredentials, 'password' | 'securityToken'> | null,
  sessionId?: string,
): string {
  let out = s;
  if (creds?.password) out = out.split(creds.password).join('[REDACTED_PASSWORD]');
  if (creds?.securityToken) out = out.split(creds.securityToken).join('[REDACTED_SECURITY_TOKEN]');
  if (sessionId) out = out.split(sessionId).join('[REDACTED_SESSION]');
  return out;
}
