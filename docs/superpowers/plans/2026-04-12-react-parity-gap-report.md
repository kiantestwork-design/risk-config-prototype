# React 页面与 legacy app.js 差异清单与修复计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` or `superpowers:subagent-driven-development` to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** 记录当前 React 版“接入点 / 特征 / 策略 / 规则”四个核心界面相对于 legacy `app.js` 的结构、样式、交互差异，并给出可执行的 parity 修复方案。

**Source of truth:** 以当前 React 代码和项目根目录 `app.js` 中 legacy 列表/编辑器实现为准。

**Out of scope:** 本文档不直接改代码；不包含用户管理、角色管理、发布管理、属性字典页面；不讨论新的产品设计，只以恢复 legacy 行为为目标。

---

## 1. 结论

当前 React 版的问题不是单点缺字段，而是整套“平台工作台”体验被压缩成了简化后台表格：

- 列表页大量缺失 legacy 的批量操作能力
- 筛选器维度明显变少
- 表格信息密度下降，多个字段被合并或直接省略
- 行级操作被简化，只剩“查看 / 编辑 / 加入待发布”
- 列表样式不再保持 legacy 的选中态、hover 色和操作条视觉语言
- 特征、规则、策略的编辑器和详情区丢了表达式与配置区块

换句话说，当前 React 版不是“样式微调不一致”，而是 `列表组件、过滤组件、批量操作组件、详情摘要组件、表达式配置组件` 整体缺了一批。

---

## 2. 对照范围

### 当前 React 页面

- [src/pages/EntryPointList.jsx](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/pages/EntryPointList.jsx:1)
- [src/pages/FeatureList.jsx](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/pages/FeatureList.jsx:1)
- [src/pages/ActivationList.jsx](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/pages/ActivationList.jsx:1)
- [src/pages/RuleList.jsx](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/pages/RuleList.jsx:1)

### legacy app.js 组件

- `xz`：接入点列表页
- `hz`：特征列表页
- `bz`：策略列表页
- `Nz`：规则列表页

### 已确认的 legacy 辅助能力

- 行选择 `Set` 状态
- 顶部批量操作条
- 批量确认弹层
- 多维过滤器
- 行级删除
- 更丰富的表格列
- 蓝色 hover / 选中高亮样式
- 特征、规则、策略的表达式与配置编辑器

---

## 3. 丢失的组件与能力总表

## 3.1 列表层丢失

1. `RowSelectionCheckbox`
   - legacy 四个核心列表都维护了选中集合 `Set`
   - 当前四个 React 页面都没有复选框列，也没有“全选”

2. `BulkActionToolbar`
   - legacy 在有选中项时会出现顶部操作条
   - 当前四页都没有批量操作入口

3. `BulkActionConfirmModal / ResultModal`
   - legacy 批量待发布、启用、禁用、删除都有确认和结果反馈
   - 当前完全缺失

4. `AdvancedFilters`
   - legacy 列表不是单一输入框，而是多维筛选
   - 当前多数页面只剩 `搜索 + 运行状态`

5. `RowDeleteAction`
   - legacy 列表行中有删除
   - 当前四页都被删掉

6. `SelectedRowVisualState`
   - legacy 有蓝色 hover、选中背景、选中计数
   - 当前只有普通灰色 hover

## 3.2 实体摘要层丢失

1. `EntryPoint` 的编码列/描述列拆分
2. `Rule` 的引用数列
3. `Activation` 的阈值摘要渲染
4. `Activation` 的关联规则信息摘要
5. `Feature` 的类型、来源、接入点等更完整摘要

## 3.3 编辑器/详情层丢失

1. `FeatureExpressionEditor`
2. `FeatureCalculationConfigEditor`
3. `FeatureCompositeKeyEditor`
4. `RuleConditionExpressionEditor`
5. `ActivationSceneAndThresholdEditor` 的完整版
6. `Activation` 更完整的规则关联与策略配置区

---

## 4. 页面差异明细

## 4.1 接入点页面

**Current file:** [src/pages/EntryPointList.jsx](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/pages/EntryPointList.jsx:1)

### 当前实现

- 筛选只有 `code` 和 `lifecycle` [27](</Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/pages/EntryPointList.jsx:27>)
- 表头只有 5 列 [193](</Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/pages/EntryPointList.jsx:193>)
- 行操作只有 `查看 / 编辑 / 加入待发布` [220](</Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/pages/EntryPointList.jsx:220>)
- 行样式是普通 `hover:bg-[#fafafa]` [204](</Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/pages/EntryPointList.jsx:204>)

