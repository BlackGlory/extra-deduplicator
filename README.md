# Hallu
Hallu是一个建立在Deno运行时上的基于用户脚本的hackable/moddable通知生成器,
它是浏览器扩展程序Gloria的继任者.

## 安装
```sh
git clone git@github.com:BlackGlory/hallu.git
```

## 配置
找到`src/config.ts`文件, 你需要在此处手动实现`getCookies`和`notify`方法.

### getCookies
```ts
function getCookies(domain: string): Awaitable<string | null>
```

只有在你的用户脚本需要注入Cookies的情况下, 你才需要实现它.
该函数的返回值是可选的, 默认实现为在所有情况下返回`null`(不使用Cookies).

### notify
```ts
function notify(notifications: INotification[]): Awaitable<void>
```

所有被决定发送的通知都会传至此函数.
通过编写你自己的实现, 你想把通知发到哪里都可以.
将通知发送到IM或电子邮箱是常见的选择, 利用类似[Apprise]的服务可以减轻实现此类通知的难度.

如果你只需要在单机上生成和接收通知, 那么也可以选择直接通过操作系统的API弹出通知,
这也是我们在`config.ts`里提供的默认实现.
默认实现只支持非常有限的通知功能, 所以你很可能会想要修改它.

[Apprise]: https://github.com/caronc/apprise-api

作为后备选项, 我们还提供一个名为Inbox的自托管解决方案, 在你不想走简单路径的情况下, 可以尝试一下它.
作为自托管解决方案, Inbox需要你有一台可以在公网访问的服务器.
为防止中间人攻击, 你最好有一个域名, 以便开启SSL.
如果你有一台长时间运行的家庭设备, 可以尝试通过ngrok和ZeroTier这样的内网穿透方案来替代.

## 使用
```sh
# 以开发模式启动Hallu
deno task dev

# 将Hallu编译为可执行文件
deno task build

# 启动可执行文件
deno task start

# 试运行用户脚本
deno task test <script-relative-filename>

# 更新用户脚本(基于用户脚本的元数据`@update-url`)
deno task update <script-relative-filename>

# 更新所有用户脚本(基于用户脚本的元数据`@update-url`)
deno task update-all

# 清空存储数据
deno task clean <id>

# 清空所有存储数据
deno task clean-all
```

## 用户脚本
用户脚本是一个ESM模块, 模块的默认导出是一个被`script`函数包装过的函数.

学习编写用户脚本最好的方式是阅读已有的例子, 你可以在存储库的scripts目录中找到官方提供的脚本.
