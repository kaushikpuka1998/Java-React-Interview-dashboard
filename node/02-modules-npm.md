# Modules & npm Interview Questions (Q1 – Q70)

---

### Q1. What is a module in Node.js?
**Difficulty:** `Basic`
**Category:** Modules & npm

#### Answer
A module is a self-contained unit of code (usually one file) with its own scope. It exposes functionality via exports and consumes others via `require`/`import`, enabling reuse and separation of concerns.

#### Code Example
```js
// math.js
module.exports.add = (a, b) => a + b
// app.js
const { add } = require('./math')
```
---

### Q2. What are the three types of modules in Node?
**Difficulty:** `Basic`
**Category:** Modules & npm

#### Answer
Core modules (built into Node, e.g. `fs`, `http`), local modules (your own files), and third-party modules (installed from npm into `node_modules`).

#### Code Example
```js
const fs = require('fs')          // core
const util = require('./util')    // local
const express = require('express')// third-party
```
---

### Q3. How do you export multiple values from a module?
**Difficulty:** `Basic`
**Category:** Modules & npm

#### Answer
Attach properties to `module.exports` (CJS) or use named `export` statements (ESM). A default export represents the single primary value.

#### Code Example
```js
// CJS
module.exports = { add, subtract }
// ESM
export const add = ...; export default calculator
```
---

### Q4. What happens when you `require` a JSON file?
**Difficulty:** `Basic`
**Category:** Modules & npm

#### Answer
Node parses the JSON and returns it as a JavaScript object. The result is cached like any module, so edits require clearing the cache to reload.

#### Code Example
```js
const config = require('./config.json')
console.log(config.port)
```
---

### Q5. How do you import JSON in ES Modules?
**Difficulty:** `Intermediate`
**Category:** Modules & npm

#### Answer
Use an import attribute (`with { type: 'json' }`) in modern Node, or read/parse it manually. Older syntax used `assert { type: 'json' }`.

#### Code Example
```js
import config from './config.json' with { type: 'json' }
```
---

### Q6. What is the difference between named and default exports?
**Difficulty:** `Intermediate`
**Category:** Modules & npm

#### Answer
Named exports export multiple bindings imported by exact name (with `{}`); a default export is a single value imported under any name. A module can mix both.

#### Code Example
```js
export default App
export function helper() {}
import App, { helper } from './App.js'
```
---

### Q7. How do you re-export from another module?
**Difficulty:** `Intermediate`
**Category:** Modules & npm

#### Answer
Use `export ... from` (ESM) to create a barrel file that aggregates and re-exposes exports, simplifying imports for consumers.

#### Code Example
```js
// index.js barrel
export { add } from './math.js'
export { default as User } from './User.js'
```
---

### Q8. What is a barrel file and what is its downside?
**Difficulty:** `Advanced`
**Category:** Modules & npm

#### Answer
A barrel file re-exports many modules from one index for cleaner imports. Downside: it can hurt tree-shaking and increase load time because importing one symbol may pull in the whole barrel.

#### Code Example
```js
// consumers do: import { add } from './utils'
// but bundlers may load all of ./utils
```
---

### Q9. How does Node find `node_modules`?
**Difficulty:** `Intermediate`
**Category:** Modules & npm

#### Answer
Node searches the current directory's `node_modules`, then walks up parent directories until it reaches the filesystem root. This lets nested packages share or override dependencies.

#### Code Example
```js
// require('lodash') from /app/src looks in
// /app/src/node_modules, /app/node_modules, /node_modules
```
---

### Q10. What is the difference between `require('./x')` and `require('x')`?
**Difficulty:** `Basic`
**Category:** Modules & npm

#### Answer
`./x` (or `../`, `/`) is a path-based local module. A bare specifier `x` is resolved as a core module or from `node_modules`. Missing the `./` is a common cause of "cannot find module" errors.

#### Code Example
```js
require('./config')  // local file
require('config')     // npm package
```
---

### Q11. What are the fields in package.json for entry points?
**Difficulty:** `Advanced`
**Category:** Modules & npm

#### Answer
`main` is the CJS entry, `module` hints an ESM entry for bundlers, `exports` (modern) defines conditional/subpath entry points and can restrict access, and `types` points to TypeScript declarations.

#### Code Example
```js
"main": "./dist/index.cjs",
"exports": { ".": { "import": "./dist/index.mjs", "require": "./dist/index.cjs" } }
```
---

