import path from 'node:path';
import { EOL } from 'node:os';
import fs from 'node:fs';

import { isFunction, isPlainObject } from '@ircam/sc-utils';
import loadConfig from '@soundworks/helpers/load-config.js';
import { AnsiUp } from 'ansi_up';
import chalk from 'chalk';
import chokidar from 'chokidar';
// import * as esbuild from 'esbuild';
import klawSync from 'klaw-sync';
import swc from '@swc/core'; // for node processes

import { build, watch } from 'rolldown'; // bundler
// rollup / rolldown plugins
import swcPlugin from '@rollup/plugin-swc';
import dynamicImportVars from '@rollup/plugin-dynamic-import-vars';

import {
  runtimeOrTarget,
  locateProcessEntryPoint,
  SRC_DIR,
  BUILD_DIR,
} from './utils.js';

const cwd = process.cwd();
const cwdRegExp = new RegExp(cwd, 'g');
const supportedFilesRegExp = /\.(js|jsx|mjs|ts|tsx)$/;

// ------------------------------------------------------
// Compiler section
// ------------------------------------------------------
async function doCompileOrCopy(pathname, inputFolder, outputFolder) {
  if (fs.lstatSync(pathname).isDirectory()) {
    return;
  }

  const inputFilename = pathname;
  const outputFilename = inputFilename
    .replace(inputFolder, outputFolder)
    .replace(supportedFilesRegExp, '.js');

  fs.mkdirSync(path.dirname(outputFilename), { recursive: true });

  if (supportedFilesRegExp.test(inputFilename)) {
    try {
      const sourceFileName = path.relative(path.dirname(outputFilename), inputFilename);

      let { code, map } = await swc.transformFile(inputFilename, {
        sourceMaps: true,
        // Path to "real" file to create source maps
        sourceFileName,
        // These files will only be executed by node so we can safely
        // target newer version of javascript
        // This settings has precedence over the .swcrc file
        jsc: {
          target: 'es2022',
        },
      });

      code += `${EOL}//# sourceMappingURL=./${path.basename(outputFilename)}.map`;

      fs.writeFileSync(outputFilename, code, { recursive: true });
      fs.writeFileSync(`${outputFilename}.map`, map, { recursive: true });

      console.log(chalk.green(`> compiled\t ${inputFilename}`));
    } catch (err) {
      console.error(err.message);
    }
  } else {
    try {
      fs.copyFileSync(inputFilename, outputFilename);
      console.log(chalk.green(`> copied\t ${inputFilename}`));
    } catch (err) {
      console.error(err.message);
    }
  }
}

async function compile(inputFolder, outputFolder, watch) {
  if (!watch) {
    const files = klawSync(inputFolder);
    const promises = files
      .map(file => path.relative(process.cwd(), file.path))
      .map(pathname => doCompileOrCopy(pathname, inputFolder, outputFolder));
    return Promise.all(promises);
  } else {
    const watcher = chokidar.watch(inputFolder, { ignoreInitial: true });
    watcher.on('add', pathname => doCompileOrCopy(pathname, inputFolder, outputFolder));
    watcher.on('change', pathname => doCompileOrCopy(pathname, inputFolder, outputFolder));
    watcher.on('unlink', pathname => {
      const outputFilename = pathname.replace(inputFolder, outputFolder);
      fs.unlinkSync(outputFilename);
      if (fs.existsSync(`${outputFilename}.map`)) {
        fs.unlinkSync(`${outputFilename}.map`);
      }

      console.log(chalk.green(`> deleted\t ${outputFilename}`));
    });
  }
}

