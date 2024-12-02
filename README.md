# packages.echocat.org

Source files for the frontend of [packages.echocat.org](https://packages.echocat.org) service.

## TOC

- [Usage](#usage)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Usage

- [Maven](#maven)
- [Helm](#helm)

### Maven

This is a Maven repository access proxy for echocat's projects and can be accessed via `https://packages.echocat.org/maven/<artifact>`. Simply add this repository to your projects using:

#### For dependencies

```xml
<repositories>
    <repository>
        <id>echocat</id>
        <url>https://packages.echocat.org/maven</url>
    </repository>
</repositories>
```

#### For dependencies with snapshots

```xml
<repositories>
   <repository>
      <id>echocat</id>
      <url>https://packages.echocat.org/maven</url>
      <snapshots>
            <enabled>true</enabled>
      </snapshots>
   </repository>
</repositories>
```

#### For plugins

```xml
<pluginRepositories>
    <pluginRepository>
        <id>echocat</id>
        <url>https://packages.echocat.org/maven</url>
    </pluginRepository>
</pluginRepositories>
```

### Helm

This is a Helm repository access proxy for echocat's projects and can be accessed via https://packages.echocat.org/helm Simply add this repository to your projects using:

```shell
$ helm repo add https://packages.echocat.org/helm
```

## Deployment

### Requirements

1. [Wrangler installed](https://developers.cloudflare.com/workers/cli-wrangler/install-update)
2. [Wrangler authorized against our Cloudflare account](https://developers.cloudflare.com/workers/cli-wrangler/authentication#using-commands)

### Local development

```bash
$ npm install
$ npm run start
```

[More details.](https://developers.cloudflare.com/workers/cli-wrangler/commands#dev)

### Publish changes

1. Ensure everything works in [local development](#local-development).
2. Commit/Push the latest changes to git.
3. [Publish the changes](https://developers.cloudflare.com/workers/cli-wrangler/commands#publish)
    ```bash
    $ npm install
    $ npm run deploy
    ```

## Contributing

This is an open source project by [echocat](https://echocat.org).
So if you want to make this project even better, you can contribute to this project on [Github](https://github.com/echocat/packages.echocat.org)
by [fork us](https://github.com/echocat/packages.echocat.org/fork).

If you commit code to this project, you have to accept that this code will be released under the [license](#license) of this project.

## License

See the [LICENSE](LICENSE) file.
