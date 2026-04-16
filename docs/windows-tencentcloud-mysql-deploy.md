# 腾讯云 Windows 服务器 + MySQL 部署指南

本文档面向当前项目 `ielts_vocabulary`，目标是：

- 在腾讯云 Windows 服务器上部署当前网站
- 在同一台 Windows 服务器上安装 MySQL
- 用一个域名对外提供 Web 页面和 API
- 为后续微信小程序复用同一套后端接口做准备

## 1. 先说结论

当前项目不是纯前端，也不是纯后端，而是一个 `Next.js` 全栈项目：

- 前端页面在 `app/(main)`、`app/(auth)` 下
- 后端接口在 `app/api` 下

所以部署方式是：

- 前端和后端一起部署
- 运行一个 Next.js 服务
- 对外通过同一个域名访问
- 页面走 `/xxx`
- 接口走 `/api/xxx`

例如：

- 页面：`https://your-domain.com/stories`
- 接口：`https://your-domain.com/api/stories`

后续如果做微信小程序：

- 小程序前端需要重写
- 但数据库和后端接口可以继续复用

## 2. 当前项目技术栈

从当前代码仓库看，项目的技术栈是：

- 前端：`Next.js 15`
- UI：`React 19`
- 样式：`Tailwind CSS`
- 接口层：`Next.js Route Handlers`
- 语言：`TypeScript`
- 状态管理：`Zustand`
- ORM 预留：`Drizzle ORM`
- 当前数据库预留：`SQLite / D1`
- 当前主业务实际数据源：大量接口仍在使用 `mockDb`

需要特别注意：

- 当前项目很多正式业务接口还没有完全切到真实数据库
- 正式上线前，需要把 `mockDb` 相关逻辑迁移到 MySQL

## 3. 推荐部署架构

推荐你现在采用下面这个最低成本方案：

1. 腾讯云 Windows 服务器
2. 服务器上安装 Node.js
3. 服务器上安装 pnpm
4. 服务器上安装 MySQL 8.0
5. 服务器上运行 Next.js 服务
6. 用 Nginx 或 Caddy 做 80/443 反向代理
7. 域名解析到这台腾讯云服务器

结构如下：

```text
用户浏览器 / 微信小程序
        |
        v
   your-domain.com
        |
        v
Windows Server
  - Nginx / Caddy
  - Next.js 应用
  - MySQL 8.0
```

## 4. 需要提前准备的东西

部署前建议先准备好：

1. 腾讯云 Windows 服务器的管理员账号和密码
2. 你的域名
3. 域名 DNS 管理权限
4. 一个专门放项目的目录，例如 `D:\deploy\ielts_vocabulary`
5. 一个专门放备份的目录，例如 `D:\backup\mysql`

## 5. 官方下载地址

建议只从官方地址下载。

### 5.1 MySQL Windows Installer

官方下载页：

`https://dev.mysql.com/downloads/windows/installer/`

建议选择：

- `MySQL Installer for Windows`
- 优先选择 `Windows (x86, 32-bit), MSI Installer`

说明：

- 即使你的系统是 64 位，也可以使用这个官方安装器
- 安装器会帮你安装 MySQL Server 以及相关组件

### 5.2 Node.js

官方下载页：

`https://nodejs.org/en/download`

建议：

- 选择 `LTS` 版本
- 下载 `Windows Installer (.msi)`

### 5.3 Git for Windows

官方下载页：

`https://git-scm.com/download/win`

### 5.4 pnpm

官方安装文档：

`https://pnpm.io/installation`

如果你已经安装了 Node.js，最简单的安装方式：

```powershell
npm install -g pnpm
```

## 6. Windows 服务器软件安装顺序

建议安装顺序：

1. Git
2. Node.js
3. pnpm
4. MySQL 8.0
5. Nginx 或 Caddy

## 7. 在 Windows 上安装 MySQL 8.0

这里按小白友好的最小可用方案来。

### 7.1 运行 MySQL Installer

下载完安装器后：

1. 双击运行
2. 选择安装类型

建议选择：

- `Developer Default` 或 `Server only`

如果你只是为了这台机器部署项目，推荐：

