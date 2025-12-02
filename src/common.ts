import type { KVNamespace } from '@cloudflare/workers-types';

export interface Environment {
   GITHUB_ACCESS_USER: string;
   GITHUB_ACCESS_TOKEN: string;
   KV: KVNamespace;
}

export type Url = string;
