# soundworks | build

Build tools for [`soundworks`](https://soundworks.dev) applications.

The build tools are mainly wrappers around:
- [swc](https://swc.rs/)
- [rolldown](https://rolldown.rs/)

## Install

Note that the `@soundworks/build` package is automatically installed when creating an application using the `@soundworks/create` wizard and heavily rely on the file structure defined in the generated template, so most of the time you should not install this package manually.

See [https://soundworks.dev/guides/getting-started.html](https://soundworks.dev/guides/getting-started.html) for more information on the `soundworks` wizard.

```
npm install --save @soundworks/build
```

## Usage

As for the installation, the commands provided by `@soundworks/build` are used by npm scripts in applications created using the `@soundworks/create` wizard, so most of the time you should have to use these commands directly.

Refer to the `README.md` file of your application to see the available npm commands.

```
Usage: soundworks-build [options]

Options:
  -b, --build                 build application
  -w, --watch                 watch file system to rebuild application, use in conjunction with --build flag
  -p, --watch-process <name>  restart a node process when its sources
  -i, --inspect               watch process with --inspect flag, use in conjunction with --watch-process flag
  -D, --delete-build          delete build directory
  -h, --help                  display help for command
```

## Notes

### Extending configuration

### Dynamic imports

### Typescript support

## License

[BSD-3-Clause](./LICENSE)
