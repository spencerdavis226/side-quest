import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    // The Quest's balance file keeps 4,000 finished runs, each with its
    // stage pools: with the pools The Quest 2.1 added it sits at Node's
    // default heap limit, and a worker that passes it dies without a
    // message.
    execArgv: ["--max-old-space-size=6144"],
  },
});
