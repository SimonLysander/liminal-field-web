# Liminal Field — 前端设计系统

Apple-inspired monochrome design system。所有视觉决策的单一来源，代码中不应出现此文档未定义的值。

---

## 1. 配色系统（Color）

双主题（daylight / midnight），语义化命名，通过 `[data-theme]` 切换。

### 表面色（Surfaces）

| Token | Daylight | Midnight | 用途 |
|-------|----------|----------|------|
| `--paper` | #FFFFFF | #161617 | 主背景 |
| `--paper-dark` | #F5F5F7 | #1C1C1E | 卡片、次级背景 |
| `--paper-shadow` | #EFEFEF | #0A0A0A | 深层背景 |
| `--paper-light` | #F5F5F7 | #1C1C1E | 浅色面板 |
| `--paper-white` | #FFFFFF | #1C1C1E | 宝丽来等纯白容器 |
| `--shelf` | rgba(0,0,0,0.04) | rgba(255,255,255,0.06) | hover 背景、输入框底色 |
| `--sidebar-bg` | #F2F2F2 | #1C1C1E | 侧边栏背景 |
| `--bar-bg` | rgba(255,255,255,0.8) | rgba(28,28,30,0.82) | 顶栏毛玻璃 |

### 文字色（Typography）

四级墨色，逐级降低视觉权重：

| Token | Daylight | Midnight | 用途 |
|-------|----------|----------|------|
| `--ink` | #1D1D1F | #F5F5F7 | 标题、强调文字 |
| `--ink-light` | #424245 | #D1D1D6 | 正文 |
| `--ink-faded` | #6E6E73 | #98989D | 次要说明、描述 |
| `--ink-ghost` | #AEAEB2 | #48484A | 占位符、时间戳、禁用态 |

### 强调色（Accent）

Monochrome 设计：daylight 用黑，midnight 用白。

| Token | Daylight | Midnight | 用途 |
|-------|----------|----------|------|
| `--accent` | #1D1D1F | #F5F5F7 | 激活态、选中态 |
| `--accent-soft` | rgba(0,0,0,0.06) | rgba(255,255,255,0.08) | 选中背景 |
| `--accent-border` | rgba(0,0,0,0.15) | rgba(255,255,255,0.18) | 激活边框 |
| `--accent-contrast` | #FFFFFF | #1D1D1F | accent 上的文字 |

### 语义标记色（Marks）

整个系统中唯一的彩色元素，仅用于语义标注：

| Token | Daylight | Midnight | 用途 |
|-------|----------|----------|------|
| `--mark-red` | #FF3B30 | #FF453A | 错误、删除、危险 |
| `--mark-blue` | #007AFF | #0A84FF | 链接、草稿、信息 |
| `--mark-green` | #34C759 | #30D158 | 成功、已发布 |

### 结构线（Structure）

| Token | 用途 |
|-------|------|
| `--spine` | 细分隔线 |
| `--spine-strong` | 粗分隔线 |
| `--separator` | 列表/表格分隔 |
| `--box-border` | 容器边框 |

### 阴影（Shadows）

Apple 风格多层投影，四档深度：

| Token | 用途 |
|-------|------|
| `--shadow-xs` | hover 微浮起 |
| `--shadow-sm` | 卡片默认、sidebar |
| `--shadow-md` | 悬浮面板、hover 加强 |
| `--shadow-lg` | modal、popover、AI 面板 |

---

## 2. 字号系统（Typography）

rem 单位，随 html font-size 响应式缩放。base = 16px。

```
档位          变量            px     用途
──────────── ──────────── ────── ──────────────────────────────────
4xs          --text-4xs     8px   gallery 方向箭头
3xs          --text-3xs    10px   面包屑分隔符、微型图标文字
2xs          --text-2xs    11px   微标签、时间戳、section 大写标题
xs           --text-xs     12px   元数据、状态标签、sidebar 小字
sm           --text-sm     13px   按钮、section header、日期、代码块
base         --text-base   14px   导航项、表单输入、面包屑、sidebar 链接
md           --text-md     15px   描述文字、agent/gallery 正文
lg           --text-lg     16px   编辑器正文、modal 标题、阅读正文
xl           --text-xl     18px   h3（semibold，与正文拉开 2px + 字重）
2xl          --text-2xl    20px   h2（semibold）、面板标题
3xl          --text-3xl    22px   h1（bold）、gallery 帖子标题
4xl          --text-4xl    24px   页面标题（ContentVersionView、NotePage）
5xl          --text-5xl    28px   HomePage 大标题、编辑器 title 输入
```

