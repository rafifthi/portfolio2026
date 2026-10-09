/**
 * Node module-resolution hooks for the offline CMS-module harnesses.
 *
 * `verify-cms-layout.mjs` imports the real `src/lib/*.ts` sources with plain
 * `node --experimental-strip-types`, which needs three things this hook provides:
 *
 *   1. `@/…` path aliases (tsconfig `paths`) → `<root>/src/…`
 *   2. extensionless relative imports (`./cms-db`) → the `.ts` file
 *   3. `src/lib/cms-db.ts` → `scripts/lib/cms-db-testdouble.mjs`, an in-memory
 *      stand-in. Both the harness and the module graph resolve to the *same* file
 *      URL, so they share one module instance (and one in-memory database).
 *
 * Only used by `scripts/verify-cms-layout.mjs`; not part of the app build.
 */
import { existsSync } from "node:fs";
import { dirname, resolve as resolvePath } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolvePath(dirname(fileURLToPath(import.meta.url)), "..", "..");
const TESTDOUBLE = resolvePath(ROOT, "scripts/lib/cms-db-testdouble.mjs");
const REAL_CMS_DB = resolvePath(ROOT, "src/lib/cms-db.ts");
const EXTENSIONS = [".ts", ".tsx", "/index.ts", "/index.tsx"];

/** Resolves `base` to an existing file, trying the TS extensions when `base`
 *  itself is not a file (mirrors bundler-style extensionless imports). */
function firstExisting(base) {
  if (existsSync(base) && !base.endsWith("/")) return base;
  for (const extension of EXTENSIONS) {
    if (existsSync(base + extension)) return base + extension;
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  const fromRoot = specifier.startsWith("@/")
    ? firstExisting(resolvePath(ROOT, "src", specifier.slice(2)))
    : null;

  const fromParent =
    !fromRoot && specifier.startsWith(".") && !/\.[cm]?[jt]sx?$/.test(specifier)
      ? firstExisting(
          resolvePath(
            context.parentURL ? dirname(fileURLToPath(context.parentURL)) : ROOT,
            specifier
          )
        )
      : null;

  const target = fromRoot ?? fromParent;
  if (target) {
    const url = pathToFileURL(target).href;
    return { url: target === REAL_CMS_DB ? pathToFileURL(TESTDOUBLE).href : url, shortCircuit: true };
  }

  const resolved = await nextResolve(specifier, context);
  if (resolved.url === pathToFileURL(REAL_CMS_DB).href) {
    return { url: pathToFileURL(TESTDOUBLE).href, shortCircuit: true };
  }
  return resolved;
}
