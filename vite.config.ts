import { defineConfig } from 'vite'
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import { join } from 'path'
import builtins from 'builtin-modules'
import { isDev } from './scripts/utils'
import { preact } from '@preact/preset-vite'
import UnoCSS from 'unocss/vite'
import presetWind from 'unocss/preset-wind'

const banner = `/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
if you want to view the source, please visit the github repository of this plugin
*/
`

// https://vitejs.dev/config/
export default defineConfig({
  esbuild: {
    banner,
  },
  define: {
    __DEV__: isDev,
    'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production'),
  },
  build: {
    sourcemap: isDev && 'inline',
    lib: {
      entry: 'src/main.ts',
      formats: ['cjs'],
    },
    watch: isDev ? {} : undefined,
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
      presets: [presetWind()],
    }),
  ],
})
