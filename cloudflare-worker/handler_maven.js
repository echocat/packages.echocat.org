export class MavenHandler {

    constructor(maven, router) {
        this.maven = maven;
        this.router = router;
    }

    async handle(request, type, organization, repository, file) {
        const fileResponse = await this.maven.findFile(request, type, organization, repository, file);
        if (!fileResponse) {
            return await this.router.onNotFound(request);
        }
        return fileResponse;
    }

}
