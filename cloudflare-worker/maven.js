import {GitHubPackages} from "./maven_github";


// noinspection JSUnresolvedVariable
const registry = {
    'github': {
        'echocat': new GitHubPackages('echocat', GITHUB_ACCESS_USER, GITHUB_ACCESS_TOKEN)
    }
};

export class Maven {

    async findFile(request, type, organization, repository, file) {
        const byType = registry[type];
        if (!byType) {
            return null;
        }
        const byOrganization = byType[organization];
        if (!byOrganization) {
            return null;
        }
        return await byOrganization.findFile(request, type, organization, repository, file);
    }

}

