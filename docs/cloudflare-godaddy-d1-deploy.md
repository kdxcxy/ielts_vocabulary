# Cloudflare + GoDaddy + D1 部署指南

如何拿cloudflare token

你想要的 Worker 名称（默认我先用 ielts-vocab）:                                                           
                                                                                                            
  注意两点：                                                                                                
                                                                                                            
  1. 先不要给 Global API Key，只给 API Token                                                                
  2. 这个 Token 至少要有这些权限：                                                                          
      - Account -> Workers Scripts: Edit                                                                    
      - Account -> Workers Tail: Read                                                                       
      - Account -> D1: Edit                                                                                 
      - User / Account 的基础读取权限                                                                       
      - 如果后面绑域名，再补 Zone DNS: Edit                                                                 
                                                                                                            
  你把这两项发我后，我下一步会直接做：                                                                      
                                                                                                            
  1. 在当前会话里设置环境变量                                                                               
  2. 尝试 wrangler whoami                                                                                   
  3. 如果通过，就直接发到 workers.dev                                                                       
  4. 把最终访问地址回给你                                                                                   
                                                                                                            
  如果你担心泄露，也可以只先给我：                                                                          
                                                                                                            
  - Account ID                                                                                              
  - 一个临时新建的 Cloudflare Token`                                                                        
                                                                                                            
  这样更安全。                                                                                              
                                                                                                            
                                                                                                            
› 我怎么知道我的token是啥？怎么拿token                                                                      
                                                                                                            
                                                                                                            
• 你这样拿，几分钟就能搞定。                                                                                
                                                                                                            
  拿 Cloudflare API Token 的路径                                                                            
                                                                                                            
  1. 登录 Cloudflare                                                                                        
  2. 点右上角头像                                                                                           
  3. 进入 My Profile                                                                                        
  4. 左侧找到 API Tokens                                                                                    
  5. 点击 Create Token                                                                                      
                                                                                                            
  直接打开一般也是这个地址：                                                                                
  https://dash.cloudflare.com/profile/api-tokens                                                            
                                                                                                            
  怎么创建                                                                                                  
  最简单是：                                                                                                
                                                                                                            
  1. 点 Create Token                                                                                        
  2. 不要用 Global API Key                                                                                  
  3. 选 Create Custom Token                                                                                 
                                                                                                            
  你现在这个项目建议的权限                                                                                  
  先按最小可用给：                                                                                          
                                                                                                            
  Account 级权限                                                                                            
                                                                                                            
  - Workers Scripts -> Edit                                                                                 
  - Workers Tail -> Read                                                                                    
  - D1 -> Edit                                                                                              
                                                                                                            
  Account Resources                                                                                         
                                                                                                            
  - 选择你的账号                                                                                            
                                                                                                            
  如果页面上还要求补一些读权限，就再加：                                                                    
                                                                                                            
  - Account Settings -> Read                                                                                
                                                                                                            
  如果你后面还要绑自定义域名，再额外加：                                                                    
                                                                                                            
  - Zone -> DNS -> Edit                                                                                     
  - Zone -> Zone -> Read                                                                                    
                                                                                                            
  但你现在还没买域名，所以这轮先不用强加 Zone 权限也行。                                                    
                                                                                                            
  创建后怎么拿                                                                                              
  创建成功后，页面会直接给你一串 token，类似这种：                                                          
                                                                                                            
  abc123xxxxxxxxxxxxxxxx                                                                                    
                                                                                                            
  你把它复制出来就行。                                                                                      
  注意：                                                                                                    
                                                                                                            
  - 这个值通常只会完整展示一次                                                                              
  - 关掉页面后可能就看不到原文了                                                                            
  - 丢了就重新建一个新的                                                                                    
                                                                                                            
  Account ID 怎么拿                                                                                         
  登录 Cloudflare 后：                                                                                      
                                                                                                            
  1. 进入任意一个账号主页                                                                                   
  2. 右侧或概览页通常能看到 Account ID                                                                      
                                                                                                            
  如果还没加域名，有时也能在账号层看到。                                                                    
  也可以在 Cloudflare Dashboard 里选中账号后看右侧信息栏。                                                  
                                                                                                            
  你现在只需要给我                                                                                          
                                                                                                            
  Cloudflare Account ID:                                                                                    
  Cloudflare API Token:

  你拿到后直接发我。
  如果你愿意，我下一条也可以继续告诉你：

  怎么检查这个 token 权限有没有给对。

To continue this session, run codex resume 019d96e5-b78d-7bc1-95f4-86a5b35a8630


本文档针对当前项目 `ielts_vocabulary`，目标是：

- 用 `Cloudflare` 部署当前 `Next.js` 全栈项目
- 域名在 `GoDaddy` 购买
- 后续数据库使用 `Cloudflare D1`
- 后续微信小程序可以复用同一套后端接口

## 1. 先看结论

这套方案可以做，但要分两步：

### 第一步：先把项目部署起来

先把现在的 Next.js 项目部署到 Cloudflare Workers，确认：

- 页面能打开
- API 能访问
- 自定义域名能绑定
- HTTPS 正常

### 第二步：再把 `mockDb` 逐步迁到 D1

当前项目很多接口还是读取 `mockDb` 内存数据，不是真数据库。

所以：

- 部署成功，不代表数据库已经上线
- 真正正式可用，必须把核心接口切到 D1

## 2. 当前项目结构怎么理解

这个项目不是纯前端，也不是纯后端，而是一个 `Next.js` 全栈项目：

- 前端页面：`app/(main)`、`app/(auth)`
- 后端接口：`app/api`
- 样式：`app/globals.css`

所以部署时不是拆成两个服务，而是：

- 部署一个 Next.js 应用
- 页面和 API 一起工作

例如：

- 页面：`https://www.your-domain.com/stories`
- 接口：`https://www.your-domain.com/api/stories`

