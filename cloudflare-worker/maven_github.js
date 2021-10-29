const oneMinuteInSeconds = 60;
const oneHourInSeconds = oneMinuteInSeconds * 60;
const oneDayInSeconds = oneHourInSeconds * 24;
const oneYearInSeconds = oneDayInSeconds * 365;

const ttlSnapshots = oneMinuteInSeconds * 15;
const ttlReleases = oneYearInSeconds;

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
        const repoUrl = this._repoUrlFor(repository, file);
        const snapshot = this._isSnapshotSourceUrl(file);
        const ttl = snapshot ? ttlSnapshots : ttlReleases;

        const cacheKey = new Request(repoUrl.toString(), request);
        const cache = caches.default;

        let response = await cache.match(cacheKey);
        if (!response) {
            const auth = btoa(`${this.accessUser}:${this.accessToken}`)
            response = await fetch(repoUrl.toString(), {
                headers: {
                    'Authorization': `Basic ${auth}`,
                },
            });

            // Reconstruct the Response object to make its headers mutable.
            response = new Response(response.body, response)
            response.headers.set("Cache-Control", `public, max-age=${ttl}, immutable`);
            response.headers.set("X-Snapshot", `${snapshot}`);

            await cache.put(cacheKey, response.clone());
        }

        return response
    }

    _repoUrlFor(repository, file) {
        return new URL(`https://maven.pkg.github.com/${this.organization}/${repository}/${file}`);
    }

    _isSnapshotSourceUrl(file) {
        return !!snapshotUrlPattern.exec(file);
    }
}

