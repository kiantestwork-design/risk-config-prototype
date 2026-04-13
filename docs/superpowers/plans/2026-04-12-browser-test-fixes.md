# 浏览器验收问题修复计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` or `superpowers:subagent-driven-development` to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** 修复本轮浏览器实测中确认存在的功能缺陷，补齐“接入点 / 策略 / 规则 / 发布 / 手动干预”链路。

**Source of truth:** 以本次浏览器实测结果为准，只处理已稳定复现的问题，不混入未确认项。

**Out of scope:** 不做视觉微调；不做新的交互设计；不扩展 Mock 数据模型以外的功能。

---

## 已确认问题

### P1. 策略页无法加入待发布

- 页面：[src/pages/ActivationList.jsx](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/pages/ActivationList.jsx:213)
- 现象：策略列表只有“查看/编辑”，没有“加入待发布”。
- 影响：`ACTIVATION` 类型无法进入待发布清单，发布链路中断。
- 相关接线：[src/App.jsx](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/App.jsx:388) 已传入 `onAddToDrafts`，但页面未使用。

### P2. 规则页无法加入待发布

- 页面：[src/pages/RuleList.jsx](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/pages/RuleList.jsx:197)
- 现象：规则列表只有“查看/编辑”，没有“加入待发布”。
- 影响：`RULE` 类型无法进入待发布清单，发布链路中断。
- 相关接线：[src/App.jsx](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/App.jsx:389) 已传入 `onAddToDrafts`，但页面未使用。

### P3. 接入点页无法加入待发布

- 页面：[src/pages/EntryPointList.jsx](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/pages/EntryPointList.jsx:219)
- 现象：接入点列表只有“查看/编辑”，没有“加入待发布”。
- 影响：`ENTRY_POINT` 类型无法进入待发布清单，发布链路中断。
- 额外问题：[src/App.jsx](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/App.jsx:386) 当前没有给 `EntryPointList` 传 `onAddToDrafts`。

### P4. 手动干预新增是演示假动作

- 页面：[src/pages/Overrides.jsx](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/pages/Overrides.jsx:32)
- 现象：点击“确认干预”只弹出“演示模式，数据未持久化”，列表不新增卡片。
- 影响：War Room 页面新增链路不可用。
- 根因：页面没有把新增数据写回父级状态，也没有调用任何回调。

---

## 已验证正常的链路

- 特征页“加入待发布”可用：[src/pages/FeatureList.jsx](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/pages/FeatureList.jsx:198)
- `待发布清单 -> 生成发布单 -> 发布单列表 -> 审批通过 -> 执行发布` 浏览器实测可走通
- 熔断策略新增可新增到列表
- 接入点编辑保存、特征编辑保存可触发成功反馈

这些链路不应在本次修复中被破坏。

---

## 执行计划

### Task 1: 补齐接入点待发布链路

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/pages/EntryPointList.jsx`

- [ ] 在 `App.jsx` 的 `/event-points` 路由上补传 `onAddToDrafts`
- [ ] 在 `EntryPointList` props 中接收 `onAddToDrafts`
- [ ] 在接入点列表操作列新增“加入待发布”按钮
- [ ] 构造 `ENTRY_POINT` 草稿对象：
  - `type: 'ENTRY_POINT'`
  - `targetId: String(ep.id)`
  - `targetName: ep.eventPoint`
  - `version: 'v1'`
  - `relatedKeys: ep.eventPoint`
  - `changeSummary: ep.description || ''`
  - `updatedAt: ep.updateAt || ''`
  - `editor: ep.operator || ''`
- [ ] 保持“查看/编辑”现有行为不变

### Task 2: 补齐策略待发布链路

**Files:**
- Modify: `src/pages/ActivationList.jsx`

- [ ] 在 `ActivationList` 列表操作列新增“加入待发布”按钮
- [ ] 使用现有传入的 `onAddToDrafts`
- [ ] 构造 `ACTIVATION` 草稿对象：
  - `type: 'ACTIVATION'`
  - `targetId: String(act.id)`
  - `targetName: act.name`
  - `version: 'v1'`
  - `relatedKeys: act.eventPoint || ''`
  - `changeSummary: act.description || ''`
  - `updatedAt: act.updateAt || ''`
  - `editor: act.operator || ''`
- [ ] 确认不会破坏现有“查看/编辑”按钮布局

### Task 3: 补齐规则待发布链路

**Files:**
- Modify: `src/pages/RuleList.jsx`

- [ ] 在 `RuleList` 列表操作列新增“加入待发布”按钮
- [ ] 使用现有传入的 `onAddToDrafts`
- [ ] 构造 `RULE` 草稿对象：
  - `type: 'RULE'`
  - `targetId: String(r.id)`
  - `targetName: r.name`
  - `version: 'v1'`
  - `relatedKeys: (r.actions || []).map(a => a.actionType).join(',')`
  - `changeSummary: r.description || ''`
  - `updatedAt: r.updateAt || ''`
  - `editor: r.editOperator || ''`

### Task 4: 让手动干预新增真正落到列表

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/pages/Overrides.jsx`

- [ ] 在 `App.jsx` 增加 `onAddOverride` 顶层回调，负责写入 `overrides` state
- [ ] 在 `/overrides` 路由上传入 `onAddOverride`
- [ ] 在 `Overrides` props 中接收 `onAddOverride`
- [ ] 将 `handleAddOverride` 从“仅 alert”改为真正创建对象并回调父层
- [ ] 新增对象至少包含：
  - `id`
  - `scope`
  - `manualState`
  - `ttlSeconds`
  - `remark`
  - `operator`
- [ ] 新增成功后关闭表单，并保证新卡片立即出现在页面
- [ ] 如果需要保留提示，提示内容改为真实成功提示，不再写“演示模式”

### Task 5: 全流程回归验证

**Files:**
- No code files required

- [ ] `接入点管理`：
  - 任选一条接入点点击“加入待发布”
  - 跳转 `待发布清单` 确认出现 `ENTRY_POINT`
- [ ] `策略管理`：
  - 任选一条策略点击“加入待发布”
  - 跳转 `待发布清单` 确认出现 `ACTIVATION`
- [ ] `规则管理`：
  - 任选一条规则点击“加入待发布”
  - 跳转 `待发布清单` 确认出现 `RULE`
- [ ] `手动干预管理`：
  - 新增一条干预
  - 确认卡片立即出现在列表
- [ ] `发布管理`：
  - 选择一条新加入的草稿生成发布单
  - 在发布单列表完成“审批通过 -> 执行发布”
- [ ] `构建验证`：
  - 运行 `npm run build`
  - 确认构建成功

---

## 验收标准

- 接入点、策略、规则三类页面都能把条目加入待发布清单
- 待发布清单能正确显示 `ENTRY_POINT / ACTIVATION / RULE` 类型标签
- 手动干预新增后，列表立即出现新卡片
- `待发布清单 -> 发布单列表 -> 审批 -> 发布` 主链路保持可用
- `npm run build` 通过

---

## 建议提交拆分

1. `fix: 接入点/策略/规则接入待发布链路`
2. `fix: 手动干预新增落地到列表`
3. `test: 浏览器回归验证并更新计划状态`
