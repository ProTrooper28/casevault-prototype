// Dev-only helper: regenerates src/routeTree.gen.ts using the same
// @tanstack/router-generator the vite plugin uses, so the generated route
// tree stays in sync with src/routes without starting a dev server.
// The Start-specific footer below mirrors what @tanstack/start-plugin-core
// appends in buildRouteRouteTreeFileFooter (see its route-tree-footer.js).
import { Generator, getConfig } from "@tanstack/router-generator";

const config = await getConfig(
  {
    target: "react",
    routesDirectory: "src/routes",
    generatedRouteTree: "src/routeTree.gen.ts",
    routeTreeFileFooter: [
      "import type { getRouter } from './router.tsx'",
      "import type { startInstance } from './start.ts'",
      "declare module '@tanstack/react-start' {\n  interface Register {\n    ssr: true\n    router: Awaited<ReturnType<typeof getRouter>>\n    config: Awaited<ReturnType<typeof startInstance.getOptions>>\n  }\n}",
    ],
  },
  process.cwd(),
);

const generator = new Generator({ config, root: process.cwd() });
await generator.run();
console.log("routeTree.gen.ts regenerated");