### legacy 丢失项

1. 缺少 `描述筛选`
2. 缺少独立 `status` 筛选
3. 缺少复选框列和全选能力
4. 缺少批量 `待发布 / 启用 / 禁用 / 删除`
5. 缺少行级删除按钮
6. 缺少“接入点编码”和“描述”拆开的表格结构
7. 缺少 selected-row 高亮与顶部“已选 N 项”操作条
8. 样式不是 legacy 的蓝色 hover 体系

### 差异影响

- 运营类批量处理能力直接丢失
- 数据浏览密度下降，列表更难扫读
- 页面视觉语言和 old app.js 平台明显不同

### 修复建议

- 恢复 legacy 的筛选 state 结构：`{ code, desc, lifecycle, status }`
- 在表格最左侧补回勾选框列和全选逻辑
- 恢复批量操作条及四类批量动作
- 将“接入点信息”拆回“接入点编码 + 描述”两列
- 恢复删除按钮和删除确认
- 样式对齐到 legacy：hover 改为蓝色高亮，选中行有浅蓝背景

---

## 4.2 特征页面

**Current file:** [src/pages/FeatureList.jsx](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/pages/FeatureList.jsx:1)

### 当前实现

- 筛选只有 `name` 和 `lifecycle` [25](</Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/pages/FeatureList.jsx:25>)
- 新建特征只支持 3 种类型：`HistoryStorage / DirectStorage / Aggregation` [94](</Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/pages/FeatureList.jsx:94>)
- 列表只显示“特征信息 / 类型 / 接入点 / 运行状态 / 更新时间/操作人 / 操作” [158](</Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/pages/FeatureList.jsx:158>)
- 查看态只保留基础信息 [115](</Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/pages/FeatureList.jsx:115>)
- 新建时直接写入空表达式和空配置 [50](</Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/pages/FeatureList.jsx:50>)

### legacy 丢失项

1. 缺少 `desc` 筛选
2. 缺少 `type` 筛选
3. 缺少独立 `status` 筛选
4. 缺少 `eventPoints` 多选筛选
5. 缺少复选框列和批量操作条
6. 缺少批量 `待发布 / 启用 / 禁用 / 删除`
7. 缺少行级删除
8. 缺少 legacy 支持的 `StatefulStorage / ExternalDataSource` 类型
9. 缺少表达式相关区块：
   - `conditionExpression`
   - `compositeKeyJsonPaths`
   - `calculationConfig`
   - `includeCurrentEvent`
10. 缺少更丰富的来源/值类型/依赖特征摘要

### 差异影响

- 特征页从“配置型页面”退化成“基础元信息页”
- 新建或编辑后的数据模型无法保持与 legacy 一致
- 列表和详情都不足以支撑复杂特征配置

### 修复建议

- 恢复 legacy 筛选结构：`{ name, desc, type, lifecycle, status, eventPoints }`
- 恢复复选框、批量条、删除链路
- 将 `Feature` 表单拆回 legacy 的类型化表单
- 恢复不同类型对应的配置区块
- 把 mock 中已存在但 UI 未渲染的字段全部接回界面：
  - [src/config/mock/features.js](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/config/mock/features.js:1)
- 新建特征不应默认“写死为空表达式”，应走 legacy 默认模板

---

## 4.3 策略页面

**Current file:** [src/pages/ActivationList.jsx](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/pages/ActivationList.jsx:1)

### 当前实现

- 筛选只有 `name / eventPoint / lifecycle` [19](</Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/pages/ActivationList.jsx:19>)
- 列表显示“策略信息 / 接入点 / 场景 / 优先级 / 运行状态 / 更新时间/操作人 / 操作” [178](</Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/pages/ActivationList.jsx:178>)
- 编辑器只覆盖基础信息、接入点、优先级、启用状态 [61](</Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/pages/ActivationList.jsx:61>)
- 查看态只显示 `thresholds` 和 `scenes` 的简略摘要 [118](</Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/pages/ActivationList.jsx:118>)

### legacy 丢失项

1. 缺少 `scene` 多选筛选
2. 缺少独立 `status` 筛选
3. `eventPoint` 从 legacy 多选退化成了单选
4. 缺少复选框列和批量操作条
5. 缺少批量 `待发布 / 启用 / 禁用 / 删除`
6. 缺少行级删除
7. 缺少更完整的阈值段渲染
8. 缺少关联规则/命中规则的摘要能力
9. 当前页面整体更像“轻量阈值页”，不是 legacy 的完整策略配置页