### Q12. What is the `exports` map (conditional exports)?
**Difficulty:** `Experienced`
**Category:** Modules & npm

#### Answer
The `exports` field defines which files consumers may import and provides condition-based resolution (`import`, `require`, `node`, `browser`, `default`). It encapsulates internals and enables dual CJS/ESM packages.

#### Code Example
```js
"exports": {
  "./feature": { "import": "./feature.mjs", "require": "./feature.cjs" }
}
```
---

### Q13. What is a dual package (CJS + ESM)?
**Difficulty:** `Experienced`
**Category:** Modules & npm

#### Answer
A dual package ships both CommonJS and ES Module builds so it works everywhere. Risk: the "dual package hazard" — the same module loaded in both formats yields two separate instances with duplicated state.

#### Code Example
```js
"exports": { "import": "./esm/index.js", "require": "./cjs/index.js" }
```
---

### Q14. How do you conditionally load a module?
**Difficulty:** `Intermediate`
**Category:** Modules & npm

#### Answer
In CJS, call `require` inside a branch (it is dynamic). In ESM, use dynamic `import()` which returns a Promise, enabling lazy or conditional loading.

#### Code Example
```js
if (useRedis) var store = require('./redisStore')
const mod = await import(`./drivers/${name}.js`)
```
---

### Q15. What is lazy loading of modules and why use it?
**Difficulty:** `Advanced`
**Category:** Modules & npm

#### Answer
Lazy loading defers `require`/`import` until a module is actually needed, reducing startup time and memory when a feature may never run. Common for optional/heavy dependencies.

#### Code Example
```js
function generatePdf() {
  const PDFKit = require('pdfkit') // loaded only on first use
}
```
---

### Q16. What is the difference between `npm update` and `npm install`?
**Difficulty:** `Intermediate`
**Category:** Modules & npm

#### Answer
`npm install` installs versions satisfying `package.json`, adding missing ones. `npm update` bumps installed packages to the latest allowed by their semver ranges and updates the lock file.

#### Code Example
```js
npm update lodash
```
---

### Q17. How do you check for outdated packages?
**Difficulty:** `Basic`
**Category:** Modules & npm

#### Answer
`npm outdated` lists installed packages with their current, wanted (max satisfying range), and latest versions, helping you plan upgrades.

#### Code Example
```js
npm outdated
```
---

### Q18. What is `npm audit`?
**Difficulty:** `Intermediate`
**Category:** Modules & npm

#### Answer
`npm audit` scans your dependency tree against a vulnerability database and reports issues with severity. `npm audit fix` applies compatible fixes automatically.

#### Code Example
```js
npm audit --audit-level=high
npm audit fix
```
---

### Q19. What is the difference between `~` and `^` in version ranges?
**Difficulty:** `Intermediate`
**Category:** Modules & npm

#### Answer
`~1.2.3` allows patch updates (`>=1.2.3 <1.3.0`). `^1.2.3` allows minor + patch (`>=1.2.3 <2.0.0`). For `0.x`, `^` is stricter and behaves closer to `~`.

#### Code Example
```js
"~1.2.3" // 1.2.x
"^1.2.3" // 1.x.x
```
---

### Q20. How do you pin an exact dependency version?
**Difficulty:** `Basic`
**Category:** Modules & npm

#### Answer
Specify the version without a range prefix, or install with `--save-exact`. The lock file already pins exact resolved versions for reproducibility.

#### Code Example
```js
npm install left-pad@1.3.0 --save-exact
// "left-pad": "1.3.0"
```
---

### Q21. What are optionalDependencies?
**Difficulty:** `Advanced`
**Category:** Modules & npm

#### Answer
`optionalDependencies` may fail to install without failing the whole install. Your code must handle their absence at runtime (often platform-specific native modules).

#### Code Example
```js
let fsevents
try { fsevents = require('fsevents') } catch { /* not on this OS */ }
```
---

### Q22. What is `bundledDependencies`?
**Difficulty:** `Advanced`
**Category:** Modules & npm

#### Answer
`bundledDependencies` (or `bundleDependencies`) lists packages included inside your published tarball, so they ship with your package rather than being fetched from the registry. Rarely needed today.

#### Code Example
```js
"bundledDependencies": ["my-private-fork"]
```
---

### Q23. What is an npm workspace / monorepo?
**Difficulty:** `Experienced`
**Category:** Modules & npm

#### Answer
npm workspaces let one repo host multiple packages sharing a single `node_modules` and lock file. Dependencies between local packages are symlinked, simplifying multi-package development.