## 3. 为什么选 Cloudflare

你现在的优先级是：

- 不想自己运维服务器
- 成本尽量低
- 后续想给小程序复用接口

Cloudflare 这套组合适合你：

- `Workers`：跑 Next.js
- `D1`：数据库
- `R2`：后面如果要放大量静态资源，可以再接
- `Custom Domain`：绑定你自己的域名

## 4. 你要知道的现实限制

### 4.1 大陆访问

通常中国大陆可以访问 Cloudflare 上的站点，但：

- 不保证像中国大陆本地云厂商那样稳定
- 不建议把“大陆低延迟、绝对稳定”当默认预期

### 4.2 小程序

以后接微信小程序时：

- 小程序前端要重写
- 当前网站前端不能直接搬过去
- 但 API 和数据库可以共用

### 4.3 当前项目还没完全接真实数据库

当前很多接口还在用：

- `lib/db/mock.ts`

所以正式上线前，要把核心业务切到 D1。

## 5. 官方文档

下面这些文档是本方案的主要参考：

- Cloudflare Workers 部署 Next.js  
  `https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/`

- OpenNext Cloudflare Getting Started  
  `https://opennext.js.org/cloudflare/get-started`

- Cloudflare D1 Getting Started  
  `https://developers.cloudflare.com/d1/get-started/`

- Cloudflare Workers 自定义域名  
  `https://developers.cloudflare.com/workers/configuration/routing/custom-domains/`

## 6. 准备工作

你要先准备好这些账号：

1. GitHub 账号
2. Cloudflare 账号
3. GoDaddy 账号

你还要准备好：

1. 当前项目代码已经在本地可运行
2. 一个准备绑定的域名，比如：
   - `your-domain.com`

## 7. 推荐域名规划

建议一开始就这么规划：

- 网站：`www.your-domain.com`
- API：`api.your-domain.com`

虽然当前项目前后端是一体化的，也可以都走同一个域名，
但后面如果你要给小程序单独接 API，这种规划更清晰。

如果你现在想先简单点，也可以先只用：

- `www.your-domain.com`

