import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import UnoCSS from 'unocss/vite'
import legacy from 'vite-plugin-legacy-swc'
import vueDevTools from 'vite-plugin-vue-devtools'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { vueMcpVitePlugin } from 'vue-mcp-next'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  return {
    plugins: [
      vue(),
      vueJsx(),
      AutoImport({
        dts: './src/types/auto-imports.d.ts',
        imports: [
          'vue',
          'pinia',
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
      }),
      legacy({
        targets: ['defaults', 'not IE 11'],
        modernPolyfills: true
      }),
      vueDevTools(),
      vueMcpVitePlugin({
        port: 8890, // MCP 服务器端口
        inspector: {
          enabled: true, // 启用 MCP Inspector
          autoStart: true, // 自动启动
          openBrowser: false // 是否自动打开浏览器
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    // 1. prevent vite from obscuring rust errors
    clearScreen: false,
    // 2. tauri expects a fixed port, fail if that port is not available
    server: {
      port: 3000,
      strictPort: true,
      watch: {
        // 3. tell vite to ignore watching `src-tauri`
        ignored: ['**/src-tauri/**']
      }
    }
  }
})