#### Code Example
```js
// root package.json
"workspaces": ["packages/*"]
```
---

### Q24. How do you run a script across all workspaces?
**Difficulty:** `Advanced`
**Category:** Modules & npm

#### Answer
Use `npm run <script> --workspaces` (or `-w <name>` for one). This executes the script in each package that defines it.

#### Code Example
```js
npm run build --workspaces --if-present
```
---

### Q25. What is `npm link`?
**Difficulty:** `Advanced`
**Category:** Modules & npm

#### Answer
`npm link` symlinks a local package into the global folder, then into a consuming project, so you can develop and test a package locally before publishing. Beware duplicate peer deps.

#### Code Example
```js
cd my-lib && npm link
cd ../app && npm link my-lib
```
---

### Q26. How do you publish a package to npm?
**Difficulty:** `Intermediate`
**Category:** Modules & npm

#### Answer
Log in (`npm login`), set `name`/`version`/`files` in package.json, then `npm publish`. Scoped packages need `--access public` to be public.

#### Code Example
```js
npm version patch
npm publish --access public
```
---

### Q27. What does the `files` field in package.json do?
**Difficulty:** `Intermediate`
**Category:** Modules & npm

#### Answer
`files` whitelists which files are included in the published tarball. Without it, npm uses `.npmignore` (or `.gitignore`) to exclude files. Whitelisting avoids accidentally shipping source/tests.

#### Code Example
```js
"files": ["dist", "README.md"]
```
---

### Q28. What is `.npmignore` and how does it interact with `.gitignore`?
**Difficulty:** `Advanced`
**Category:** Modules & npm

#### Answer
`.npmignore` excludes files from the published package. If it is absent, npm falls back to `.gitignore`. If both exist, `.npmignore` wins for publishing. The `files` whitelist takes precedence over both.

#### Code Example
```js
// .npmignore
test/
*.log
```
---

### Q29. What is a scoped package?
**Difficulty:** `Intermediate`
**Category:** Modules & npm

#### Answer
A scoped package is namespaced under a user/org with `@scope/name`, avoiding name collisions and enabling private packages. Scopes map to registries/organizations.

#### Code Example
```js
npm install @myorg/logger
```
---

### Q30. How do you use a private registry?
**Difficulty:** `Advanced`
**Category:** Modules & npm

#### Answer
Configure the registry globally or per-scope in `.npmrc`, with an auth token. This routes installs/publishes for a scope to your private registry (e.g. GitHub Packages, Verdaccio).

#### Code Example
```js
// .npmrc
@myorg:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${TOKEN}
```
---

### Q31. What is `.npmrc` used for?
**Difficulty:** `Intermediate`
**Category:** Modules & npm

#### Answer
`.npmrc` stores npm configuration (registry, auth tokens, `save-exact`, `engine-strict`, proxy). It can be global, per-user, or per-project, with project-level overriding.

#### Code Example
```js
// .npmrc
save-exact=true
engine-strict=true
```
---

### Q32. How do you override a transitive dependency version?
**Difficulty:** `Experienced`
**Category:** Modules & npm

#### Answer
Use the `overrides` field (npm 8+) to force a nested dependency to a specific version, useful for patching a vulnerable transitive package.

#### Code Example
```js
"overrides": { "minimist": "1.2.8" }
```
---

### Q33. What is the difference between npm, yarn, and pnpm?
**Difficulty:** `Advanced`
**Category:** Modules & npm

#### Answer
All manage packages. Yarn added lockfiles/workspaces early and offers Plug'n'Play. pnpm uses a content-addressed global store with symlinks, saving disk space and enforcing stricter dependency isolation. npm is the default and now supports most features.

#### Code Example
```js
pnpm install   // hard-links from a global store
```
---

### Q34. Why does pnpm save disk space?
**Difficulty:** `Advanced`
**Category:** Modules & npm

#### Answer
pnpm stores each package version once in a global content-addressable store and hard-links it into each project's `node_modules`, so many projects share the same physical files instead of duplicating them.

#### Code Example
```js
// ~/.pnpm-store holds a single copy per version
```
---

### Q35. What is dependency hoisting?
**Difficulty:** `Advanced`
**Category:** Modules & npm

#### Answer
Hoisting moves shared transitive dependencies up to a top-level `node_modules` to deduplicate. It can cause "phantom dependencies" — code accidentally using a package it never declared. pnpm avoids this with a strict layout.

#### Code Example
```js
// You import 'ms' without declaring it because express hoisted it — fragile
```
---

