export class Router {

    constructor() {
        this.onNotFound = (request, headers) => this._defaultOnNotFound(request, headers);
        this._rules = [{
            regexp: /^\/maven\/(org\/echocat\/maven\/plugins\/hugo-maven-plugin\/.+)$/,
            handler: async (request, match) => await this.onMavenRepo(request, 'github', 'echocat', 'hugo-maven-plugin', match[1]),
        }, {
            regexp: /^\/(|index\.html?)$/,
            handler: async (request, match) => await this._onIndex(request, match[1]),
        }];
    }

    async onMavenRepo(request, type, organization, repository, file) {
        console.log(`fallback.onMavenRepo(url="${request.url}", type="${type}", organization="${organization}", repository="${repository}", file="${file}")`);
        return await this.onNotFound(request);
    }

    async onIndex(ignored) {
        return Response.redirect('https://echocat.org/', 301);
    }

    async _onIndex(request, subPath) {
        if (subPath !== '') {
            return this._redirect(request, '', 301);
        }
        return await this.onIndex(request);
    }

    async _redirect(request, newPath, status) {
        const url = new URL(request.url);
        url.pathname = newPath;
        return Response.redirect(url.toString(), status);
    }

    async handle(event) {
        const request = event.request;
        if (request.method !== 'GET' && request.method !== 'HEAD') {
            return await this._respondWithError(request, 405, 'Method not allowed', `The request method ${request.method} is not allowed for this resource.`);
        }

        const url = new URL(request.url);
        const {pathname} = url;

        for (const rule of this._rules) {
            const match = pathname.match(rule.regexp);
            if (match) {
                return rule.handler(request, match);
            }
        }

        return await this.onNotFound(request);
    }

    async _defaultOnNotFound(request, headers) {
        return await this._respondWithError(request, 404, 'Not found', 'The resource you requested cannot be found.', headers);
    }

    async _respondWithError(request, statusCode, status, message, headers) {
        const targetHeaders = new Headers(headers);
        targetHeaders.append(`x-error-details`, message);
        return new Response(null, {
            status: statusCode,
            statusText: status,
            headers: targetHeaders,
        });
    }

}
