import * as path from 'https://deno.land/std@0.208.0/path/mod.ts'

/**
 * Deno运行时无法分辨项目是否经过编译, 在此通过检查可执行文件的名称来判断.
 * 相关issue: https://github.com/denoland/deno/issues/15996
 * 
 * 有点可悲的是, 调用`Deno.execPath`需要具有内部表示`<exec_path>`的阅读权限,
 * 而Deno不能在预先设置权限的情况下提供此值.
 * 相关issue: https://github.com/denoland/deno/issues/16766
 */
export function isCompiled(): boolean {
  const execPath = Deno.execPath()
  const basename = path.basename(execPath, path.extname(execPath))
  return basename.toLowerCase() !== 'deno'
}