### 响应式基线

```css
html          { font-size: 16px; }
@media ≤1024px { font-size: 15px; }
@media ≤768px  { font-size: 14px; }
```

### 字体族

| Token | 字体栈 | 用途 |
|-------|--------|------|
| `--font-sans` | SF Pro Text, system-ui | 通用 UI 文字 |
| `--font-serif` | New York, Iowan Old Style, Georgia | 文章标题 |
| `--font-mono` | SF Mono, Menlo, Consolas | 代码、hash |
| `--font-title` | SF Pro Display, system-ui | 大标题 |

### 标题层级约束

```
                  字号         字重        letter-spacing
page title       --text-4xl    bold        -0.025em
h1               --text-3xl    bold        -0.02em
h2               --text-2xl    semibold    -0.015em
h3               --text-xl     semibold    (default)
body             --text-lg     normal      (default)
```

规则：**所有组件的 fontSize 必须使用 `var(--text-*)` 变量，禁止硬编码 px/rem 值。**

---

## 3. 间距系统（Spacing）

### 原则

- **8pt 网格**：所有间距为 4px 的倍数
- 使用 Tailwind 原生 spacing scale（p-1 = 4px, p-2 = 8px...），不定义 CSS 变量
- **禁止非 4px 倍数值**：不再使用 py-[7px]、py-[3px]、mb-2.5(10px) 等

### 间距档位

```
值      Tailwind    语义用途
────── ────────── ──────────────────────────────────────
 2px    0.5        微调：border 视觉补偿
 4px    1          图标与文字间距、紧贴元素
 8px    2          列表项 padding、紧凑 gap
12px    3          卡片内边距、输入框 padding
16px    4          段落 mb、h3 上方、表单间距
20px    5          h2 上方
24px    6          h1 上方、section 间距
32px    8          页面分区、大段隔断
40px   10          页面顶/底留白
48px   12          hero 区域
64px   16          超大板块间距
```

### 标题间距（上疏下密 3:1）

标题和它下方的内容是一个整体，上方需要断裂感：

```
元素      上方        下方        Tailwind
──────── ────────── ────────── ──────────────
h1        24px        8px       mt-6 mb-2
h2        20px        8px       mt-5 mb-2
h3        16px        4px       mt-4 mb-1
p          —          16px       mb-4
代码块     16px       16px       my-4
引用块     16px       16px       my-4
分隔线     32px       32px       my-8
```

### 组件内边距参考

```
组件类型          padding       Tailwind
──────────────── ────────── ──────────
列表项            6px 10px    py-1.5 px-2.5
树节点            6px 10px    py-1.5 px-2.5
卡片              16px        p-4
modal            20~24px      p-5 / p-6
输入框            8px 12px    py-2 px-3
按钮（小）        6px 14px    py-1.5 px-3.5
按钮（标准）      8px 16px    py-2 px-4
页面内容区        40px 横向    px-10
```

---

## 4. 动画系统（Motion）

### 曲线

| 名称 | 值 | 用途 |
|------|-----|------|
| `appleEase` | `[0.25, 0.1, 0.25, 1]` | 通用减速：列表渐显、卡片入场、hover |
| `smoothBounce` | `[0.16, 1, 0.3, 1]` | 弹性过冲：页面切换、slide、modal 弹出 |

### 时长

三档，不使用其他值：

| 档位 | CSS 变量 | 值 | Tailwind | 用途 |
|------|---------|-----|----------|------|
| fast | `--dur-fast` | 100ms | `duration-100` | hover 反馈、opacity 切换、工具栏 |
| normal | `--dur-normal` | 200ms | `duration-200` | 面板展开、modal、tab 切换 |
| slow | `--dur-slow` | 400ms | `duration-400` | 页面过渡、hero 动画、入场序列 |

### 组合规则

```
场景                  时长          曲线            示例
──────────────────── ──────────── ──────────── ──────────────────
hover/micro           fast(100ms)  appleEase    按钮变色、opacity
交互反馈              normal(200ms) smoothBounce modal 弹出、面板展开
页面过渡/入场         slow(400ms)  appleEase    页面切换、hero 动画
Spring（弹簧）        —            stiffness:400, damping:30  layoutId、TOC 高亮
```

