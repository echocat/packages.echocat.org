const oneMinuteInSeconds = 60;
const oneHourInSeconds = oneMinuteInSeconds * 60;
const oneDayInSeconds = oneHourInSeconds * 24;
const oneYearInSeconds = oneDayInSeconds * 365;

const ttlSnapshots = oneMinuteInSeconds * 15;
const ttlReleases = oneYearInSeconds;
const ttlNotFound = oneMinuteInSeconds * 5;

const snapshotUrlPattern = /^.+\/[0-9a-z.-]+-SNAPSHOT[0-9a-z.-]*\/[a-z0-9.-]+$/si;

export class GitHubPackages {

    constructor(organization, accessUser, accessToken) {
        this.organization = organization;
        this.accessUser = accessUser;
        this.accessToken = accessToken;
    }

    async findFile(request, type, organization, repository, file) {
        if (type !== 'github') {
            throw `This GitHubPackages can only handle type 'github'; but got: '${type}'`;
        }
        if (organization !== this.organization) {
            throw `This GitHubPackages can only handle organization '${this.organization}'; but got: '${type}'`;
        }
        return await this._findFile(request, repository, file);
    }

    async _findFile(request, repository, file) {
        if (request.method !== 'GET' && request.method !== 'HEAD') {
            throw `Can only handle requests of type GET and HEAD; but got '${request.method}'.`;
        }

        const repoUrl = this._repoUrlFor(repository, file);
        const snapshot = this._isSnapshotSourceUrl(file);
        const ttl = snapshot ? ttlSnapshots : ttlReleases;

        const cacheKey = new Request(repoUrl.toString(), {
            method: 'GET',
        });
        const cache = caches.default;

        let response;

        for (let run = 0; run < 10; run++) {
            response = await cache.match(cacheKey);

            if (response) {
                if (request.method === 'HEAD') {
                    // In case of HEAD we retrieved the body from the remote,
                    // but should obviously not return this to the client.
                    // So, we create a response without body.
                    return new Response(null, response)
                }
                return response;
            }

            if (run === 0) {
                console.log(`Cache missed, need to retrieve it: ${this.organization}/${repository}/${file}...`)
            }

            const auth = btoa(`${this.accessUser}:${this.accessToken}`)
            response = await fetch(repoUrl.toString(), {
                headers: {
                    'Authorization': `Basic ${auth}`,
                },
            });

            if (response.status >= 400 && response.status !== 404) {
                // We'll never cache that problem, but just forward the result.
                console.log(`Cache missed, need to retrieve it: ${this.organization}/${repository}/${file}... FAILED (reason: ${response.status} - ${response.statusText})!`)
                return response;
            }

            // Reconstruct the Response object to make its headers mutable.
            const toCacheResponse = new Response(response.body, response)
            toCacheResponse.headers.set("X-Snapshot", `${snapshot}`);
            toCacheResponse.headers.set("Cache-Control", `public, max-age=${response.status >= 400 ? ttlNotFound : ttl}, immutable`);
            await cache.put(cacheKey, toCacheResponse);

            console.log(`Cache missed, need to retrieve it: ${this.organization}/${repository}/${file}... DONE (exists: ${response.status < 400})!`)
        }

        console.log(`Cache missed, need to retrieve it: ${this.organization}/${repository}/${file}... FAILED (reason: unknown)!`)
        return new Response(null, {
            status: 400
        });
    }

    _repoUrlFor(repository, file) {
        return new URL(`https://maven.pkg.github.com/${this.organization}/${repository}/${file}`);
    }

    _isSnapshotSourceUrl(file) {
        return !!snapshotUrlPattern.exec(file);
    }
}

