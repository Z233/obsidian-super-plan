import { defineConfig } from 'vite'
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import { isDev, r } from './scripts/utils'
import { windi } from 'svelte-windicss-preprocess'
import { join } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  root: r('src'),
  resolve: {
    alias: {
      src: join(__dirname, 'src'),
    },
  },
  build: {
    outDir: r('dist'),
    sourcemap: isDev ? 'inline' : false,
    rollupOptions: {
      input: {
        tracker: r('src/window/tracker/index.html'),
      },
    },
  },
  server: {},
  plugins: [
    svelte({
      preprocess: [vitePreprocess(), windi({})],
    }),
  ],
})
