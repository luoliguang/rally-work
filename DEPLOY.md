# 部署到云服务器（宝塔面板）

Next.js 16 + PostgreSQL，端口 3001，Nginx 反向代理。

---

## 0. 准备：服务器需要的软件

在宝塔面板「软件商店」里安装：

- **Node.js 版本管理器**（安装 **Node 20.9+**，Next 16 必需；推荐 20 LTS）
- **PostgreSQL**（任意 14+ 版本）
- **Nginx**（建网站时自带）
- **PM2 管理器**（软件商店搜 PM2，或命令行 `npm i -g pm2`）

---

## 1. 建站点 + 域名

宝塔 → 网站 → 添加站点：
- 域名：填你的域名（如 `rally.example.com`）
- 类型：**纯静态 / 不创建数据库 / 不创建 FTP**（我们用反向代理，不需要 PHP）
- 站点目录：记下来，例如 `/www/wwwroot/rally-work`

---

## 2. 创建数据库

宝塔 → 数据库 → PostgreSQL → 添加数据库：
- 数据库名：`rally_db`
- 用户名：`rally_user`
- 密码：自己设一个强密码（记下来）

---

## 3. 拉取代码

宝塔 → 终端（或 SSH），进入站点目录：

```bash
cd /www/wwwroot/rally-work
# 首次部署（目录要为空）
git clone git@github.com:luoliguang/rally-work.git .
# 如果服务器没配 SSH key，用 https：
# git clone https://github.com/luoliguang/rally-work.git .
```

> 之后更新代码只需 `git pull`（见第 8 节）。

---

## 4. 配置环境变量

在项目根目录新建 `.env`（这个文件不在 git 里，需手动建）：

```bash
cat > .env <<'EOF'
DATABASE_URL=postgresql://rally_user:你的数据库密码@localhost:5432/rally_db
ADMIN_PASSWORD=你的管理员密码
PORT=3001
EOF
```

> - `UPLOAD_DIR` 不用填，默认就写到项目内 `public/uploads`。
> - **`PORT`：服务器上 3001 被占用就改成空闲端口**（如 `4010`）。PM2 会自动读取它，
>   `next start` 据此监听。改完务必让第 7 节 Nginx 反代的目标端口与之**保持一致**。

---

## 5. 安装依赖 + 初始化数据库 + 构建

```bash
cd /www/wwwroot/rally-work
npm install            # 安装依赖
npm run db:init        # 一键建表（visits/reactions/comments/teammates）
npm run build          # 生产构建
```

---

## 6. 用 PM2 启动

```bash
pm2 start ecosystem.config.js
pm2 save               # 保存进程列表
pm2 startup            # 让 PM2 开机自启（按提示再执行它输出的那条命令）
```

确认运行：`pm2 status` 应看到 `rally` 为 online。
本机测试：`curl http://127.0.0.1:3001` 有返回即正常。

---

## 7. 配置 Nginx 反向代理

宝塔 → 网站 → 你的站点 → 设置 → 反向代理 → 添加反向代理：
- 代理名称：rally
- 目标 URL：`http://127.0.0.1:3001`　← **端口要和 `.env` 里的 `PORT` 一致**
- 发送域名：`$host`

保存后，宝塔会生成配置。**再手动补一条**让访客真实 IP 能传给应用（访问统计需要），以及让上传的媒体走 Nginx 直出。

在该站点的「配置文件」里，`location /` 的 proxy 块中确认/补充：

```nginx
location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;  # 真实访客 IP
    proxy_set_header X-Real-IP $remote_addr;
    proxy_http_version 1.1;
}

# 上传的图片/视频由 Nginx 直接托管，不经过 Node（更快）
location /uploads/ {
    alias /www/wwwroot/rally-work/public/uploads/;
    expires 30d;
}
```

保存并重载 Nginx。

---

## 8. 申请 HTTPS（推荐）

宝塔 → 网站 → 设置 → SSL → Let's Encrypt → 申请并开启「强制 HTTPS」。

---

## 9. 以后更新代码

```bash
cd /www/wwwroot/rally-work
git pull
npm install            # 依赖有变动时
npm run db:init        # 表结构有变动时（幂等，可放心重复跑）
npm run build
pm2 restart rally
```

---

## 常见问题

- **页面 502**：应用没起来。`pm2 logs rally` 看报错，多半是 `.env` 数据库连接不对。
- **访客数一直不涨**：Nginx 没传 `X-Forwarded-For`，检查第 7 节配置。
- **上传图片 404**：检查 `/uploads/` 的 Nginx `alias` 路径是否指向项目的 `public/uploads/`。
- **Node 版本报错**：宝塔 Node 版本管理器里确认默认版本是 20.9+，并把命令行默认版本也切过去。
