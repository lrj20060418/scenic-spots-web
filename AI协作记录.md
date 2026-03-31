# AI 协作记录

# 一、v0.1

## 背景
本阶段目标是 v0.1：先把项目跑起来并完成“基础渲染”，不做搜索/筛选等后续功能。

---

## 关键对话 1：创建基础项目结构（只搭骨架）
**我的 Prompt（节选）**
- 当前阶段：v0.1
- 子目标：创建基础项目结构
- 需要创建：index.html / style.css / app.js
- 要求：index.html 包含基础结构（header + list 容器），引入 style.css 和 app.js
- 不要实现任何业务逻辑

**AI 回复（节选）**
- 先检查仓库里是否已存在同名文件，避免覆盖
- 创建 index.html（header + ul#spotsList 容器，正确引入 CSS/JS）
- style.css 做基础排版
- app.js 只留空入口（不写业务逻辑）

**我的理解/为什么这样做**
- 先把“能打开页面”的最低版本做出来，后面再逐步加功能，避免一上来改太多东西。

---

## 关键对话 2：读取 spots.json（先能拿到数据，不渲染）
**我的 Prompt（节选）**
- 子目标：在 app.js 中读取 spots.json
- 要求：使用 fetch；成功后打印数据到 console；不实现渲染；只修改 app.js

**AI 回复（节选）**
- 用 fetch('./spots.json') 读取
- res.ok 检查 + try/catch
- 成功后 console.log 输出数据

**我的理解/偏差修正点**
- 我明确要求“只改 app.js、不渲染”，这样可以把任务拆小，出问题更好定位。
- 预览建议用本地静态服务器（Live Server / python http.server），避免 file:// 的限制导致 fetch 失败。

---

## 关键对话 3：实现 renderSpots（按字段渲染 + 格式规则）
**我的 Prompt（节选）**
- 子目标：实现 renderSpots 函数
- 渲染字段：图片、名称、城市、标签、评分、价格、开放时间
- 规则：price=0 → “免费”；rating 保留 1 位小数
- 不要修改 HTML 结构

**AI 回复（节选）**
- 在 app.js 新增 renderSpots(spots)，把内容渲染进现有 ul#spotsList
- rating 用 toFixed(1)，price=0 显示“免费”
- 保持 HTML 不改，只通过 JS 往容器里塞 li

**我的理解/偏差修正点**
- 我强调“不改 HTML 结构”，避免为了渲染去改页面骨架，符合“最小改动”的要求。
- 先把数据能展示出来，后续再做样式优化。

---

## 关键对话 4：卡片样式优化（grid + 图片自适应）
**我的 Prompt（节选）**
- 子目标：优化卡片样式
- 要求：使用 grid 布局；图片自适应；卡片整齐排列；只修改 style.css

**AI 回复（节选）**
- .spots-list 改为 grid，自动换列
- li 作为卡片
- img 用 width:100% + aspect-ratio + object-fit:cover 保持整齐

**我的理解**
- 把结构（HTML）、逻辑（JS）、样式（CSS）分开逐步做，修改范围更可控。

---

## 小结（我这阶段学到的）
- 和 AI 协作时，把需求写成“阶段 + 子目标 + 只改哪些文件 + 不要做什么”，会更省时间、也更不容易跑偏。
- 每次只做一个小目标，能快速看到效果，也方便用 git 记录。