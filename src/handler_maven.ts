import {Request, Response} from '@cloudflare/workers-types';
import {Environment} from './common';
import {Organization, packages, Repository, Type} from './packages';
import {Router} from './router';

export class MavenHandler {
    constructor(private router: Router) {}

    async handle(request: Request, env: Environment, type: Type, organization: Organization, repository: Repository, file: string): Promise<Response> {
        return (await packages.findMavenFile(request, env, type, organization, repository, file)) || (await this.router.onNotFound(request, env));
    }
}
