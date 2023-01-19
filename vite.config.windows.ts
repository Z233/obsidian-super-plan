import { defineConfig } from 'vite'
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import { isDev, r } from './scripts/utils'
import { dirname, relative } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  root: r('src'),
  build: {
    outDir: r('dist'),
    sourcemap: isDev ? 'inline' : false,
    rollupOptions: {
      input: {
        tracker: r('src/windows/tracker/index.html'),
        pomodoro: r('src/windows/pomodoro/index.html'),
      },
    },
  },
  server: {},
  plugins: [
    svelte({
      preprocess: vitePreprocess(),
    }),
  ],
})
