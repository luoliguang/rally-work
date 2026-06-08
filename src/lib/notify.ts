/**
 * 飞书机器人通知
 * 在有新留言时向飞书群发送消息卡片
 */

export async function notifyNewComment(nickname: string, content: string) {
  const webhookUrl = process.env.FEISHU_WEBHOOK_URL;
  if (!webhookUrl) return; // 未配置则静默跳过

  const siteUrl = process.env.SITE_URL ?? "";
  const time = new Date().toLocaleString("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });

  const body = {
    msg_type: "interactive",
    card: {
      header: {
        title: { tag: "plain_text", content: "🏸 Rally · 新留言" },
        template: "green",
      },
      elements: [
        {
          tag: "div",
          fields: [
            {
              is_short: true,
              text: { tag: "lark_md", content: `**昵称**\n${nickname}` },
            },
            {
              is_short: true,
              text: { tag: "lark_md", content: `**时间**\n${time}` },
            },
          ],
        },
        {
          tag: "div",
          text: { tag: "lark_md", content: `**留言内容**\n${content}` },
        },
        ...(siteUrl
          ? [
              {
                tag: "action",
                actions: [
                  {
                    tag: "button",
                    text: { tag: "plain_text", content: "查看留言墙" },
                    type: "primary",
                    url: siteUrl,
                  },
                ],
              },
            ]
          : []),
      ],
    },
  };

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    // 通知失败不影响留言提交
  }
}
