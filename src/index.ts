import type { ExportedHandler, Request, Response, ScheduledController } from '@cloudflare/workers-types';
import type { Environment } from './common';
import { HelmHandler } from './handler_helm';
import { MavenHandler } from './handler_maven';
import { packages } from './packages';
import { Router } from './router';

const router = new Router();
const mavenHandler = new MavenHandler(router);
const helmHandler = new HelmHandler(router);

router.onMavenRepo = async (request, env, type, organization, repository, file) =>
   await mavenHandler.handle(request, env, type, organization, repository, file);
router.onHelmIndexYaml = async (request, env) => await helmHandler.handleIndex(request, env);

export const handler = {
   async fetch(request: Request, env: Environment): Promise<Response> {
      return await router.handle(request, env);
   },
   async scheduled(_: ScheduledController, env: Environment): Promise<void> {
      await packages.preBuild(env);
   },
};

export default handler as ExportedHandler<Environment>;
