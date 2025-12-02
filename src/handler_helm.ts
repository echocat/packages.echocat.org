import type { Request, Response } from '@cloudflare/workers-types';
import type { Environment } from './common';
import { packages } from './packages';
import type { Router } from './router';

export class HelmHandler {
   constructor(private router: Router) {}

   async handleIndex(request: Request, env: Environment): Promise<Response> {
      return (await packages.findHelmIndex(request, env)) || (await this.router.onNotFound(request, env));
   }
}
