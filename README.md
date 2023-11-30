# Hallu
Hallu是一个建立在Deno运行时上的基于用户脚本的hackable/moddable通知生成器,
它是浏览器扩展程序Gloria的继任者.

## 安装
```sh
git clone git@github.com:BlackGlory/hallu.git
```

## 配置
### `config.ts`
根目录下的`config.ts`文件用于项目的全局配置, 你需要修改文件中的`getCookies`和`notify`函数.

#### getCookies
```ts
function getCookies(url: string): Awaitable<string | null>
```

该函数用于为用户脚本发出的HTTP请求填充`Cookie`标头.
只有在你的用户脚本需要注入`Cookie`标头的情况下, 才需要实现它.

#### setCookie
```ts
function setCookie(cookie: string): Awaitable<void>
```

该函数用于应用用户脚本从HTTP响应中收到的`Set-Cookie`标头.
只有在你的用户脚本需要根据`Set-Cookie`标头更新Cookie的情况下, 才需要实现它.

#### notify
```ts
function notify(notifications: INotification[]): Awaitable<void>
```

该函数发出/转发用户脚本提交的通知.
将通知发送到IM或电子邮箱是常见的选择, 利用类似[Apprise]的服务可以减轻实现此类通知的难度.
如果你只需要在单机上生成和接收通知, 那么也可以选择借助[deno_notify]等本机模块弹出本机通知.

[Apprise]: https://github.com/caronc/apprise-api
[deno_notify]: https://github.com/Pandawan/deno_notify

作为后备选项, 我们还提供一个名为Inbox的自托管解决方案, 在你不想走简单路径的情况下, 可以尝试一下它.
作为自托管解决方案, Inbox需要你有一台可以在公网访问的服务器.
为防止中间人攻击, 你最好有一个域名, 以便开启SSL.
如果你有一台长时间运行的家庭设备, 可以尝试通过ngrok和ZeroTier这样的内网穿透方案来替代.

### `main.ts`
根目录下的`main.ts`文件用于项目启动, 编辑该文件以决定需要启用哪些用户脚本.

例子:
```ts
// start函数用于启动用户脚本, test函数用于测试用户脚本, 两个函数的参数相同, 只需要替换名称就可以相互切换.
// test函数只会运行用户脚本一次, 忽略所有的启动参数, 通知将在命令行输出而不是传给notify函数.
import { start, test } from '@src/start.ts'
import startup from '@scripts/startup.ts'
import subscribeRSS from '@scripts/subscribe-rss.ts'
import watchPageChanges from '@scripts/watch-page-changes.ts'

start(startup(), {
  once: true
, ignoreInitialCommit: false
, ignoreStartupCommit: false
})

start(subscribeRSS('https://news.ycombinator.com/rss'))

start(watchPageChanges({
  name: 'IP Address'
, url: 'https://icanhazip.com/'
}))
```

## 使用
```sh
# 以开发模式启动Hallu
deno task dev

# 将Hallu编译为可执行文件
deno task build

# 启动可执行文件
deno task start

# 更新用户脚本(基于用户脚本的元数据`@update-url`)
deno task update <SCRIPT_FILENAME>...

# 更新所有用户脚本(基于用户脚本的元数据`@update-url`)
deno task update-all

# 清空存储
deno clean <ID>...

# 清空所有存储
deno clean-all
```

## 概念
### 用户脚本 Script
用户脚本是一个ESM模块, 模块的默认导出是一个被`script`函数包装过的函数.
你可以通过函数参数为用户脚本添加配置项, 以重用用户脚本.

学习编写用户脚本最好的方式是阅读已有的例子, 你可以在存储库的scripts目录中找到官方提供的脚本.

### 存储 Storage
存储是Hallu内部对持久化状态的抽象.
这些持久化状态包括用户脚本提交的通知的哈希值(供过滤器使用).

Hallu当前的存储是用平面文件实现的临时数据库方案, 因为Deno生态环境中尚未有一个合适的SQLite实现.
你可以在项目的`data/storages/<storage>`里找到这些平面文件.

当前, 存储的并发控制只是在软件层面实现的粗粒度互斥锁, 这种锁定不支持多线程和多进程.
在Hallu运行时删除/编辑存储的平面文件被视作未定义行为, 应尽量避免这么做.
当存储出现故障时, 删除对应的平面文件一般可以解决问题.
