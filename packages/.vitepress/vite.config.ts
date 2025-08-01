import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'rolldown-vite'
import UnoCSS from 'unocss/vite'
import IconsResolver from 'unplugin-icons/resolver'
import Icons from 'unplugin-icons/vite'
import Components from 'unplugin-vue-components/vite'
import Inspect from 'vite-plugin-inspect'
import { getChangeLog, getFunctionContributors } from '../../scripts/changelog'
import { ChangeLog } from './plugins/changelog'
import { Contributors } from './plugins/contributors'
import { MarkdownTransform } from './plugins/markdownTransform'
import { PWAVirtual } from './plugins/pwa-virtual'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const require = createRequire(import.meta.url)
const [changeLog, contributions] = await Promise.all([
  getChangeLog(process.env.CI ? 1000 : 100),
  getFunctionContributors(),
])

export default defineConfig({
  server: {
    fs: {
      allow: [
        resolve(__dirname, '..'),
      ],
    },
  },
  plugins: [
    // custom
    MarkdownTransform(),
    ChangeLog(changeLog),
    Contributors(contributions),

    // plugins
    Components({
      dirs: resolve(__dirname, 'theme/components'),
      include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
      resolvers: [
        IconsResolver({
          prefix: '',
        }),
      ],
      dts: resolve(__dirname, 'components.d.mts'),
      transformer: 'vue3',
    }),
    Icons({
      compiler: 'vue3',
      defaultStyle: 'display: inline-block',
    }),
    UnoCSS(),
    PWAVirtual(),
    Inspect(),
  ],
  resolve: {
    alias: {
      '@vueuse/shared': resolve(__dirname, '../shared/index.ts'),
      '@vueuse/core': resolve(__dirname, '../core/index.ts'),
      '@vueuse/math': resolve(__dirname, '../math/index.ts'),
      '@vueuse/integrations': resolve(__dirname, '../integrations'),
      '@vueuse/components': resolve(__dirname, '../components/index.ts'),
      '@vueuse/metadata': resolve(__dirname, '../metadata/index.ts'),
    },
    dedupe: [
      'vue',
      '@vue/runtime-core',
    ],
  },
  optimizeDeps: {
    exclude: [
      '@vueuse/shared',
      '@vueuse/core',
      'body-scroll-lock',
      '@vue/repl',
    ],
    include: [
      'axios',
      'yaml',
      'nprogress',
      'qrcode',
      'tslib',
      'fuse.js',
      'universal-cookie',
    ],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('@vueuse/'))
            return 'vueuse'
          if (id.includes('@vue/') || id.includes('/vue/'))
            return 'vue'
        },
      },
      /* TODO: unsupported options for Rolldown */
      // maxParallelFileOps: 5,
    },
    sourcemap: false,
  },
  css: {
    postcss: {
      plugins: [
        require('postcss-nested'),
      ],
    },
  },
  ssr: {
    noExternal: [
      '@vue/repl',
    ],
  },
})