### Q36. What is a phantom dependency?
**Difficulty:** `Experienced`
**Category:** Modules & npm

#### Answer
A phantom dependency is a package your code imports but never declared in `package.json`; it works only because hoisting exposed it. It breaks when the transitive dep changes. Always declare what you import.

#### Code Example
```js
require('lodash') // works today via hoisting, may vanish tomorrow
```
---

### Q37. How do you create and use a local file dependency?
**Difficulty:** `Intermediate`
**Category:** Modules & npm

#### Answer
Reference a local path or tarball in `package.json` using `file:`. Useful for monorepos or testing before publishing.

#### Code Example
```js
"dependencies": { "my-lib": "file:../my-lib" }
```
---

### Q38. How do you install directly from a Git repository?
**Difficulty:** `Intermediate`
**Category:** Modules & npm

#### Answer
Provide a git URL (optionally with a commit/branch/tag) as the version. npm clones and builds it. Useful for forks or unpublished packages.

#### Code Example
```js
npm install github:user/repo#v2.0.0
```
---

### Q39. What are npm lifecycle hooks?
**Difficulty:** `Advanced`
**Category:** Modules & npm

#### Answer
npm runs scripts around events: `preinstall`, `install`, `postinstall`, `prepublishOnly`, `prepare`. `pre`/`post` prefixes wrap any custom script too. Beware running untrusted postinstall scripts (supply-chain risk).

#### Code Example
```js
"scripts": { "prepare": "husky install" }
```
---

### Q40. What security risk do postinstall scripts pose?
**Difficulty:** `Experienced`
**Category:** Modules & npm

#### Answer
A malicious dependency's `postinstall` runs arbitrary code on your machine/CI, a common supply-chain attack. Mitigate with `--ignore-scripts`, lockfile review, and pinning.

#### Code Example
```js
npm ci --ignore-scripts
```
---

### Q41. How do you clear the npm cache?
**Difficulty:** `Basic`
**Category:** Modules & npm

#### Answer
Use `npm cache clean --force`. Modern npm self-heals the cache, so this is rarely necessary; `npm cache verify` checks integrity instead.

#### Code Example
```js
npm cache verify
```
---

### Q42. What is `npm dedupe`?
**Difficulty:** `Advanced`
**Category:** Modules & npm

#### Answer
`npm dedupe` rearranges the dependency tree to move compatible duplicate packages to a shared higher level, reducing installed copies and bundle size.

#### Code Example
```js
npm dedupe
```
---

### Q43. How do you list installed dependencies as a tree?
**Difficulty:** `Basic`
**Category:** Modules & npm

#### Answer
`npm ls` prints the dependency tree; add a package name to find why it is installed, or `--all` for the full depth.

#### Code Example
```js
npm ls express
```
---

### Q44. How do you find why a package is installed?
**Difficulty:** `Advanced`
**Category:** Modules & npm

#### Answer
`npm explain <pkg>` (or `npm ls <pkg>`) shows the dependency chains that pull the package in, helping remove or override unwanted transitive deps.

#### Code Example
```js
npm explain minimist
```
---

### Q45. What is `npm-shrinkwrap.json`?
**Difficulty:** `Experienced`
**Category:** Modules & npm

#### Answer
It is a publishable version of `package-lock.json`. Unlike the lock file, it IS included when you publish, letting library authors lock the entire dependency tree for consumers (rarely recommended for libraries).

#### Code Example
```js
npm shrinkwrap
```
---

### Q46. What is tree-shaking and how do modules affect it?
**Difficulty:** `Experienced`
**Category:** Modules & npm

#### Answer
Tree-shaking eliminates unused exports at bundle time. It requires static ES Modules (`import`/`export`) and `"sideEffects": false` hints; dynamic CJS `require` defeats it because usage can't be analyzed statically.

#### Code Example
```js
"sideEffects": false // safe to drop unused exports
```
---

### Q47. What does `"sideEffects": false` mean?
**Difficulty:** `Experienced`
**Category:** Modules & npm

#### Answer
It tells bundlers that importing a module has no side effects (like polyfills or CSS registration), so unused imports can be safely removed. Mark specific files if some do have side effects.

#### Code Example
```js
"sideEffects": ["*.css", "./src/polyfill.js"]
```
---

### Q48. How do you create a monorepo with shared code?
**Difficulty:** `Experienced`
**Category:** Modules & npm

