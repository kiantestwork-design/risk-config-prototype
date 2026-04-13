# 状态管理与交互 Bug 修复设计

日期：2026-04-13

## 概述

修复 6 个已知 bug，核心问题是页面状态与 App 顶层状态不一致、组件接口缺陷、事件处理错误。

---

## Bug 1（高危）：属性提取/场景编排绕过保存事务

### 问题

EntryPointList 编辑页的 Tab 1（属性提取）和 Tab 2（场景编排）的 `onChange` 直接调用 `onSaveExtractions` / `onSaveSceneFeatures`，立刻写入 App 顶层状态。用户点"取消/返回"时改动已生效，无法回滚。EntityEditorShell 的 dirty 检测也不知道这些修改。

### 涉及文件

- `src/pages/EntryPointList.jsx`：第 195、206 行 onChange 直接调用 App 回调
- `src/App.jsx`：第 176-181 行 onSaveExtractions / onSaveSceneFeatures
- `src/components/EntityEditorShell.jsx`：第 115 行 dirty 检测

### 修复设计

1. EntryPointList 编辑模式新增两个本地状态：`pendingExtractions` 和 `pendingSceneFeatures`，进入编辑时从 props 拷贝初始值
2. Tab 内的 onChange 写入本地状态而非直接调用 App 回调：
   - `ExtractionConfig.onChange` → `setPendingExtractions`
   - `SceneOrchestration.onChange` → `setPendingSceneFeatures`
3. EntityEditorShell 的 handleSave 扩展：保存时在 `onSave` 回调中一并提交 pendingExtractions 和 pendingSceneFeatures 到 App 层
4. 取消/返回时：本地状态直接丢弃，App 顶层数据不受影响
5. EntityEditorShell 支持传入 `extraDirtyCheck` 函数，让页面将 pending 状态纳入脏数据检测

---

## Bug 2（高危）：删除/批量操作只改页面局部状态

### 问题

EntryPointList 和 ActivationList 用 `useState(props.xxx)` 维护本地副本，删除/批量操作只改本地副本，切路由后数据回到原样。

### 涉及文件

- `src/pages/EntryPointList.jsx`：第 73、88 行
- `src/pages/ActivationList.jsx`：第 69、84 行
- `src/App.jsx`：第 95 行顶层状态，第 406 行路由 props

### 修复设计

1. 列表页去掉本地 items 副本，直接使用 props 传入的数组
2. App 层新增回调：
   - `onDeleteEntryPoint(id)` / `onBatchUpdateEntryPoints(ids, changes)` — changes 为部分字段对象，如 `{ status: 'ENABLED', lifecycleState: 'DRAFT' }`
   - `onDeleteActivation(id)` / `onBatchUpdateActivations(ids, changes)` — 同上
3. 页面只保留 UI 状态（selected、searchText、filter 等）
4. 删除/批量操作调用 App 回调 → 顶层状态更新 → props 变化 → 页面重渲染
5. 删除后清理 selected 集合中对应的 id（保留在页面层）

---

## Bug 3（高危）：ConfirmPopover 不渲染 children

### 问题

ConfirmPopover 组件只接受 `visible` prop，不渲染 `children`。ExtractionConfig（第 145 行）和 SceneCard（第 107 行）把它当包裹组件用，导致删除按钮根本不可见。

### 涉及文件

- `src/components/ConfirmPopover.jsx`：完整重写
- `src/components/ExtractionConfig.jsx`：第 145 行（调用方不需改动）
- `src/components/SceneCard.jsx`：第 107 行（调用方不需改动）
- `src/pages/PropertyDictionary.jsx`：受控模式兼容

### 修复设计

1. 改造 ConfirmPopover 为自管理组件：
   - 渲染 children 作为触发元素
   - 内部维护 visible state
   - 点击 children 时打开弹框
   - 点击"确认"调用 onConfirm 并关闭
   - 点击"取消"关闭
   - 外层用 `position: relative` 容器包裹
2. 兼容受控模式：如果传了 `visible` prop 则由外部控制，否则自管理
3. 添加 click outside 检测，点击弹框外部自动关闭
4. ExtractionConfig 和 SceneCard 的调用代码无需修改（改造后现有用法就是正确的）

---

## Bug 4（中危）：RulePickerModal 复选框双击切换

### 问题

`<tr onClick={toggleRow}>` 和 `<input checkbox onChange={toggleRow}>` 都调用 toggleRow，点 checkbox 时事件冒泡导致触发两次，选中又立刻取消。

### 涉及文件

- `src/components/RulePickerModal.jsx`：第 79、82 行

### 修复设计

checkbox 的 onChange 处理函数中加 `e.stopPropagation()`，阻止事件冒泡到 tr 的 onClick。

---

## Bug 5（中危）：属性字典与提取配置状态漂移

### 问题

App 层 `const [properties] = useState(...)` 无 setter。PropertyDictionary 自己维护本地副本（第 96 行），增删改不同步到 App 顶层，EntryPointList 的提取配置看不到变化。

### 涉及文件

- `src/App.jsx`：第 101 行 properties 状态
- `src/pages/PropertyDictionary.jsx`：第 96 行本地副本

### 修复设计

1. App 层暴露 properties 的完整读写能力：`onSaveProperty(property)` / `onDeleteProperty(id)`
2. PropertyDictionary 去掉本地 items 副本，直接用 props + App 回调
3. EntryPointList 的 ExtractionConfig 自动获得最新 properties（已从 App 透传）
4. refCount 计算：PropertyDictionary 根据 App 传入的 extractions 数据实时计算

---

## Bug 6（中危）：策略页规则关联不参与脏数据检测

### 问题

editRuleIds 在 ActivationList 本地状态，EntityEditorShell 的 dirty 只比较 `edited` 对象。只改规则关联不改基础表单时，点返回/取消不会提示未保存。

### 涉及文件

- `src/pages/ActivationList.jsx`：第 102 行 editRuleIds，第 249 行修改逻辑
- `src/components/EntityEditorShell.jsx`：第 115 行 dirty 检测

### 修复设计

利用 Bug 1 中扩展的 `extraDirtyCheck` 机制。ActivationList 编辑模式下传入比较函数，对比 editRuleIds 和初始 ruleIds 是否变化。

---

## 修改影响矩阵

| 文件 | Bug 1 | Bug 2 | Bug 3 | Bug 4 | Bug 5 | Bug 6 |
|------|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|
| App.jsx | x | x | | | x | |
| EntityEditorShell.jsx | x | | | | | x |
| EntryPointList.jsx | x | x | | | | |
| ActivationList.jsx | | x | | | | x |
| ConfirmPopover.jsx | | | x | | | |
| ExtractionConfig.jsx | | | (不改) | | | |
| SceneCard.jsx | | | (不改) | | | |
| RulePickerModal.jsx | | | | x | | |
| PropertyDictionary.jsx | | | (兼容) | | x | |

## 风险评估

- **Bug 1 风险最高**：涉及 EntityEditorShell 的 dirty 机制扩展，影响所有使用该壳层的编辑页。需要验证其他编辑页（特征、规则等）不受影响。
- **Bug 2 和 Bug 5**：去掉本地副本是破坏性重构，需逐页验证筛选/分页等 UI 状态不依赖本地数据变异。
- **Bug 3**：ConfirmPopover 重写需兼容 PropertyDictionary 的受控模式。
- **Bug 4 和 Bug 6**：改动面小，风险低。
