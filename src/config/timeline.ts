// ════════════════════════════════════════════════════════════════════════════
//  时间线「蛇形连接线」配置中心
//  —— 所有可调参数都集中在这里。想改外观/手感，只动这个文件即可。
//  数值后面注释了它控制什么，以及调大/调小的效果。
// ════════════════════════════════════════════════════════════════════════════

export const timelineConfig = {
  /** 启用断点：屏幕宽度 ≥ 此值（px）才显示连接线。手机端为上下堆叠布局，不显示。 */
  breakpoint: 768,

  /** 推进锚点：视口高度的比例（0~1）。0.5 = 视口正中。
   *  调小 → 蛇头更靠上（提前推进）；调大 → 更靠下（滞后推进）。 */
  progressAnchor: 0.5,

  /** 静态虚线「轨道」 */
  track: {
    color: "rgba(255,255,255,0.4)", // 颜色（含透明度）
    width: 1.4,                      // 线宽 px
    dash:  "1 7",                    // 虚线：点长 + 间隔。第二个数越大越稀疏
    wobbleRatio: 0.06,              // 左右摆动幅度 = 容器宽度 × 此比例
    wobbleMax:   40,               // 摆动幅度上限 px（防止宽屏摆动过大）
  },

  /** 滚动驱动的发光「蛇身」 */
  snake: {
    color: "var(--accent)",                              // 颜色
    width: 2.4,                                          // 线宽 px
    lengthRatio: 0.16,                                  // 蛇身长度 = 路径总长 × 此比例（越大蛇越长）
    glow:  "drop-shadow(0 0 4px rgba(110,231,183,0.7))", // 发光光晕
  },

  /** 蛇头「箭头」 */
  arrow: {
    size:  22,                                           // 箭头尺寸 px
    color: "var(--accent)",                              // 颜色
    glow:  "drop-shadow(0 0 6px rgba(110,231,183,0.8))", // 发光光晕
    followScrollDirection: true,                        // true=跟随滚动方向翻转；false=始终朝下
  },

  /** 每个场次中心的「圆点」 */
  dot: {
    size:  10,             // 直径 px
    color: "var(--accent)",
    glow:  "0 0 0 4px rgba(110,231,183,0.1), 0 0 12px rgba(110,231,183,0.4)",
  },
} as const;

export type TimelineConfig = typeof timelineConfig;
