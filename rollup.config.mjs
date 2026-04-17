import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'
import json from 'rollup-plugin-json'
import cleaner from 'rollup-plugin-cleaner'
import svg from 'rollup-plugin-svg'
import dts from 'rollup-plugin-dts'
import { string } from "rollup-plugin-string";

export default [
  {
    input: './src/index.ts',
    output: [
      // {
      //   dir: 'dist',
      //   format: 'cjs',
      //   entryFileNames: '[name].cjs.js',
      //   exports: 'auto',
      //   globals: {
      //     vue: 'Vue',
      //     three: 'THREE',
      //   },
      // },
      {
        dir: 'dist',
        format: 'esm',
        entryFileNames: '[name].esm.js',
        globals: {
          vue: 'Vue',
          three: 'THREE',
        },
      },
      // {
      //   dir: 'dist',
      //   format: 'umd',
      //   name: 'Allbox',
      //   entryFileNames: '[name].umd.js',
      //   globals: {
      //     vue: 'Vue',
      //     three: 'THREE',
      //   },
      // },
    ],
    external: [/^xmllint-wasm\/.*/],
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        // ./__tests__/.* doesn't work
        exclude: ['**/__tests__', '**/*.test.ts', 'jest.config.ts', 'build/**', 'playground/**'],
      }),
      json(),
      svg(),
      string({
        // Required to be specified
        include: ["**/*.xml", "**/*.raw", "**/*.txt"],
      }),
      cleaner({
        targets: ['./dist/'],
      }),
    ],
  },
  /* 单独生成声明文件 */
  {
    input: './src/index.ts',
    plugins: [dts()],
    output: {
      format: 'esm',
      file: 'dist/index.d.ts',
    },
  },
]