- `Server only`

### 7.2 配置类型

安装过程中会进入 MySQL Server 配置页面。

建议这样选：

- Config Type：`Development Computer` 或 `Server Computer`
- Connectivity：
  - TCP/IP：勾选
  - Port：`3306`
  - Open Windows Firewall ports：勾选

如果你只打算让本机访问 MySQL，也可以后面再收紧。

### 7.3 设置 root 密码

一定要设置并记住 `root` 密码。

建议：

- 不要用太简单的密码
- 把密码保存到密码管理工具里

例如：

```text
用户名: root
密码: 你自己设置
```

### 7.4 Windows Service 配置

建议选：

- Configure MySQL Server as a Windows Service：勾选
- Windows Service Name：`MySQL80`
- Start the MySQL Server at System Startup：勾选

这样服务器重启后 MySQL 会自动启动。

### 7.5 安装完成后验证

打开 PowerShell，执行：

```powershell
mysql -u root -p
```

输入密码后，如果能进入 MySQL 命令行，说明安装成功。

### 7.6 如果提示 mysql 不是内部命令

说明环境变量没有自动配好。

一般把下面目录加入系统 PATH 即可：

```text
C:\Program Files\MySQL\MySQL Server 8.0\bin
```

然后重新打开 PowerShell 再试：

```powershell
mysql -u root -p
```

## 8. 创建项目数据库

登录 MySQL：

```powershell
mysql -u root -p
```

执行：

