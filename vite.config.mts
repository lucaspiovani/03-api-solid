import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    projects: [
      {
        plugins: [tsconfigPaths()],
        test: {
          name: 'unit',
          include: ['src/use-cases/**/*.spec.ts'],
        },
      },
      {
        plugins: [tsconfigPaths()],
        test: {
          name: 'e2e',
          include: ['src/http/controllers/**/*.spec.ts'],
          environment:
            './prisma/vitest-enviroment-prisma/prisma-test-enviroment.ts',
          poolOptions: {
            forks: {
              singleFork: true,
            },
          },
          server: {
            deps: {
              inline: ['@/lib/prisma'],
            },
          },
        },
      },
    ],
  },
})