### 差异影响

- 策略列表检索能力下降
- 批量治理能力丢失
- 策略配置和规则关系被弱化，难以还原 old app.js 的使用体验

### 修复建议

- 恢复 legacy 筛选结构：`{ name, eventPoint: [], scene: [], lifecycle: [], status: [] }`
- 恢复复选框、批量条、删除链路
- 补回 legacy 的阈值可视化摘要
- 在列表或详情中恢复关联规则数量/名称摘要
- 校对 `src/config/mock/activations.js`，确认是否已有字段丢失；若数据模型已被简化，需要先从 `app.js` 重新提取

---

## 4.4 规则页面

**Current file:** [src/pages/RuleList.jsx](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/pages/RuleList.jsx:1)

### 当前实现

- 筛选只有 `name` 和 `lifecycle` [25](</Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/pages/RuleList.jsx:25>)
- 列表列为“规则信息 / 动作 / 运行状态 / 更新时间/操作人 / 操作” [166](</Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/pages/RuleList.jsx:166>)
- 查看态显示基础评分和动作配置 [103](</Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/pages/RuleList.jsx:103>)
- 新建时直接生成空 `conditionExpression` [50](</Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/pages/RuleList.jsx:50>)

### legacy 丢失项

1. 缺少独立 `status` 筛选
2. 缺少复选框列和批量操作条
3. 缺少批量 `待发布 / 启用 / 禁用 / 删除`
4. 缺少行级删除
5. 缺少 `引用数` 列
6. 缺少更完整的评分/运算摘要
7. 缺少 `conditionExpression` 可视化查看与编辑
8. 新建规则不再使用 legacy 默认模板，而是空白表达式

### 差异影响

- 规则列表的治理能力和可读性明显下降
- 规则不再是“条件 + 评分 + 动作”的完整配置实体
- 无法做到和 legacy 版本的规则体系一致

### 修复建议

- 恢复 legacy 筛选结构：`{ name, lifecycle: [], status: [] }`
- 恢复勾选列、批量条、删除链路
- 补回 `引用数` 列
- 恢复表达式查看/编辑器，接回 [src/config/mock/rules.js](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/config/mock/rules.js:1) 中现有的 `conditionExpression`
- 新建规则改为使用 legacy 默认对象模板

---

## 5. 样式差异

除了信息结构，当前样式也和 legacy 有明显偏差：

1. 列表 hover 色不对
   - 当前普遍使用 `hover:bg-[#fafafa]`
   - legacy 主要列表使用蓝色调 hover，如 `hover:bg-[#f0f7ff]`

2. 缺少选中行视觉反馈
   - legacy 有浅蓝选中背景
   - 当前没有 row selected 态

3. 缺少顶部批量操作条样式
   - legacy 选中行后会出现带状态色的操作条
   - 当前没有该层级视觉

4. 表格密度下降
   - legacy 更像运维平台表格
   - 当前更像通用管理后台卡片表格

5. 按钮体系不一致
   - legacy 中行级危险动作、批量动作、主次按钮都有清晰层级
   - 当前基本只剩蓝字文本按钮

---

## 6. 根因分析

### 根因 1：迁移时优先做了“可运行”，没有优先做“结构 parity”

当前 React 页面大多是“按实体重新手写一个简化版本”，不是从 legacy 组件结构逐块还原。

### 根因 2：列表页共性组件没有先抽象

legacy 四个核心列表共享大量模式：

- 选中集合
- 批量操作条
- 批量确认逻辑
- 多维过滤器
- 表格 hover/选中样式

这些共性没有先恢复，导致每页都被简化了一遍。

### 根因 3：Mock 数据只迁移了部分字段

特征、规则保留了部分高级字段，但 UI 没接上。策略页更严重，数据模型本身也已经被简化。

### 根因 4：编辑器组件过早统一成 `EntityEditorShell`

`EntityEditorShell` 适合做外壳，但不应该把各实体的复杂表单压成“基础信息 + 少量摘要”。现在的差异不是 shell 组件问题，而是实体内部的 `renderForm / extraSections` 还原不完整。

---

## 7. 修复原则

