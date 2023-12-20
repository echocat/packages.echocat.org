import {stringify} from 'yaml';
import {Environment} from './common';
import {HelmIndex, HelmIndexApiVersion} from './helm';
import {GitHubPackages} from './packages_github';

export enum Type {
    github = 'github',
}

export type Organization = string;
export type Repository = string;

export interface BasePackages {
    findMavenFile(request: Request, env: Environment, type: Type, organization: Organization, repository: Repository, file: string): Promise<Response | undefined>;

    findHelmIndexObject(env: Environment): Promise<HelmIndex>;
}

export interface Packages extends BasePackages {
    findHelmIndex(request: Request, env: Environment): Promise<Response | undefined>;

    preBuild(env: Environment): Promise<void>;
}

const helmIndexKey = 'helm-index.yaml';
const oneMinuteInSeconds = 60;
const oneHourInSeconds = oneMinuteInSeconds * 60;
const oneDayInSeconds = oneHourInSeconds * 24;

export class CompoundPackages implements Packages {
    private readonly githubEchocat: BasePackages = new GitHubPackages('echocat', ['lingress']);

    public async findMavenFile(request: Request, env: Environment, type: Type, organization: Organization, repository: Repository, file: string): Promise<Response | undefined> {
        const delegate = this.resolve(type, organization);
        if (!delegate) {
            return undefined;
        }
        return await delegate.findMavenFile(request, env, type, organization, repository, file);
    }

    public async findHelmIndexObject(env: Environment): Promise<HelmIndex> {
        return {
            apiVersion: HelmIndexApiVersion.v1,
            entries: {
                ...(await this.githubEchocat.findHelmIndexObject(env)).entries,
            },
        };
    }

    public async findHelmIndex(request: Request, env: Environment): Promise<Response | undefined> {
        let content: ReadableStream<any> | string | null = await env.KV.get(helmIndexKey, {
            type: 'stream',
            cacheTtl: oneMinuteInSeconds,
        });

        if (!content) {
            const obj = await this.findHelmIndexObject(env);
            content = stringify(obj);
            await env.KV.put(helmIndexKey, content, {expirationTtl: oneDayInSeconds});
        }

        const responseSettings: ResponseInit = {
            status: 200,
            headers: {
                'Content-Type': 'text/yaml',
                'Cache-Control': `public, max-age=${oneMinuteInSeconds * 5}, public`,
            },
        };

        return new Response(request.method === 'HEAD' ? null : content, responseSettings);
    }

    public async preBuild(env: Environment): Promise<void> {
        console.info(`Running pre build step...`);

        const obj = await this.findHelmIndexObject(env);
        await env.KV.put(helmIndexKey, stringify(obj), {expirationTtl: oneDayInSeconds});

        console.info(`Running pre build step... DONE!`);
    }

    private resolve(type: Type, organization: Organization): BasePackages | undefined {
        if (type === Type.github) {
            if (organization === 'echocat') {
                return this.githubEchocat;
            }
        }
        return undefined;
    }
}

export const packages: Packages = new CompoundPackages();
