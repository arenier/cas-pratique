import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [
    tsconfigPaths({
      projects: [resolve(__dirname, 'tsconfig.base.json')],
    }),
  ],
  test: {
    environment: 'node',
    globals: true,
  },
})