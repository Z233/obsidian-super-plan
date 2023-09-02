import { defineConfig } from 'vite'
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import { join } from 'path'
import builtins from 'builtin-modules'
import { isDev } from './scripts/utils'
import { preact } from '@preact/preset-vite'
import UnoCSS from 'unocss/vite'
import presetRemToPx from '@unocss/preset-rem-to-px'
import presetWind from 'unocss/preset-wind'
import fs from 'fs'

const banner = `/*
THIS IS A GENERATED/BUNDLED FILE BY ROLLUP
if you want to view the source, please visit the github repository of this plugin
*/
`

const readMiniTrackerHtml = () => {
  const html = fs.readFileSync('window/mini-tracker/index.html', 'utf-8')
  return html
}

const REM_RE = /(-?[\.\d]+)rem/g

// https://vitejs.dev/config/
export default defineConfig({
  esbuild: {
    banner,
  },
  define: {
    __DEV__: isDev,
    __MINI_TRACKER_HTML__: isDev ? '' : encodeURIComponent(readMiniTrackerHtml()),
    'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production'),
  },
  build: {
    sourcemap: isDev && 'inline',
    lib: {
      entry: 'src/main.ts',
      formats: ['cjs'],
    },
    watch: isDev
      ? {
          buildDelay: 3000,
        }
      : undefined,
    outDir: '.',
    emptyOutDir: false,
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
        assetFileNames: (chunkInfo) =>
          chunkInfo.name === 'style.css' ? 'styles.css' : '[name].[ext]',
      },
      external: [
        'obsidian',
        'electron',
        '@codemirror/autocomplete',
        '@codemirror/collab',
        '@codemirror/commands',
        '@codemirror/language',
        '@codemirror/lint',
        '@codemirror/search',
        '@codemirror/state',
        '@codemirror/view',
        '@lezer/common',
        '@lezer/highlight',
        '@lezer/lr',
        ...builtins,
      ],
    },
  },
  resolve: {
    alias: {
      src: join(__dirname, 'src'),
    },
  },
  optimizeDeps: {
    exclude: ['obsidian'],
  },
  plugins: [
    preact(),
    svelte({
      preprocess: vitePreprocess(),
      compilerOptions: { css: 'external' },
    }),
    UnoCSS({
      presets: [
        {
          name: 'rem-to-font-text-size',
          postprocess: (util) => {
            util.entries.forEach((i) => {
              const value = i[1]
              if (typeof value === 'string' && REM_RE.test(value))
                i[1] = value.replace(REM_RE, (_, p1) => `calc(${p1}*var(--font-text-size))`)
            })
          },
        },
        presetWind(),
      ],
    }),
  ],
})
