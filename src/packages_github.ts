import {Octokit} from '@octokit/rest';
import YAML from 'yaml';
import {Environment} from './common';
import {HelmChart, HelmIndex, HelmIndexApiVersion, HelmIndexEntry, HelmIndexEntryHolder} from './helm';
import {Organization, Repository, Type} from './packages';

const oneMinuteInSeconds = 60;
const oneHourInSeconds = oneMinuteInSeconds * 60;
const oneDayInSeconds = oneHourInSeconds * 24;
const oneYearInSeconds = oneDayInSeconds * 365;

const ttlSnapshots = oneMinuteInSeconds * 15;
const ttlReleases = oneYearInSeconds;
const ttlNotFound = oneMinuteInSeconds * 5;

const helmChartPackageFileNamePattern = /^(.+)(-helm-chart\.tgz)$/;
const mavenSnapshotUrlPattern = /^.+\/[0-9a-z.-]+-SNAPSHOT[0-9a-z.-]*\/[a-z0-9.-]+$/si;

export class GitHubPackages {

    public constructor(
        public organization: string,
        public helmEnabledRepositories: string[],
    ) {
    }

    public async findMavenFile(request: Request, env: Environment, type: Type, organization: Organization, repository: Repository, file: string): Promise<Response | undefined> {
        if (type !== Type.github) {
            throw `This GitHubPackages can only handle type 'github'; but got: '${type}'`;
        }
        if (organization !== this.organization) {
            throw `This GitHubPackages can only handle organization '${this.organization}'; but got: '${type}'`;
        }
        return await this._findMavenFile(request, env, repository, file);
    }

    private async _findMavenFile(request: Request, env: Environment, repository: Repository, file: string) {
        if (request.method !== 'GET' && request.method !== 'HEAD') {
            throw `Can only handle requests of type GET and HEAD; but got '${request.method}'.`;
        }

        const repoUrl = this._mavenRepoUrlFor(repository, file);
        const snapshot = this._isMavenSnapshotSourceUrl(file);
        const ttl = snapshot ? ttlSnapshots : ttlReleases;

        const cacheKey = new Request(repoUrl.toString(), {
            method: 'GET',
        });
        const cache = await caches.open("default");

        let response: Response;

        for (let run = 0; run < 10; run++) {
            response = await cache.match(cacheKey);

            if (response) {
                if (request.method === 'HEAD') {
                    // In case of HEAD we retrieved the body from the remote,
                    // but should obviously not return this to the client.
                    // So, we create a response without body.
                    return new Response(null, response);
                }
                return response;
            }

            if (run === 0) {
                console.info(`Cache missed, need to retrieve it: ${this.organization}/${repository}/${file}...`);
            }

            const auth = btoa(`${env.GITHUB_ACCESS_USER}:${env.GITHUB_ACCESS_TOKEN}`);
            response = await fetch(repoUrl.toString(), {
                headers: {
                    'Authorization': `Basic ${auth}`,
                },
            });

            if (response.status >= 400 && response.status !== 404) {
                // We'll never cache that problem, but just forward the result.
                console.error(`Cache missed, need to retrieve it: ${this.organization}/${repository}/${file}... FAILED (reason: ${response.status} - ${response.statusText})!`);
                return response;
            }

            // Reconstruct the Response object to make its headers mutable.
            const toCacheResponse = new Response(response.body, response);
            toCacheResponse.headers.set("X-Snapshot", `${snapshot}`);
            toCacheResponse.headers.set("Cache-Control", `public, max-age=${response.status >= 400 ? ttlNotFound : ttl}, immutable`);
            await cache.put(cacheKey, toCacheResponse);

            console.info(`Cache missed, need to retrieve it: ${this.organization}/${repository}/${file}... DONE (exists: ${response.status < 400})!`);
        }

        console.error(`Cache missed, need to retrieve it: ${this.organization}/${repository}/${file}... FAILED (reason: unknown)!`);
        return new Response(null, {
            status: 400,
        });
    }

    private _mavenRepoUrlFor(repository: Repository, file: string) {
        return new URL(`https://maven.pkg.github.com/${this.organization}/${repository}/${file}`);
    }

    private _isMavenSnapshotSourceUrl(file: string) {
        return !!mavenSnapshotUrlPattern.exec(file);
    }

    public async findHelmIndexObject(env: Environment): Promise<HelmIndex> {
        const octokit = new Octokit({
            auth: env.GITHUB_ACCESS_TOKEN,
        });

        const nameToEntries: Record<string, HelmIndexEntry[]> = {};

        for (const repo of this.helmEnabledRepositories) {
            for await (const releases of octokit.paginate.iterator(octokit.repos.listReleases, {
                owner: this.organization,
                repo: repo,
                per_page: 100,
            })) {
                console.info(`Evaluate helm charts of project github.com/${this.organization}/${repo}...`);
                for (const release of releases.data) {
                    if (release.assets) {
                        const key = `helm-entry-${repo}-${release.name}-${release.id}`;
                        let entryHolder: HelmIndexEntryHolder | undefined;
                        try {
                            const entryPlain = await env.KV.get(key);
                            entryHolder = entryPlain ? JSON.parse(entryPlain) : undefined;
                        } catch (e) {
                            console.warn(`Cannot parse entry ${key}.`, e);
                        }
                        if (!entryHolder) {
                            for (const asset of release.assets) {
                                if (asset.name) {
                                    const releaseMatch = helmChartPackageFileNamePattern.exec(asset.name);
                                    if (releaseMatch && asset.browser_download_url) {
                                        const prefix = releaseMatch[1];
                                        let sha256: string | undefined;
                                        let chart: HelmChart | undefined;
                                        console.debug(`Found github.com/${this.organization}/${repo}/${release.name}/${asset.name}`);

                                        for (const subAsset of release.assets) {
                                            if (subAsset.name === asset.name + '.sha256' && subAsset.browser_download_url) {
                                                const response = await fetch(subAsset.browser_download_url);
                                                sha256 = await response.text();
                                                console.debug(`Found sha256 github.com/${this.organization}/${repo}/${release.name}/${subAsset.name}`);
                                            }
                                            if (subAsset.name === prefix + '-helm-chart.yaml' && subAsset.browser_download_url) {
                                                const response = await fetch(subAsset.browser_download_url);
                                                chart = YAML.parse(await response.text());
                                                console.debug(`Found chart github.com/${this.organization}/${repo}/${release.name}/${subAsset.name}`);
                                            }
                                        }

                                        if (sha256 && chart) {
                                            entryHolder = {
                                                entry: {
                                                    ...chart,
                                                    digest: sha256,
                                                    urls: [asset.browser_download_url],
                                                    created: asset.created_at,
                                                },
                                            };
                                            break;
                                        }
                                    }
                                }
                            }
                            if (entryHolder) {
                                await env.KV.put(key, JSON.stringify(entryHolder));
                                console.info(`Retrieved information about chart and stored it inside of KV ${key}.`);
                            } else {
                                await env.KV.put(key, JSON.stringify({}));
                            }
                        }
                        if (entryHolder && entryHolder.entry) {
                            nameToEntries[repo] = [
                                ...(nameToEntries[repo] || []),
                                entryHolder.entry,
                            ];
                        }
                    }
                }
            }
        }

        return {
            apiVersion: HelmIndexApiVersion.v1,
            entries: nameToEntries,
        };
    }

}
