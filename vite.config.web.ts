import { defineConfig } from 'vite'
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import { isDev, r } from './scripts/utils'
import { windi } from 'svelte-windicss-preprocess'
import { join } from 'path'
import { viteSingleFile } from 'vite-plugin-singlefile'
import UnoCSS from 'unocss/vite'
import presetWind from 'unocss/preset-wind'

// https://vitejs.dev/config/
export default defineConfig({
  root: r('src'),
  resolve: {
    alias: {
      src: join(__dirname, 'src'),
    },
  },
  build: {
    outDir: r('.'),
    sourcemap: isDev ? 'inline' : false,
    rollupOptions: {
      input: {
        'mini-tracker': r('src/window/mini-tracker/index.html'),
      },
    },
  },
  server: {},
  plugins: [
    svelte({
      preprocess: [vitePreprocess(), windi({})],
    }),
    viteSingleFile(),
    UnoCSS({
      presets: [presetWind()],
    })
  ],
})
