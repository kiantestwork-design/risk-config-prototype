# React Post-Reboot Parity 修复实施计划

> 关联缺陷报告：
> [2026-04-12-react-post-reboot-bug-report.md](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/docs/superpowers/plans/2026-04-12-react-post-reboot-bug-report.md:1)

**Goal:** 修复 Chrome 直接对照 `legacy-host.html` 后仍稳定复现的 8 个 parity 问题，恢复 React 版在“版本历史数据 + 规则/策略关联关系”上的标准 commit 一致性。

**Source of truth:**
- 直接浏览器对照结果：
  [2026-04-12-react-post-reboot-bug-report.md](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/docs/superpowers/plans/2026-04-12-react-post-reboot-bug-report.md:1)
- 标准页面：
  `legacy-host.html?page=feature-list|rules|activations`
- 标准 bundle：
  `app.js`，基准 commit `1c6fa79`
- 规则/策略关联关系的辅助参考：
  [2026-04-07-rule-activation-many-to-many.md](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/docs/superpowers/plans/2026-04-07-rule-activation-many-to-many.md:48)

**Out of scope:**
- 不做新的交互设计
- 不做非缺陷驱动的视觉微调
- 不扩展新的业务模型，只恢复到标准页已有数据和关系

---

## 实施前提

当前页面的数据接线分成两层：

- 当前实体详情来自 `App.jsx` 顶层 state：
  [src/App.jsx](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/App.jsx:92)
- 右侧历史版本直接读取 `src/config/mock/versions.js`
  - 特征：[src/pages/FeatureList.jsx](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/pages/FeatureList.jsx:108)
  - 规则：[src/pages/RuleList.jsx](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/pages/RuleList.jsx:100)
  - 策略：[src/pages/ActivationList.jsx](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/pages/ActivationList.jsx:99)
- 规则页的引用提示和引用数，直接由 `activations.ruleIds` 派生：
  [src/pages/RuleList.jsx](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/pages/RuleList.jsx:101)
- 策略页的“关联规则”也是由 `ruleIds` 派生：
  [src/pages/ActivationList.jsx](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/pages/ActivationList.jsx:242)

结论：

- 只改 `versions.js` 不够
- 只改 `features.js / rules.js / activations.js` 也不够
- 必须同步修正“当前实体数据 + 历史版本数据 + 规则/策略关联关系”

---

## 已确认问题范围

### 特征

- `user_transaction_history`
  - React 少了 legacy 的 `v3`
- `user_login_count_1h`
  - React 多了 legacy 不存在的 `v2`
  - 当前名称/描述与 legacy 不一致

### 规则

- `rule_freq_check`
  - React 少了 legacy 的 `v3`
- `rule_new_device_login`
  - React 多了 legacy 不存在的 `v2`
- `rule_high_amount`
  - `v2` 的状态 / 时间 / editor / commitMessage 不对
  - 引用策略数量也不对
- `rule_amount_threshold`
  - `v2` 和 `v1` 的时间 / editor 不对

### 策略

- `activation_txn_risk_45min`
  - React 缺少 `v5 / v4 / v3`
  - 当前 `ruleIds` 错了
- `activation_txn_amount_check`
  - React 缺少 `v3`
  - 当前 `ruleIds` 错了

---

## 执行计划

### Task 1: 先做数据源审计，按 legacy 逐条建立对照表

**Files:**
- Read: `app.js`
- Read: `legacy-host.html`
- Read: [2026-04-12-react-post-reboot-bug-report.md](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/docs/superpowers/plans/2026-04-12-react-post-reboot-bug-report.md:1)

- [ ] 为 8 个问题实体建立“React 当前值 vs legacy 标准值”对照表
- [ ] 对每个实体至少核对下面字段：
  - 当前详情：名称、描述、生命周期状态、更新时间、操作人
  - 历史列表：版本号、状态标签、时间、commitMessage、editor
  - 如适用：`ruleIds`、阈值、场景、条件表达式
- [ ] 明确哪些值以 `legacy-host.html` 可见文本为准，哪些需要回到 `app.js` 提取原始结构
- [ ] 输出一份内部核对清单，作为后续数据修改的唯一输入

**目的：**

- 禁止继续凭当前 React mock 猜版本内容
- 后续所有修改必须是“从标准页回填”，不是“按现有 mock 修修补补”

### Task 2: 修复特征当前数据和历史版本

**Files:**
- Modify: [src/config/mock/features.js](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/config/mock/features.js:1)
- Modify: [src/config/mock/versions.js](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/config/mock/versions.js:1)
- Modify if needed: [src/config/mock/releases.js](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/config/mock/releases.js:1)

- [ ] `user_transaction_history`
  - 补回 legacy 的 `v3`
  - 对齐 `v3 / v2 / v1` 的状态、时间、说明、editor
  - 校对当前实体的名称、描述、生命周期状态是否与 legacy 完全一致
- [ ] `user_login_count_1h`
  - 移除 legacy 不存在的 `v2`
  - 将当前名称/描述改回 legacy 版本
  - 对齐唯一有效历史版本 `v1` 的说明和时间
- [ ] 如果特征名称修正会影响发布单或草稿展示：
  - 同步修正 `src/config/mock/releases.js` 中的 `targetName`
- [ ] 保证 `FeatureList` 详情页中：
  - 当前展示版本
  - 右侧历史版本
  - 点击历史后主区信息
  三者来自同一套标准数据

