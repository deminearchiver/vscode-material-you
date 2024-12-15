const esbuild = require("esbuild");
const { vanillaExtractPlugin: vanillaExtract } = require("@vanilla-extract/esbuild-plugin");
const lightningCss = require("unplugin-lightningcss/esbuild");
const { Features } = require("lightningcss");
const path = require("path");
const fs = require("fs/promises");

const production = process.argv.includes("--production");
const watch = process.argv.includes("--watch");

/**
 * @type {import("esbuild").Plugin}
 */
const esbuildProblemMatcherPlugin = {
	name: "esbuild-problem-matcher",

	setup(build) {
		build.onStart(() => {
			console.log("[watch] build started");
		});
		build.onEnd((result) => {
			result.errors.forEach(({ text, location }) => {
				console.error(`✘ [ERROR] ${text}`);
				console.error(`    ${location.file}:${location.line}:${location.column}:`);
			});
			console.log("[watch] build finished");
		});
	},
};

/**
 * @typedef PackageJson
 * @property {boolean} private
 * @property {string} name
 * @property {string} main
 * @property {string} packageManager
 * @property {Record<string, string>} engines
 * @property {Record<string, string>} scripts
 * @property {Record<string, string>} dependencies
 * @property {Record<string, string>} devDependencies
 */

/**
 * @type {import("esbuild").Plugin}
 */
const copyAssets = {
  name: "esbuild-package-json",
  setup(build) {

    const processPackageJson = async () => {
      /**
       * @type {PackageJson}
       */
      const packageJson = JSON.parse(
        await fs.readFile("package.json", "utf8"),
      );
      delete packageJson.private;
      packageJson.name = "material-you";
      packageJson.main = "./extension.js";
      packageJson.engines = { vscode: "^1.96.0" };
      delete packageJson.packageManager;
      delete packageJson.scripts;

      if("vscode" in packageJson.dependencies) {
        const vscode = packageJson.dependencies.vscode;
        packageJson.dependencies = { vscode };
      } else {
        delete packageJson.dependencies;
      }
      delete packageJson.devDependencies;

      await fs.writeFile(
        "dist/package.json",
        JSON.stringify(packageJson, null, 2),
        "utf8",
      );
    }
    /**
     *
     * @param {string} from
     * @param {string=} to
     */
    const copyFile = async (from, to) => {
      if(!to) {
        const absoluteFrom = path.resolve(from);
        const basename = path.basename(absoluteFrom);
        to = path.join("dist", basename);
      }
      const exists = await fs.access(from, fs.constants.F_OK)
        .then(() => true)
        .catch(() => false);
      if(exists) await fs.copyFile(from, to);
    }

    build.onEnd(async () => {
      await Promise.all([
        processPackageJson(),
        copyFile("README.md"),
        copyFile("CHANGELOG.md"),
        copyFile("LICENSE"),
        // copyFile("themes/static-light.json"),
        // copyFile("themes/static-dark.json"),
        // copyFile("themes/static-light.json", "dist/dynamic-light.json"),
        // copyFile("themes/static-dark.json", "dist/dynamic-dark.json"),
      ]);
    });
  },
}

const buildInject = async () => {
  return await esbuild.context({
		entryPoints: ["src/inject/index.ts"],
		bundle: true,
		format: "esm",
		minify: production,
		sourcemap: false,
		sourcesContent: false,
		platform: "browser",
		outfile: "dist/inject.js",
		external: [],
		logLevel: "silent",
    legalComments: "eof",
		plugins: [
      vanillaExtract({
        outputCss: true,
      }),
      lightningCss(),
			/* add to the end of plugins array */
			esbuildProblemMatcherPlugin,
		],
	});
}
const buildExtension = async () => {
  return await esbuild.context({
		entryPoints: ["src/extension/index.ts"],
		bundle: true,
		format: "cjs",
		minify: production,
		sourcemap: !production,
		sourcesContent: false,
		platform: "node",
		outfile: "dist/extension.js",
		external: ["vscode"],
		logLevel: "silent",
    legalComments: "eof",
		plugins: [
      copyAssets,
			/* add to the end of plugins array */
			esbuildProblemMatcherPlugin,
		],

	});
}

async function main() {
  const contexts = [
    await buildInject(),
    await buildExtension(),
  ];
  for(const context of contexts) {
    if (watch) {
      await context.watch();
    } else {
      await context.rebuild();
      await context.dispose();
    }
  }
}

main().catch(error => {
	console.error(error);
	process.exit(1);
});
