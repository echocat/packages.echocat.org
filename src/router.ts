import type { Environment } from './common';
import { type Organization, type Repository, Type } from './packages';

interface Rule {
   regexp: RegExp;
   handler: (request: Request, env: Environment, match: RegExpMatchArray) => Promise<Response>;
}

export class Router {
   private readonly _rules: Array<Rule> = [
      {
         regexp: /^\/maven\/(org\/echocat\/maven\/plugins\/hugo-maven-plugin\/.+)$/,
         handler: async (request, env, match) =>
            await this.onMavenRepo(request, env, Type.github, 'echocat', 'hugo-maven-plugin', match[1]),
      },
      {
         regexp: /^\/maven\/(org\/echocat\/units4j\/units4j\/.+)$/,
         handler: async (request, env, match) =>
            await this.onMavenRepo(request, env, Type.github, 'echocat', 'units4j', match[1]),
      },
      {
         regexp: /^\/maven\/(org\/echocat\/locela\/api\/java\/.+)$/,
         handler: async (request, env, match) =>
            await this.onMavenRepo(request, env, Type.github, 'echocat', 'locela-api-java', match[1]),
      },
      {
         regexp: /^\/maven\/(org\/echocat\/java-stream-utils\/java-stream-utils\/.+)$/,
         handler: async (request, env, match) =>
            await this.onMavenRepo(request, env, Type.github, 'echocat', 'java-stream-utils', match[1]),
      },
      {
         regexp: /^\/maven\/(org\/echocat\/repo4j\/repo4j\/.+)$/,
         handler: async (request, env, match) =>
            await this.onMavenRepo(request, env, Type.github, 'echocat', 'repo4j', match[1]),
      },
      {
         regexp: /^\/helm\/index\.yaml$/,
         handler: async (request, env) => await this.onHelmIndexYaml(request, env),
      },
      {
         regexp: /^\/helm\/?$/,
         handler: async (request, env) => await this.onHelmIndex(request, env),
      },
      {
         regexp: /^\/(|index\.html?)$/,
         handler: async (request, env, match) => await this._onIndex(request, env, match[1]),
      },
   ];

   public onNotFound: (request: Request, env: Environment, headers?: HeadersInit) => Promise<Response> = async (
      request,
      _,
      headers = {},
   ) => this._defaultOnNotFound(request, headers);

   public onMavenRepo: (
      request: Request,
      env: Environment,
      type: Type,
      organization: Organization,
      repository: Repository,
      file: string,
   ) => Promise<Response> = async (request, env, type, organization, repository, file) => {
      console.log(
         `fallback.onMavenRepo(url="${request.url}", type="${type}", organization="${organization}", repository="${repository}", file="${file}")`,
      );
      return await this.onNotFound(request, env);
   };

   public onHelmIndexYaml: (request: Request, env: Environment) => Promise<Response> = async (request, env) => {
      console.log(`fallback.onHelmIndex(url="${request.url}"`);
      return await this.onNotFound(request, env);
   };

   public onHelmIndex: (request: Request, env: Environment) => Promise<Response> = async request => {
      const target = new URL(request.url);
      target.pathname = '/helm/index.yaml';
      return Response.redirect(target.toString(), 301);
   };

   public onIndex: (request: Request, env: Environment) => Promise<Response> = async () =>
      Response.redirect('https://github.com/echocat/packages.echocat.org', 301);

   private async _onIndex(request: Request, env: Environment, subPath: string) {
      if (subPath !== '') {
         return this._redirect(request, '', 301);
      }
      return await this.onIndex(request, env);
   }

   private async _redirect(request: Request, newPath: string, status: number) {
      const url = new URL(request.url);
      url.pathname = newPath;
      return Response.redirect(url.toString(), status);
   }

   public async handle(request: Request, env: Environment): Promise<Response> {
      if (request.method !== 'GET' && request.method !== 'HEAD') {
         return await this._respondWithError(
            request,
            405,
            'Method not allowed',
            `The request method ${request.method} is not allowed for this resource.`,
         );
      }

      const url = new URL(request.url);
      const { pathname } = url;

      for (const rule of this._rules) {
         const match = pathname.match(rule.regexp);
         if (match) {
            return rule.handler(request, env, match);
         }
      }

      return await this.onNotFound(request, env);
   }

   private async _defaultOnNotFound(request: Request, headers: HeadersInit = {}) {
      return await this._respondWithError(
         request,
         404,
         'Not found',
         'The resource you requested cannot be found.',
         headers,
      );
   }

   private async _respondWithError(
      _: Request,
      statusCode: number,
      status: string,
      message: string,
      headers: HeadersInit = {},
   ) {
      const targetHeaders = new Headers(headers);
      targetHeaders.append(`x-error-details`, message);
      return new Response(null, {
         status: statusCode,
         statusText: status,
         headers: targetHeaders,
      });
   }
}