### Task 3: 修复规则历史版本和规则当前元数据

**Files:**
- Modify: [src/config/mock/rules.js](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/config/mock/rules.js:1)
- Modify: [src/config/mock/versions.js](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/config/mock/versions.js:1)

- [ ] `rule_freq_check`
  - 补回 legacy 的 `v3`
  - 对齐 `v3 / v2 / v1` 的时间、状态、说明、editor
- [ ] `rule_new_device_login`
  - 删除 legacy 不存在的 `v2`
  - 将 `v1` 的时间、说明、editor、状态校准到标准页
- [ ] `rule_high_amount`
  - 保留 `v3 / v2 / v1`
  - 将 `v2` 改为 legacy 的 `历史 / 2025-03-15 09:20:00 / 调整阈值为 10000 / 李四`
  - 校对 `v1` 时间为 legacy 值
- [ ] `rule_amount_threshold`
  - 修正 `v2` editor
  - 修正 `v1` 时间和 editor
- [ ] 检查 `src/config/mock/rules.js` 中当前规则数据是否还混入非标准版本字段
- [ ] 确保规则详情页的右栏顺序保持与 legacy 一致，按版本倒序展示

### Task 4: 修复策略当前数据、历史版本链和规则关联

**Files:**
- Modify: [src/config/mock/activations.js](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/config/mock/activations.js:1)
- Modify: [src/config/mock/versions.js](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/config/mock/versions.js:1)

- [ ] `activation_txn_risk_45min`
  - 当前 `ruleIds` 改回 legacy 对应集合
  - 补回 `v5 / v4 / v3`
  - 对齐每个版本的阈值、规则集合、状态标签、时间、说明、editor
- [ ] `activation_txn_amount_check`
  - 当前 `ruleIds` 改回 legacy 对应集合
  - 补回 `v3`
  - 对齐 `v3 / v2 / v1` 的规则集合、时间、说明、editor
- [ ] 确保策略详情页“关联规则”区域完全由标准 `ruleIds` 驱动
- [ ] 确保点击历史版本后：
  - 阈值配置
  - 场景
  - 关联规则
  都能与标准页对应版本保持一致

### Task 5: 修复规则页引用提示和列表引用数的派生结果

**Files:**
- Verify/adjust: [src/pages/RuleList.jsx](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/pages/RuleList.jsx:100)
- Verify/adjust: [src/pages/ActivationList.jsx](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/pages/ActivationList.jsx:242)

- [ ] 在 `activation_txn_risk_45min` / `activation_txn_amount_check` 的 `ruleIds` 修正后，重新检查：
  - `rule_high_amount` 的引用提示数量
  - `rule_amount_threshold` 的引用提示数量
  - 规则列表页“X 个策略”是否与 legacy 一致
- [ ] 如果数量仍然不一致，继续排查是否存在页面层错误逻辑，而不只是 mock 数据错误
- [ ] 如需改代码，保持派生逻辑只依赖 `activations.ruleIds`，不要再引入硬编码兜底

### Task 6: 做一轮旁路文案和关联数据一致性清扫

**Files:**
- Verify/modify if needed: [src/config/mock/releases.js](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/config/mock/releases.js:1)
- Verify if needed: [src/pages/Dashboard.jsx](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/pages/Dashboard.jsx:34)

- [ ] 检查是否还有旧名称残留在发布单 / 草稿 / Dashboard / 其他 mock 文案中
- [ ] 只修正本轮受影响实体的残留文案
- [ ] 不做无关页面的大面积 rename

### Task 7: 重新做 Chrome 实体级回归

**Files:**
- No code files required

- [ ] 逐条复测 16 个核心实体：
  - 接入点 4 条
  - 特征 3 条
  - 规则 5 条
  - 策略 4 条
- [ ] 对每条实体都做 React vs legacy 对照，至少检查：
  - 版本数
  - 版本顺序
  - 版本标签
  - 时间
  - commitMessage
  - editor
- [ ] 对问题实体追加检查：
  - 规则页引用提示数量
  - 策略页关联规则列表
- [ ] 重新运行 `npm run build`
- [ ] 回写缺陷报告，把已修复项标记为关闭

---

## 验收标准

- `user_transaction_history` 的历史版本从 React 侧能看到 `v3 / v2 / v1`
- `user_login_count_1h` 与 legacy 一样只保留 `v1`，且名称文案一致
- `rule_freq_check` 的历史版本从 React 侧能看到 `v3 / v2 / v1`
- `rule_new_device_login` 与 legacy 一样只保留 `v1`
- `rule_high_amount`、`rule_amount_threshold` 的右栏时间、状态、说明、editor 与 legacy 一致
- `activation_txn_risk_45min` 的历史版本从 React 侧能看到 `v5 / v4 / v3 / v1`
- `activation_txn_amount_check` 的历史版本从 React 侧能看到 `v3 / v2 / v1`
- `activation_txn_risk_45min`、`activation_txn_amount_check` 的关联规则列表与 legacy 一致
- 规则页引用提示和列表引用数与 legacy 一致
- `npm run build` 通过

---

## 建议提交拆分

1. `fix: 对齐特征与规则的版本历史数据`
2. `fix: 恢复策略版本链和规则关联关系`
3. `test: 重新完成 react vs legacy 浏览器回归`
