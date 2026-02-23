import { resolve } from 'node:path';

import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

const repoRoot = resolve(__dirname, '../..');

export default defineConfig({
  root: __dirname,
  plugins: [
    tsconfigPaths({
      projects: [resolve(repoRoot, 'tsconfig.base.json')],
    }),
  ],
  test: {
    environment: 'node',
    include: ['test/**/*.e2e-spec.ts'],
  },
});
