import vue from '@vitejs/plugin-vue'
import { resolve } from 'pathe'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
/* import VueDevTools from 'vite-plugin-vue-devtools' */

function stringPlugin(cfg?: { include?: string[] }) {
  const include = cfg?.include || ['**/*.xml', '**/*.txt', '**/*.raw']
  return {
    name: 'string',
    transform(src, id) {
      if (include.some(pattern => id.endsWith(pattern.replace('**/*', '')))) {
        // 将 xml 文件内容导出为字符串
        return {
          code: `export default ${JSON.stringify(src)};`,
          map: null,
        }
      }
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    /*     VueDevTools(), */
    vue({
      script: {
        propsDestructure: true,
      },
    }),
    AutoImport({
      dts: true,
      eslintrc: {
        enabled: true, // <-- this
      },
      imports: ['vue'],
    }),
    Components({
      /* options */
    }),
    UnoCSS({
      /* options */
      theme: {
        colors: {
          'tres-primary': '#82dbc5',
        },
      },
    }),
    stringPlugin(),
  ],
  resolve: {
    alias: {
      simrenderer: resolve(__dirname, '../src/index.ts'),
    },
    dedupe: ['three'],
  },
})
