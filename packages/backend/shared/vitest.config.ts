import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

const repoRoot = resolve(__dirname, '../../..');

export default defineConfig({
  root: __dirname,
  plugins: [
    tsconfigPaths({
      projects: [resolve(repoRoot, 'tsconfig.base.json')],
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
  },
});
