import {Router} from "./router";
import {MavenHandler} from "./handler_maven";
import {Maven} from "./maven";

const router = new Router();
const maven = new Maven();
const mavenHandler = new MavenHandler(maven, router);

router.onMavenRepo = async (request, type, organization, repository, file) => mavenHandler.handle(request, type, organization, repository, file);

addEventListener("fetch", async event => {
    event.respondWith(router.handle(event));
});
