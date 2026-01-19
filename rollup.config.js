import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import postcss from 'rollup-plugin-postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import { visualizer } from 'rollup-plugin-visualizer';

const production = !process.env.ROLLUP_WATCH;

const plugins = [
  resolve(),
  commonjs(),
  typescript({
    tsconfig: './tsconfig.json',
    declaration: true,
    declarationDir: 'dist/types'
  }),
  postcss({
    extract: 'cookiecraft.css',
    minimize: production,
    plugins: [
      autoprefixer(),
      production && cssnano({
        preset: ['default', {
          discardComments: { removeAll: true }
        }]
      })
    ].filter(Boolean)
  })
];

export default [
  // UMD build (for CDN)
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/cookiecraft.js',
      format: 'umd',
      name: 'CookieCraft',
      sourcemap: true
    },
    plugins: [
      ...plugins,
      production && visualizer({
        filename: 'dist/stats.html',
        gzipSize: true,
        brotliSize: true
      })
    ].filter(Boolean)
  },

  // Minified UMD
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/cookiecraft.min.js',
      format: 'umd',
      name: 'CookieCraft',
      sourcemap: true
    },
    plugins: [
      ...plugins,
      terser({
        compress: {
          passes: 2,
          pure_getters: true,
          unsafe: true
        },
        mangle: {
          properties: {
            regex: /^_private/
          }
        },
        format: {
          comments: false
        }
      })
    ]
  },

  // ESM build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/cookiecraft.esm.js',
      format: 'esm',
      sourcemap: true
    },
    plugins
  }
];
