import * as path from 'https://deno.land/std@0.208.0/path/mod.ts'

export function getModuleRoot(): string {
  // 项目中的模块路径(例如`import.meta.url`和`Deno.mainModule`)将在编译时被硬编码, 无法直接使用.

  // 不在此使用更方便的`Deno.mainModule`是因为调用此函数时, 入口模块不一定是`/main.ts`.
  return path.dirname(path.join(path.fromFileUrl(import.meta.url), '../..'))
}
