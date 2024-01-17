# Hallu
Hallu是一个建立在Deno运行时上的基于用户脚本的hackable/moddable通知生成器,
它是浏览器扩展程序Gloria的继任者.

## 安装
```sh
git clone git@github.com:BlackGlory/hallu.git
```

## 配置: `main.ts`
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

### notify函数
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

## 命令
```sh
# 以开发模式启动Hallu
deno task dev

# 将Hallu编译为可执行文件
deno task build

# 启动可执行文件
deno task start

# 更新用户脚本(基于用户脚本的元数据`@update-url`)
deno task upgrade <SCRIPT_FILENAME>...

# 更新所有用户脚本(基于用户脚本的元数据`@update-url`)
deno task upgrade-all

# 删除指定容器
deno task remove <CONTAINER>...

# 删除所有容器
deno task clean

# 将源容器合并进目标容器里, 当目标容器不存在时, 该操作相当于重命名
deno task merge <CONTAINER_SOURCE> <CONTAINER_DEST>
```

## 用户脚本 Script
用户脚本是一个ESM模块, 模块的默认导出是一个被`script`函数包装过的函数.
你可以通过函数参数为用户脚本添加配置项, 以重用用户脚本.

学习编写用户脚本最好的方式是查看相应的接口和阅读已有的例子.
