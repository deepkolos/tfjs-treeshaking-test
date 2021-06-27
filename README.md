# tfjs-treeshaking-test

[[962K -> 347K] TensorflowJS 基于 Runtime 结果的 TreeShaking](https://juejin.cn/post/6947198156987711524/)

> `tf.profile`可能非所有用到的 kernel 都用到，遇到找不到的手动添加即可

已更新到`tfjs 3.7`，并修正custom-partial-core，因为cli所生成的custom_tfjs_core.js, 缺少webgl backend

```shell
ls dist/*/*.js -lh                                                                              (base) 
 568K Jun 27 22:42 dist/custom-full/index_rollup.js*
 557K Jun 27 22:42 dist/custom-full-treeshake/index_rollup.js*
 568K Jun 27 22:42 dist/custom-partial-core/index_rollup.js*
 557K Jun 27 22:43 dist/custom-partial-core-treeshake/index_rollup.js*       
 754K Jun 27 22:42 dist/custom-partial/index_rollup.js*
 744K Jun 27 22:42 dist/custom-partial-treeshake/index_rollup.js*
1009K Jun 27 22:43 dist/full/index_rollup.js*
 998K Jun 27 22:43 dist/full-treeshake/index_rollup.js*
 752K Jun 27 22:43 dist/partial/index_rollup.js*
 742K Jun 27 22:43 dist/partial-treeshake/index_rollup.js*
```

### 参考

https://github.com/mattsoulanille/tfjs_custom_module_demo