### Stagger 入场

列表/卡片入场序列使用级联延迟：

```
delay: index × 50ms
duration: slow(400ms)
ease: appleEase
```

### 禁止值

不再使用 `duration-150`、`duration-250`、`duration-300`。

---

## 5. 布局系统（Layout）

### 宽度常量

```css
--layout-sidebar:     200px    /* 展示端侧边栏 / TreePanel / TOC / InfoPanel */
--layout-icon-rail:    48px    /* 管理端图标导航 */
--layout-timeline:     72px    /* Gallery 时间轴 */
--layout-content-max: 740px    /* 阅读/编辑区最大宽度 */
--layout-chat-max:    600px    /* 对话内容区最大宽度 */
```

### 页面结构

```
展示端
┌──────────┬───────────────────────────────────────┐
│ Sidebar  │  Content (flex-1)                     │
│  200px   │                                       │
└──────────┴───────────────────────────────────────┘

管理端
┌────┬──────────┬──────────────────────┬──────────┐
│Icon│ TreePanel│  Main (flex-1)       │InfoPanel │
│Rail│  200px   │                      │  200px   │
│48px│          │                      │          │
└────┴──────────┴──────────────────────┴──────────┘

阅读端
┌──────────┬──────────────────────────────┬────────┐
│ Sidebar  │  Article (max 740px, 居中)   │  TOC   │
│  200px   │                              │ 200px  │
└──────────┴──────────────────────────────┴────────┘

对话端
┌──────────┬──────────────────────────────┬────────┐
│ Sidebar  │  Chat (max 600px, 居中)      │Insights│
│  200px   │                              │ 200px  │
└──────────┴──────────────────────────────┴────────┘
```

### 响应式断点（预留）

```
≥1280px    完整布局：所有面板可见
≥1024px    收起右侧 info panel / TOC
≥768px     sidebar 折叠为 icon-only（48px）
<768px     移动端：全屏内容 + 底部 tab bar
```

当前桌面优先，响应式为后续迭代项。

---

## 6. 圆角系统（Border Radius）

四档分级，通过 Tailwind `rounded-*` 映射：

```
档位    值      Tailwind       用途
────── ────── ──────────── ──────────────────────────────────
sm      6px   rounded-sm    按钮 pill、导航项 hover、标签、搜索框、
                            outline heading、版本时间轴激活项
md      8px   rounded-md    宝丽来、图片区域、内容正文容器、info 卡片
lg     10px   rounded-lg    Sidebar 卡片、TreePanel、编辑器卡片、
                            树节点 hover/selected、代码块
xl     12px   rounded-xl    Modal、ConfirmDialog、CommitDialog、
                            AI chat 面板、doc-create 输入组
```

---

## 7. 图标系统（Iconography）

图标库：**Lucide React**

### 尺寸档位

```
档位      size    strokeWidth    用途
──────── ────── ──────────── ──────────────────────────────
sm        14     1.5           树节点图标、列表项、状态标记
md        16     1.5           导航图标、工具栏按钮（默认）
lg        20     1.5           空状态图标、主操作按钮
xl        24     1.2           hero 区装饰图标
display   32     1.0           首屏大图标（极少用）
```

### 使用约束

- 统一 `strokeWidth: 1.5`（sm/md/lg），大图标递减（xl: 1.2, display: 1.0）
- 禁止 size=13 等零散值
- 推荐定义 TS 常量复用：

```ts
export const ICON = {
  sm:      { size: 14, strokeWidth: 1.5 },
  md:      { size: 16, strokeWidth: 1.5 },
  lg:      { size: 20, strokeWidth: 1.5 },
  xl:      { size: 24, strokeWidth: 1.2 },
  display: { size: 32, strokeWidth: 1.0 },
} as const;
```

---

## 设计原则总结

1. **所有视觉值走系统**：fontSize 用 `--text-*`，颜色用语义 token，间距用 8pt 倍数
2. **禁止硬编码**：代码中不出现 `13px`、`text-[14px]`、`py-[7px]` 等任意值
3. **约束优于自由**：档位有限，选最近的，不造新值
4. **语义优于数值**：变量名表达用途（ink-faded），不表达数值（gray-400）
5. **一处定义，全局生效**：改 `--text-lg` 的值，所有正文同时变