```sql
CREATE DATABASE ielts_vocabulary
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

再创建一个项目专用账号，不建议生产环境长期用 root 直连：

```sql
CREATE USER 'ielts_user'@'localhost' IDENTIFIED BY '你的数据库密码';
GRANT ALL PRIVILEGES ON ielts_vocabulary.* TO 'ielts_user'@'localhost';
FLUSH PRIVILEGES;
```

如果未来你明确需要允许外部连接，再额外配置。

## 9. 拉取和部署项目代码

### 9.1 建议目录

建议在服务器上创建目录：

```text
D:\deploy\ielts_vocabulary
```

### 9.2 拉取项目

如果你用 Git：

```powershell
cd D:\deploy
git clone 你的仓库地址 ielts_vocabulary
cd .\ielts_vocabulary
```

如果你不用 Git，也可以直接上传项目压缩包到服务器再解压。

### 9.3 安装依赖

```powershell
pnpm install
```

## 10. 这个项目上线前必须处理的事

这是最重要的一段。

当前项目很多接口不是直接从 MySQL 读，而是从 `mockDb` 读。

例如这类文件：

- `lib/db/mock.ts`
- `app/api/stories/route.ts`
- `app/api/admin/activation-codes/list/route.ts`

这意味着：

- 当前有些数据是内存数据
- 服务一重启，内存态数据会丢
- 正式部署前，必须把核心业务接口迁到 MySQL

也就是说：

- 安装 MySQL 只是第一步
- 还需要把项目代码改成真正连接 MySQL

## 11. 推荐的数据库接入思路

因为你未来还要上微信小程序，所以建议后端 API 保持统一。

推荐目标：

1. Web 网站调用 `/api/*`
2. 未来小程序也调用同一套 `/api/*`
3. 所有核心业务最终都从 MySQL 读取

建议至少把这些模块切到 MySQL：

- 用户
- 激活码
- 收藏
- 学习记录
- 故事列表
- 词表

## 12. 环境变量建议

项目正式接入 MySQL 后，建议使用 `.env.production`。

示例：

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=请改成你自己的强随机字符串

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=ielts_vocabulary
DB_USER=ielts_user
DB_PASSWORD=你的数据库密码
```

如果后面你使用 `DATABASE_URL` 形式，也可以改成：

```env
DATABASE_URL=mysql://ielts_user:你的数据库密码@127.0.0.1:3306/ielts_vocabulary
```

## 13. 本地启动生产服务

在服务器项目目录执行：

```powershell
pnpm build
pnpm start
```

默认会监听：

```text
http://localhost:3000
```

如果浏览器在服务器本机打开能访问，说明 Next 服务已启动。

## 14. 建议用 PM2 管理 Next 进程

安装 PM2：

```powershell
npm install -g pm2
```

启动项目：

```powershell
cd D:\deploy\ielts_vocabulary
pm2 start "pnpm start" --name ielts-vocabulary
```

查看状态：

```powershell
pm2 list
```

查看日志：

```powershell
pm2 logs ielts-vocabulary
```

如果服务器重启后也要自动拉起，需要再配置开机自启。

## 15. 域名与反向代理

推荐：

- 网站主域名：`www.your-domain.com`
- 或直接用：`your-domain.com`

Nginx/Caddy 做的事情：

1. 接收 80/443 请求
2. 反向代理到 `http://127.0.0.1:3000`
3. 提供 HTTPS

逻辑上就是：

```text
https://your-domain.com --> Nginx/Caddy --> http://127.0.0.1:3000
```

## 16. 前端和后端是怎么部署的

这个项目的“前后端部署关系”要理解清楚：

### 16.1 现在的结构

当前是单仓库一体化项目：

- 前端：Next 页面
- 后端：Next API

部署时不是分成两个服务，而是统一部署一个 Next 服务。

### 16.2 对外访问方式

- 前端页面：
  - `/login`
  - `/home`
  - `/stories`
- 后端接口：
  - `/api/auth/login`
  - `/api/stories`
  - `/api/dictionary/[word]`

所以部署说明可以简单理解成：

- 前端和后端一起部署
- 同一个域名下提供服务

## 17. 后续微信小程序怎么复用

后面如果你要做微信小程序：

- 小程序前端需要重写
- 当前 Web 前端不能直接搬到小程序
- 但后端接口和数据库可以继续复用

未来建议结构：

```text
Web 前端（Next.js）
       |
       v
统一后端 API（当前项目里的 app/api）
       |
       v
MySQL
       ^
       |
微信小程序前端（后续新增）
```

所以你现在在腾讯云 Windows 上安装 MySQL，不代表以后一定要迁库。

只要你后续：

- 保留同一套 API
- 保留同一套 MySQL

那么小程序可以直接复用。

## 18. 微信小程序需要额外注意的事

小程序后面会要求你配置合法域名，通常要满足：

- 使用 HTTPS
- 域名已备案
- 接口域名加入小程序后台合法域名列表

所以你现在就应该尽量按正式域名来部署，而不是长期依赖 IP 地址。

## 19. 备份建议

你是自装 MySQL，一定要自己做备份。

建议至少做：

1. 每天导出数据库
2. 导出文件保存到单独目录
3. 最好再同步一份到其他磁盘或对象存储

常用命令：

```powershell
mysqldump -u root -p ielts_vocabulary > D:\backup\mysql\ielts_vocabulary.sql
```

## 20. Windows 自装 MySQL 方案的优缺点

### 优点

- 成本低
- 不需要额外买托管数据库
- 最适合当前你的预算
- 后续小程序也能共用

### 缺点

- 需要自己维护
- 需要自己备份
- 需要自己处理服务启动、权限、安全
- 比托管数据库更容易踩坑

## 21. 你当前最推荐的执行顺序

建议按这个顺序推进：

1. 在 Windows 服务器上安装 Node.js、pnpm、MySQL
2. 创建 `ielts_vocabulary` 数据库
3. 在服务器上部署当前项目
4. 先确认 `pnpm build` 和 `pnpm start` 正常
5. 再把 `mockDb` 逐步替换成 MySQL
6. 配置域名和 HTTPS
7. 网站上线
8. 后续再做微信小程序前端

## 22. 最后一句提醒

你现在不是“没有前端”，而是“前后端都在同一个 Next 项目里”。

所以部署不是拆成前后端两个项目去上，而是：

- 先部署整个 Next 项目
- 再把核心接口从 `mockDb` 换成 MySQL

如果你下一步要继续推进，最合理的是：

1. 先完成 MySQL 安装
2. 再开始把当前项目接 MySQL

下一步我可以继续帮你做：

- 输出一份“Windows 安装 MySQL 后，当前项目如何改成连接 MySQL”的开发清单
- 或者直接开始改代码，把 `mockDb` 逐步切到真实数据库