// ------------------------------------------------------
// Bundler section
// ------------------------------------------------------
function writeErrorInOutputFile(errorMessage, outputFile) {
  // - escape string literals so that we can insert them in the log string literal message
  // - remove `cwd` from pathnames to make them more readable
  const msg = errorMessage
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${')
    .replace(cwdRegExp, '.');

  const ansiUp = new AnsiUp();
  const html = ansiUp.ansi_to_html(msg);
  const style = 'width: 100%; margin: 0; padding: 20px; font-size: 12px; background-color: white; color: #121212; border: 1px solid #d9534f; border-radius: 1px;';

  const jsErrorFile = `
document.body.innerHTML = \`<pre style="${style}"><code>${html}</code></pre>\`;
document.body.classList.remove('loading');
console.log(\`${msg}\`);
  `;

  fs.writeFileSync(outputFile, jsErrorFile);
}

const onErrorPlugin = function({ outputFile }) {
  return {
    name: 'onerror',
    buildEnd(err) {
      // @note: missing imports doesn't seem to be
      if (err) {
        writeErrorInOutputFile(err.message, outputFile);
      } else {
        console.log(chalk.green(`> bundled\t ${path.relative(process.cwd(), outputFile)}`));
      }
    },
  };
};

// check for per project build configuration options
const overrideConfigFilename = 'build.config.js';
const overrideConfigPathname = path.join(cwd, overrideConfigFilename);
let overrideConfigFunction = null;

if (fs.existsSync(overrideConfigPathname)) {
  const mod = await import(overrideConfigPathname);
  overrideConfigFunction = mod.default;

  if (!isFunction(overrideConfigFunction)) {
    throw new Error(`Invalid "${overrideConfigFilename}" file: default export must be a function`);
  }
}

function getBundleConfig(inputFile, outputFile) {
  let options = {
    input: inputFile,
    output: {
      format: 'iife',
      sourcemap: true,
    },
    plugins: [
      swcPlugin(),
      dynamicImportVars({
        errorWhenNoFilesFound: true,
        warnOnError: true,
      }),
      onErrorPlugin({
        outputFile,
      }),
    ],
    onwarn: warn => {
      // swallow warnings from dynamicImportVars due to plugin scripting
      if (warn.plugin === 'rollup-plugin-dynamic-import-variables'
        && warn.message.includes('import(/* webpackIgnore: true */')) {
        return;
      }

      console.warn(warn.message);
    },
  };

  if (inputFile.endsWith('index.js')) { // no support for dynamic imports
    options.output.file = outputFile;
  } else {
    options.output.dir = path.dirname(outputFile);
  }

  if (overrideConfigFunction !== null) {
    options = overrideConfigFunction(options);

    if (!isPlainObject(options)) {
      throw new Error(`Invalid "${overrideConfigFilename}" file: default export must return an object`);
    }
  }

  return options;
}

/**
 * BUILD STRATEGY
 * -------------------------------------------------------------
 *
 * cf. https://github.com/collective-soundworks/soundworks/issues/23
 *
 * 1. Copy * from `src` into `.build` keeping file system and structure
 *    intact, we keep the copy to allow further support (typescript, etc.)
 *    This allows to not impose further structure to client code.
 * 2. Find browser clients in `src/clients` from `config/application`
 *    and build them into .build/public` using` rolldown
 *
 * @note:
 * - exit with error message if `src/public` exists (reserved path)
 * -------------------------------------------------------------
 */
export default async function buildApplication(watchFlag = false) {
  // `src/public` cannot be used, is reserved by build system
  if (fs.existsSync(path.join('src', 'public'))) {
    console.error(chalk.red(`[@soundworks/template-build]
> The path "src/public" is reserved by the application build process.
> Please rename this file or directory, and restart the build process`));
    process.exit(0);
  }

  // 1. Transpile `src` to `.build`
  const compileMsg = `+ ${watchFlag ? 'watching' : 'transpiling'} \`${SRC_DIR}\` to \`${BUILD_DIR}\``;
  console.log(chalk.yellow(compileMsg));
  await compile(SRC_DIR, BUILD_DIR, watchFlag);

  // 2. Build "browser" clients from `src` to `.build/public`
  // Get application config file get list of declared browser clients
  const config = loadConfig(process.env.ENV);
  const clientsConfig = config.app.clients;

  // @note 20é6/01/15 - we need to run rolldown watch with array of configuration
  // cf. https://rolldown.rs/guide/getting-started#multiple-builds-in-the-same-config
  // because it stops working with more than 6 watch in parallel
  const bundleOptions = [];

  // Bundle all valid declared client
  for (let role in clientsConfig) {
    if (runtimeOrTarget(clientsConfig[role]) !== 'browser') {
      continue;
    }

    const bundleMsg = `+ ${watchFlag ? 'watching' : 'bundling'} browser client "${role}"`;
    console.log(chalk.yellow(bundleMsg));

    const inputFile = path.join(cwd, locateProcessEntryPoint(role, SRC_DIR));
    const outputFile = path.join(cwd, BUILD_DIR, 'public', `${role}.js`);

    const options = getBundleConfig(inputFile, outputFile);

    if (!watchFlag) {
      try {
        await build(options);
      } catch (err) {
        writeErrorInOutputFile(err.message, outputFile);
        console.log(err);
      }
    } else {
      bundleOptions.push(options);
    }
  }

  if (watchFlag && bundleOptions.length > 0) {
    watch(bundleOptions);
  }

  process.on('SIGINT', function() {
    console.log(chalk.cyan('\n>>> EXIT'));
    process.exit(0);
  });
}