## 8. GoDaddy 买域名后的操作

### 8.1 在 GoDaddy 购买域名

买完域名后，不要急着在 GoDaddy 里继续做复杂 DNS 配置。

### 8.2 把域名接入 Cloudflare

去 Cloudflare：

1. 登录
2. 点击 `Add a domain`
3. 输入你刚买的域名
4. 让 Cloudflare 扫描现有 DNS

### 8.3 修改 GoDaddy 的 Nameserver

Cloudflare 会给你两条新的 nameserver。

然后去 GoDaddy：

1. 打开域名管理
2. 找到 `Nameservers`
3. 改成 Cloudflare 提供的那两条

等待生效，可能需要几分钟到几小时。

## 9. 在本地为 Cloudflare 部署做准备

当前项目还不是一个已经完全适配 Cloudflare Workers 的仓库。

你需要先在本地加上 Cloudflare 的 Next.js 适配。

### 9.1 确认 Node.js 版本

建议本地使用 Node.js LTS。

### 9.2 安装依赖

在项目根目录执行：

```powershell
pnpm add -D wrangler @opennextjs/cloudflare
```

说明：

- OpenNext Cloudflare 文档要求使用 `@opennextjs/cloudflare`
- Wrangler 版本至少要满足官方要求

### 9.3 登录 Cloudflare

```powershell
npx wrangler login
```

浏览器会弹出授权页，登录后完成授权。

### 9.4 更新 `wrangler.toml`

你仓库里已经有一个 `wrangler.toml`，但要按当前 Next.js on Workers 方案检查和调整。

当前至少要保证这些核心项：

```toml
name = "ielts-vocab"
main = ".open-next/worker.js"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]
```

如果后面要接 D1，再保留数据库绑定。

## 10. 为当前项目补充脚本

建议在 `package.json` 里加上这些脚本：

```json
{
  "scripts": {
    "build:cf": "opennextjs-cloudflare build",
    "preview:cf": "opennextjs-cloudflare build && wrangler dev",
    "deploy:cf": "opennextjs-cloudflare build && wrangler deploy"
  }
}
```

如果你本地命令名与文档不一致，以 OpenNext 当前官方文档为准。

## 11. 第一阶段：先部署当前项目

目标：

- 不急着马上切数据库
- 先把当前项目在 Cloudflare 上跑起来

### 11.1 本地构建

先执行：

```powershell
pnpm install
pnpm build
```

如果你已经加了 OpenNext 相关脚本，再执行：

```powershell
pnpm build:cf
```

### 11.2 本地预览 Workers 版本

```powershell
pnpm preview:cf
```

如果成功，你应该可以在本地看到 Cloudflare Workers 版本的站点。

### 11.3 正式部署

```powershell
pnpm deploy:cf
```

部署成功后，Cloudflare 会给你一个默认域名，通常类似：

```text
https://xxxx.workers.dev
```

### 11.4 先测试 workers.dev 域名

先不要急着绑正式域名。

先测试：

1. 首页能否打开
2. 登录页能否打开
3. 故事列表能否打开
4. `/api/stories` 是否返回数据

如果这些都正常，说明部署链路基本通了。

## 12. 绑定正式域名

### 12.1 在 Cloudflare 中添加 DNS 记录

你可以后面在 Cloudflare 中给 Worker 绑自定义域名。

建议先绑：

- `www.your-domain.com`

### 12.2 在 Worker 上配置 Custom Domain

按 Cloudflare Workers Custom Domains 文档操作。

你可以通过控制台或 Wrangler 配置。

### 12.3 HTTPS

Cloudflare 会自动处理证书签发。

通常你不需要自己手动申请 Let’s Encrypt。

### 12.4 验证

验证：

- `https://www.your-domain.com`

是否可以直接打开。

## 13. 第二阶段：创建 D1 数据库

现在开始做真实数据库。

### 13.1 创建数据库

在项目根目录执行：

```powershell
npx wrangler d1 create ielts-vocab-db
```

