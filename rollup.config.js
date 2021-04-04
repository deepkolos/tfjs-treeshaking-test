/**
 * @license
 * Copyright 2020 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import * as path from 'path';
import { terser } from 'rollup-plugin-terser';
import visualizer from 'rollup-plugin-visualizer';

const sourcemap = false;

function replaceModelUrl() {
  return {
    transform(code) {
      code = code
        .replace('fromTFHub:', 'fromTFHub_:')
        .replace(
          'https://tfhub.dev/tensorflow/tfjs-model/blazeface/1/default/1',
          'https://cdn.static.oppenlab.com/weblf/test/blazeface/model.json',
        );
      return { code };
    },
  };
}

function getPlugins(options) {
  let plugins = [];

  if (options.useCustomTfjs) {
    plugins.push(
      // replace top level imports to tfjs-core with custom import.
      // after v3 is out we still need to do this in converter.
      alias({
        entries: [
          {
            find: /@tensorflow\/tfjs$/,
            replacement: path.resolve(__dirname, options.customTfjsPath),
          },
          {
            find: /@tensorflow\/tfjs-core$/,
            replacement: path.resolve(__dirname, options.customTfjsCorePath),
          },
          {
            find: '@tensorflow/tfjs-core/dist/ops/ops_for_converter',
            replacement: path.resolve(__dirname, options.customOpsPath),
          },
        ],
      }),
    );
  }

  plugins = [
    ...plugins,
    replaceModelUrl(),
    resolve({ browser: true }),
    commonjs({ include: ['node_modules/**'] }),
    // terser({ output: { comments: false } }),
    // serve(),
  ];

  if (options.visualize) {
    plugins.push(visualizer({ sourcemap, filename: options.visPath }));
  }

  return plugins;
}

function makeBundle(useCustomTfjs, treeshake, input, outputPath) {
  return {
    input,
    treeshake,
    output: {
      file: `${outputPath}/index_rollup.js`,
      sourcemap,
      format: 'umd',
    },
    plugins: [
      ...getPlugins({
        useCustomTfjs: useCustomTfjs,
        customTfjsPath: './custom_tfjs/custom_tfjs.js',
        customTfjsCorePath: './custom_tfjs/custom_tfjs_core.js',
        customOpsPath: './custom_tfjs/custom_ops_for_converter.js',
        visualize: true,
        visPath: `${outputPath}/index_rollup.js.html`,
      }),
    ],
  };
}

module.exports = [
  makeBundle(true, false, 'index-full.js', 'dist/custom-full'),
  makeBundle(true, true, 'index-full.js', 'dist/custom-full-treeshake'),
  makeBundle(true, false, 'index-partial.js', 'dist/custom-partial'),
  makeBundle(true, true, 'index-partial.js', 'dist/custom-partial-treeshake'),
  makeBundle(true, false, 'index-partial-core.js', 'dist/custom-partial-core'),
  makeBundle(true, true, 'index-partial-core.js', 'dist/custom-partial-core-treeshake'),

  makeBundle(false, true, 'index-partial.js', 'dist/partial-treeshake'),
  makeBundle(false, false, 'index-partial.js', 'dist/partial'),

  makeBundle(false, false, 'index-full.js', 'dist/full'),
  makeBundle(false, true, 'index-full.js', 'dist/full-treeshake'),
];
