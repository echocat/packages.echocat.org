import type { Request, Response } from '@cloudflare/workers-types';
import type { Environment } from './common';
import { type Organization, packages, type Repository, type Type } from './packages';
import type { Router } from './router';

export class MavenHandler {
   constructor(private router: Router) {}

   async handle(
      request: Request,
      env: Environment,
      type: Type,
      organization: Organization,
      repository: Repository,
      file: string,
   ): Promise<Response> {
      return (
         (await packages.findMavenFile(request, env, type, organization, repository, file)) ||
         (await this.router.onNotFound(request, env))
      );
   }
}