1. 以 parity 为唯一目标，不做新设计
2. 先恢复列表交互骨架，再补实体详情与表达式
3. 先恢复数据模型，再恢复 UI
4. 每个页面都以 `legacy-host.html + app.js` 为验收基准

---

## 8. 执行计划

### Task 1: 恢复四个页面的列表共性骨架

**Files:**
- Modify: `src/pages/EntryPointList.jsx`
- Modify: `src/pages/FeatureList.jsx`
- Modify: `src/pages/ActivationList.jsx`
- Modify: `src/pages/RuleList.jsx`
- Optional create: `src/components/list/BulkActionToolbar.jsx`
- Optional create: `src/components/list/RowCheckbox.jsx`

- [ ] 为四个页面补回 `selectedIds` / `select all` 逻辑
- [ ] 恢复顶部“已选 N 项”批量操作条
- [ ] 恢复批量 `待发布 / 启用 / 禁用 / 删除`
- [ ] 恢复蓝色 hover 和选中行背景

### Task 2: 恢复各页筛选器

**Files:**
- Modify: 四个列表页

- [ ] 接入点：补 `desc`、`status`
- [ ] 特征：补 `desc`、`type`、`status`、`eventPoints`
- [ ] 策略：补 `scene`、`status`，并将 `eventPoint` 恢复为多选
- [ ] 规则：补 `status`

### Task 3: 恢复各页表格列和行操作

**Files:**
- Modify: 四个列表页

- [ ] 接入点：拆回“编码”和“描述”列，补行删除
- [ ] 特征：补行删除，恢复更完整摘要
- [ ] 策略：补阈值摘要、关联规则摘要、行删除
- [ ] 规则：补 `引用数` 列、行删除

### Task 4: 恢复特征编辑器完整配置

**Files:**
- Modify: `src/pages/FeatureList.jsx`
- Optional create: `src/components/feature/*`

- [ ] 恢复 `conditionExpression`
- [ ] 恢复 `compositeKeyJsonPaths`
- [ ] 恢复 `calculationConfig`
- [ ] 恢复 `includeCurrentEvent`
- [ ] 恢复更多特征类型

### Task 5: 恢复规则编辑器完整配置

**Files:**
- Modify: `src/pages/RuleList.jsx`
- Optional create: `src/components/rule/*`

- [ ] 恢复 `conditionExpression` 查看和编辑
- [ ] 恢复 legacy 规则默认模板
- [ ] 恢复更完整的评分/动作摘要

### Task 6: 恢复策略页完整配置能力

**Files:**
- Modify: `src/pages/ActivationList.jsx`
- Optional create: `src/components/activation/*`

- [ ] 先重新核对 `app.js` 中策略数据模型
- [ ] 补回 scene/threshold 之外的 legacy 配置区块
- [ ] 恢复与规则的关联展示

### Task 7: parity 验收

**Files:**
- No code files required

- [ ] 对照 `legacy-host.html`
- [ ] 四页列表逐页检查：筛选、勾选、批量条、删除、查看、编辑、加入待发布
- [ ] 四页详情逐页检查：字段、表达式、摘要区、版本区
- [ ] 对比视觉：hover、选中、按钮层级、表头密度

---

## 9. 实施顺序建议

建议按这个顺序修，不要乱序：

1. 先修列表共性骨架
2. 再修四页筛选器
3. 再修四页表格列和行操作
4. 再补特征/规则表达式
5. 最后补策略页缺失配置

原因：

- 先把列表框架还原，页面整体观感会先接近 legacy
- 表达式编辑器体量最大，应该放在列表 parity 之后
- 策略页当前最可能存在数据模型缺失，应该最后单独攻坚

---

## 10. 验收标准

- 四个列表页重新具备 legacy 的勾选、批量条、删除和多维筛选能力
- 视觉上恢复 legacy 的蓝色 hover、选中态和表格密度
- 接入点、特征、策略、规则的列表列信息与 legacy 基本一致
- 特征、规则的表达式和配置区块恢复
- 策略页不再只是“轻量阈值页”，而是接近 legacy 的完整策略配置页

---

## 11. 建议提交拆分

1. `feat: 恢复四个核心列表页的批量操作与筛选骨架`
2. `feat: 恢复接入点/规则列表的 legacy 列与删除能力`
3. `feat: 恢复特征页表达式与配置区块`
4. `feat: 恢复策略页完整配置与摘要展示`
5. `test: 对照 legacy-host 完成四页 parity 验收`