#### Answer
Use workspaces (npm/pnpm/yarn) or tools like Turborepo/Nx. Shared packages live under `packages/*`, are symlinked, and imported by name; a build orchestrator caches and parallelizes tasks.

#### Code Example
```js
"workspaces": ["apps/*", "packages/*"]
```
---

### Q49. What is the difference between `main`, `module`, and `browser` fields?
**Difficulty:** `Experienced`
**Category:** Modules & npm

#### Answer
`main` is the default CJS entry, `module` points bundlers to an ESM build for tree-shaking, and `browser` provides browser-specific replacements (e.g. swapping `fs` for a shim). The `exports` map now supersedes these.

#### Code Example
```js
"main": "index.cjs", "module": "index.mjs", "browser": "index.browser.js"
```
---

### Q50. How do you make a package work in both Node and the browser?
**Difficulty:** `Experienced`
**Category:** Modules & npm

#### Answer
Avoid Node-only APIs or provide conditional entries via the `exports`/`browser` fields, and use isomorphic libraries. Bundlers pick the right build per target.

#### Code Example
```js
"exports": { "node": "./node.js", "browser": "./browser.js", "default": "./index.js" }
```
---

### Q51. What is `import.meta.url` and why is it needed in ESM?
**Difficulty:** `Advanced`
**Category:** Modules & npm

#### Answer
ESM has no `__dirname`/`__filename`. `import.meta.url` gives the current module's URL, from which you derive paths using `fileURLToPath`.

#### Code Example
```js
import { fileURLToPath } from 'node:url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
```
---

### Q52. How do you use `__dirname` equivalent in ESM?
**Difficulty:** `Intermediate`
**Category:** Modules & npm

#### Answer
Convert `import.meta.url` with `fileURLToPath`, then take `path.dirname`. Some Node versions expose `import.meta.dirname` directly.

#### Code Example
```js
const dir = import.meta.dirname ?? path.dirname(fileURLToPath(import.meta.url))
```
---

### Q53. Can you use `require` inside an ES Module?
**Difficulty:** `Advanced`
**Category:** Modules & npm

#### Answer
Not directly, but you can create one via `createRequire(import.meta.url)`. This helps load CJS-only packages or JSON from ESM code.

#### Code Example
```js
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const cjs = require('some-cjs-pkg')
```
---

### Q54. Can you import an ESM package from CommonJS?
**Difficulty:** `Advanced`
**Category:** Modules & npm

#### Answer
Not with synchronous `require` (ESM is async). Use dynamic `import()`, which returns a Promise, inside your CJS code.

#### Code Example
```js
;(async () => { const mod = await import('esm-only-pkg') })()
```
---

### Q55. What is top-level await and where can you use it?
**Difficulty:** `Advanced`
**Category:** Modules & npm

#### Answer
Top-level `await` lets you `await` at module scope without an async function — only in ES Modules. It is useful for async initialization but delays the module's readiness for importers.

#### Code Example
```js
// config.mjs
export const config = await loadConfig()
```
---

### Q56. What is a module's `exports` caching behavior with mutation?
**Difficulty:** `Experienced`
**Category:** Modules & npm

#### Answer
Because modules are cached singletons, mutating an exported object is visible to all importers. This can be used for shared state but risks hidden coupling and hard-to-trace bugs.

#### Code Example
```js
// counter.js
module.exports = { n: 0 }
// any importer that does counter.n++ affects all
```
---

### Q57. What is the difference between deep and shallow module imports?
**Difficulty:** `Advanced`
**Category:** Modules & npm

#### Answer
A shallow import pulls the package entry; a deep import targets an internal file path. The `exports` map can forbid deep imports to keep internals private and refactorable.

#### Code Example
```js
import { debounce } from 'lodash-es'          // shallow
import debounce from 'lodash-es/debounce.js'  // deep (may be blocked)
```
---

### Q58. How do you handle native (C++) addons?
**Difficulty:** `Experienced`
**Category:** Modules & npm

#### Answer
Native addons are compiled binaries (`.node`) built with node-gyp/N-API. They install via prebuilt binaries or compile on `install`, requiring build tools. They provide performance or OS-level features JS can't.

#### Code Example
```js
const addon = require('bcrypt') // uses a native binding under the hood
```
---

### Q59. What is N-API / Node-API?
**Difficulty:** `Experienced`
**Category:** Modules & npm

#### Answer
Node-API is a stable, ABI-versioned C interface for building native addons that remain binary-compatible across Node versions, so addons don't need recompiling for each release.

