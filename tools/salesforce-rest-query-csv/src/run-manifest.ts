import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';

export interface RunManifestArtifact {
  path: string;
  format: string;
  sha256: string;
  bytes: number;
  description: string;
}

export interface RunManifest {
  status: 'ok' | 'error';
  tool: string;
  tool_version: string;
  invoked_at: string;
  completed_at: string;
  params: Record<string, unknown>;
  artifacts: RunManifestArtifact[];
  metrics: Record<string, number>;
  target: {
    login_url: string;
    instance_url?: string;
    organization_id?: string;
    api_version: string;
  };
  credentials: {
    source: 'file' | 'env' | 'none';
    source_path?: string;
  };
  error: { code: string; message: string } | null;
}

export function sha256File(path: string): { sha256: string; bytes: number } {
  const buf = readFileSync(path);
  return {
    sha256: createHash('sha256').update(buf).digest('hex'),
    bytes: buf.length,
  };
}

export function sha256String(s: string): string {
  return createHash('sha256').update(s, 'utf8').digest('hex');
}

export function fileBytes(path: string): number {
  return statSync(path).size;
}
