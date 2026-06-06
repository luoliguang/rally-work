// 规范化媒体地址：保证本地路径一定以 "/" 开头（绝对路径），
// 这样在任何页面（首页 / 详情页）都能正确解析，不会因相对路径而 404。
// - http(s):// 或 data: 开头 → 原样返回
// - 已是 "/xxx" → 原样返回
// - "uploads/xxx" / "./uploads/xxx" → 补成 "/uploads/xxx"
export function mediaUrl(url?: string): string {
  if (!url) return "";
  if (/^(https?:)?\/\//i.test(url) || url.startsWith("data:") || url.startsWith("/")) {
    return url;
  }
  return "/" + url.replace(/^\.?\/*/, "");
}
