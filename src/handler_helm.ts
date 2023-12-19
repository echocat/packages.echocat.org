import {Environment} from './common';
import {packages} from './packages';
import {Router} from './router';

export class HelmHandler {

    constructor(
        private router: Router,
    ) {
    }

    async handleIndex(request: Request, env: Environment): Promise<Response> {
        return packages.findHelmIndex(request, env);
    }

}
