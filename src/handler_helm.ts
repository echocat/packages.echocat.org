import {Request, Response} from '@cloudflare/workers-types';
import {Environment} from './common';
import {packages} from './packages';
import {Router} from './router';

export class HelmHandler {
    constructor(private router: Router) {}

    async handleIndex(request: Request, env: Environment): Promise<Response> {
        return (await packages.findHelmIndex(request, env)) || (await this.router.onNotFound(request, env));
    }
}
