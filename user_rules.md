# Agent Rules: Scenic Spots Web App (Lab2)
（本文件是给 AI/Agent 的项目规则，用于约束实现范围与输出方式。）

## 0. Mission
Build a scenic spots web app in stages:
（按阶段迭代完成“景点 Web 应用”，不要一次做完。）
- v0.1 Rendering
- （v0.1 只做“渲染展示”基础功能。）
- v0.2 Search
- （v0.2 增加“搜索”功能。）
- v0.3 Filter
- （v0.3 增加“筛选/过滤”功能。）
- v0.4 Extension
- （v0.4 做扩展能力/加分项。）

## 1. Project Structure
/project
  index.html
  style.css
  app.js
  spots.json
  /img
  /.trae/user_rules.md
（项目目录结构如上；优先只在这些文件里工作，保持结构稳定。）

## 2. Stage Rules
- Do NOT skip stages
- （不要跳过阶段；按 v0.1→v0.2→v0.3→v0.4 逐步完成。）
- Do NOT implement future features early
- （不要提前实现后续阶段功能，避免范围蔓延与验收困难。）
- One small task per step
- （每次只做一个小改动/小任务，便于 review 和定位问题。）

## 3. Context Rules
- Only use provided files
- （只使用/依赖仓库中已提供的文件与资源，不额外引入未知依赖。）
- Do NOT modify unrelated files
- （不要改无关文件，减少副作用与合并冲突。）

## 4. Code Rules
- Minimal changes only
- （尽量最小改动完成目标；避免“大手术”。）
- Keep existing structure
- （保持现有文件组织与代码结构，不随意重构。）
- No full rewrites
- （禁止整文件重写；只做必要的局部修改。）

## 5. Features

### Search
- Real-time input
- （输入框实时响应（边输边搜/立即刷新结果）。）
- Match name and city
- （搜索匹配字段至少包含“景点名”和“城市”。）

### Filter
- Multi-select tags
- （支持多选标签筛选（可同时选多个 tag）。）
- Combine with search
- （筛选条件要能与搜索联动（取交集逻辑通常更符合预期）。）

### Reset
- Clear all filters
- （提供重置能力，一键清空所有筛选条件（必要时也清空搜索）。）

## 6. Constraints
- No frameworks (React/Vue)
- （不使用前端框架（如 React/Vue），保持原生 HTML/CSS/JS。）
- No full file rewrite
- （再次强调不要整文件重写。）

## 7. Output Format
Use patch or clear change description
（输出时用补丁/清晰的变更说明，方便对照与应用修改。）

## Final Rule
You are a careful engineer, not a generator.
（以工程质量为先——谨慎、可验证、低风险变更，而不是“生成一堆新东西”。）
