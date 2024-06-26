import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import UnoCSS from 'unocss/vite'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  return {
    plugins: [
      vue(),
      AutoImport({
        dts: './src/types/auto-imports.d.ts',
        imports: [
          'vue',
          'vue-router',
          '@vueuse/core',
          {
            'naive-ui': ['useDialog', 'useMessage', 'useNotification', 'useLoadingBar']
          }
        ]
      }),
      UnoCSS({ envMode: command === 'build' ? 'build' : 'dev' }),
      Components({
        resolvers: [NaiveUiResolver()],
        dts: './src/types/components.d.ts'
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        runtime: path.resolve(__dirname, './wailsjs/runtime'),
        backend: path.resolve(__dirname, './wailsjs/go')
      }
    }
  }
})