执行后，Cloudflare 会返回一段结果，其中最重要的是：

- `database_id`

### 13.2 把 D1 配置写入 `wrangler.toml`

示例：

```toml
[[d1_databases]]
binding = "DB"
database_name = "ielts-vocab-db"
database_id = "这里替换成实际 database_id"
```

你仓库里已经有这段结构，记得把真实 ID 填进去。

### 13.3 本地开发 D1

Cloudflare 支持本地 D1 开发。

后续你可以用：

```powershell
npx wrangler d1 execute ielts-vocab-db --local --command "SELECT 1;"
```

先确认本地开发链路正常。

## 14. D1 适合放什么数据

建议先把这些数据迁入 D1：

1. 用户
2. 激活码
3. 收藏
4. 学习记录
5. 故事列表
6. 词表元数据

## 15. 当前项目迁库策略

不要一次性把所有逻辑都改掉。

建议分批迁移：

### 第一批

- 登录
- 用户信息
- 激活码

### 第二批

- 收藏
- 学习记录

### 第三批

- 故事
- 词表

## 16. 为什么不能直接把 `mockDb` 当正式库

因为 `mockDb` 是内存态数据。

它的问题是：

- 服务重启后数据会丢
- 多实例时数据无法同步
- 不适合正式生产

所以你的网站如果只是部署上去但还没切 D1，本质仍然只是“演示环境”。

## 17. 项目代码要怎么改

当前你需要做的是：

1. 保留前端页面
2. 保留 `app/api/*` 作为统一 API
3. 把 API 里的数据读取逻辑从 `mockDb` 改成 `D1`

也就是说：

- 前端页面大多数不需要重写
- API 路由还继续保留
- 只是 API 的底层数据源改成 D1

## 18. 未来小程序怎么接

后续如果要做微信小程序：

- 小程序前端需要重写
- 当前 Next.js 页面不能直接搬过去
- 但 `app/api/*` 这套接口逻辑可以继续复用
- D1 数据库也可以继续复用

推荐结构：

```text
Web 网站（当前 Next.js）
        |
        v
统一 API（当前 app/api）
        |
        v
Cloudflare D1
        ^
        |
微信小程序（后续新增）
```

## 19. API 域名建议

如果未来你明确要接小程序，建议后面再补一个 API 子域名：

- `api.your-domain.com`

这样以后更适合：

- 小程序单独请求 API
- 网页和 API 清晰分离

但在当前阶段，你也可以暂时先不拆。

## 20. 你最推荐的执行顺序

请按这个顺序做，不要跳步骤：

1. GoDaddy 买域名
2. 域名切到 Cloudflare nameserver
3. 本地安装 `wrangler` 和 `@opennextjs/cloudflare`
4. 调整 `wrangler.toml`
5. 本地跑通 `preview:cf`
6. 正式部署到 `workers.dev`
7. 验证页面和 API
8. 绑定正式域名
9. 创建 D1
10. 开始把 `mockDb` 逐步切到 D1
11. 再考虑接微信小程序

## 21. 当前阶段最重要的一句话

你现在最应该避免的是：

- 一边改 Cloudflare 部署
- 一边大规模改数据库
- 一边再去做小程序

这样会同时踩三个坑。

正确做法是：

- 先部署
- 再迁库
- 最后再接小程序

## 22. 最后补一句现实建议

如果你主要目标用户是中国大陆，Cloudflare 方案能用，但你要接受：

- 成本低
- 运维轻
- 但大陆访问体验不一定最稳

如果你接受这一点，这套方案就是可行的。

## 23. 下一步建议

你看完这份文档后，最合理的下一步是：

1. 先完成 Cloudflare 账户、GoDaddy 域名、nameserver 切换
2. 再让我帮你把当前项目补成可执行的 Cloudflare 配置

也就是下一步我可以继续帮你做：

- 修改 `package.json`
- 修改 `wrangler.toml`
- 给出当前仓库最小可运行的 Cloudflare 部署改动
