// PM2 进程配置 —— 在项目根目录执行 `pm2 start ecosystem.config.js`
// 端口从 .env 的 PORT 读取并注入，next start 会监听它。改端口只改 .env，不动代码。
const fs = require("fs");
const path = require("path");

function readEnvPort() {
  try {
    const content = fs.readFileSync(path.join(__dirname, ".env"), "utf8");
    for (const line of content.split("\n")) {
      if (line.trim().startsWith("#")) continue;
      const m = line.match(/^\s*PORT\s*=\s*(.+?)\s*$/);
      if (m) return m[1].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* .env 不存在时用默认 */
  }
  return "3001";
}

module.exports = {
  apps: [
    {
      name: "rally",
      script: "npm",
      args: "start",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: readEnvPort(),
      },
    },
  ],
};
