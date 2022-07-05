import path from 'path'
import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import Inspect from 'vite-plugin-inspect'
import AutoImport from 'unplugin-auto-import/vite'
import Icons, { ViteIconsResolver } from 'vite-plugin-icons'
import Components from 'vite-plugin-components'
import Unocss from 'unocss/vite'

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@/': `${path.resolve('src')}/`
    }
  },

  plugins: [
    Vue({
      include: [/\.vue$/],
      reactivityTransform: true
    }),
    AutoImport({
      imports: ['vue'],
      dts: 'src/auto-imports.d.ts',
      dirs: ['src/composables', 'src/store'],
      vueTemplate: true
    }),
    Components({
      globalComponentsDeclaration: true,
      customComponentResolvers: [
        ViteIconsResolver({
          componentPrefix: ''
        })
      ]
    }),
    Icons(),
    Unocss(),
    Inspect()
  ],

  test: {
    include: ['test/**/*.test.ts'],
    environment: 'jsdom',
    deps: {
      inline: ['@vue']
    }
  }
})