#### Code Example
```js
// addons built with Node-API load without rebuild across Node majors
```
---

### Q60. How do you mock modules in tests?
**Difficulty:** `Advanced`
**Category:** Modules & npm

#### Answer
Use a test runner's mock API (`jest.mock`) or Node's built-in `mock` from `node:test`, or dependency injection. Mocks replace a module's exports so you can isolate the unit under test.

#### Code Example
```js
jest.mock('./db', () => ({ query: jest.fn() }))
```
---

### Q61. What is dependency injection and why prefer it over hard requires?
**Difficulty:** `Experienced`
**Category:** Modules & npm

#### Answer
Dependency injection passes collaborators in (via constructor/args) rather than importing them internally. It decouples modules, makes testing easy (inject mocks), and avoids tangled module graphs.

#### Code Example
```js
function createService(db) { return { get: id => db.find(id) } }
```
---

### Q62. How do you version and publish a breaking change responsibly?
**Difficulty:** `Experienced`
**Category:** Modules & npm

#### Answer
Bump the MAJOR version, document the migration in a changelog, optionally publish under a `next` dist-tag first, and deprecate the old major with `npm deprecate` to warn users.

#### Code Example
```js
npm version major
npm publish --tag next
```
---

### Q63. What are npm dist-tags?
**Difficulty:** `Advanced`
**Category:** Modules & npm

#### Answer
Dist-tags are named pointers to versions (`latest`, `next`, `beta`). `npm install pkg` uses `latest`; users opt into others explicitly. They enable staged releases.

#### Code Example
```js
npm dist-tag add pkg@2.0.0-rc.1 next
npm install pkg@next
```
---

### Q64. How do you deprecate a package or version?
**Difficulty:** `Advanced`
**Category:** Modules & npm

#### Answer
`npm deprecate <pkg>[@range] "<message>"` prints a warning on install, guiding users to alternatives without unpublishing.

#### Code Example
```js
npm deprecate my-lib@"<2.0.0" "Upgrade to v2, v1 is unmaintained"
```
---

### Q65. Why is unpublishing packages restricted?
**Difficulty:** `Experienced`
**Category:** Modules & npm

#### Answer
After the left-pad incident, npm restricted unpublish (only within 72 hours and if nothing depends on it) to prevent breaking the ecosystem. Prefer deprecation over unpublishing.

#### Code Example
```js
npm deprecate my-lib "Do not use" // instead of unpublish
```
---

### Q66. How do you audit and reduce your dependency footprint?
**Difficulty:** `Experienced`
**Category:** Modules & npm

#### Answer
Review with `npm ls`, remove unused deps (depcheck), prefer small focused libraries or the standard library, and watch install size (`npm install --dry-run`, bundlephobia). Fewer deps mean less risk and faster installs.

#### Code Example
```js
npx depcheck   // finds unused/missing dependencies
```
---

### Q67. What is the difference between `import x from 'y'` and `import * as x from 'y'`?
**Difficulty:** `Intermediate`
**Category:** Modules & npm

#### Answer
The first imports the default export as `x`. The second imports the entire module namespace object (all named exports) as `x`. Namespace objects are read-only.

#### Code Example
```js
import express from 'express'      // default
import * as fs from 'node:fs'      // namespace
```
---

### Q68. How do you dynamically build an import path safely?
**Difficulty:** `Advanced`
**Category:** Modules & npm

#### Answer
Validate/whitelist the segment before interpolating to prevent loading arbitrary files, then use dynamic `import()`. Never feed unsanitized user input into a module path.

#### Code Example
```js
const allowed = { pg: './pg.js', mysql: './mysql.js' }
const driver = await import(allowed[name])
```
---

### Q69. What is a polyfill vs a shim?
**Difficulty:** `Advanced`
**Category:** Modules & npm

#### Answer
A polyfill implements a missing standard API using existing features (e.g. `fetch` in old Node). A shim intercepts/normalizes an existing API's behavior. Both smooth over environment differences.

#### Code Example
```js
globalThis.fetch ??= require('node-fetch') // polyfill for old Node
```
---

### Q70. How do you structure a large Node project's modules?
**Difficulty:** `Experienced`
**Category:** Modules & npm

#### Answer
Group by feature/domain (not by technical type), keep modules small and single-purpose, expose clear public interfaces via index files, avoid circular deps, and separate pure logic from I/O for testability.

#### Code Example
```js
// src/users/{controller,service,repository,index}.js
export { userRoutes } from './controller.js'
```
---
