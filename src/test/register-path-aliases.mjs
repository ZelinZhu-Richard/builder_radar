import { existsSync } from "node:fs";
import path from "node:path";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));
const SOURCE_ROOT = path.join(REPO_ROOT, "src");

function resolveAliasPath(specifier) {
  const relativePath = specifier.slice(2);
  const basePath = path.join(SOURCE_ROOT, relativePath);
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.mts`,
    `${basePath}.js`,
    path.join(basePath, "index.ts"),
    path.join(basePath, "index.tsx"),
    path.join(basePath, "index.js"),
  ];

  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

function resolveExtensionlessPath(basePath) {
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.mts`,
    `${basePath}.js`,
    path.join(basePath, "index.ts"),
    path.join(basePath, "index.tsx"),
    path.join(basePath, "index.js"),
  ];

  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const resolvedPath = resolveAliasPath(specifier);

      if (!resolvedPath) {
        throw new Error(`Unable to resolve test alias: ${specifier}`);
      }

      return {
        shortCircuit: true,
        url: pathToFileURL(resolvedPath).href,
      };
    }

    if (
      context.parentURL?.startsWith("file:") &&
      (specifier.startsWith("./") || specifier.startsWith("../")) &&
      !path.extname(specifier)
    ) {
      const candidatePath = fileURLToPath(new URL(specifier, context.parentURL));
      const resolvedPath = resolveExtensionlessPath(candidatePath);

      if (resolvedPath) {
        return {
          shortCircuit: true,
          url: pathToFileURL(resolvedPath).href,
        };
      }
    }

    return nextResolve(specifier, context);
  },
});
