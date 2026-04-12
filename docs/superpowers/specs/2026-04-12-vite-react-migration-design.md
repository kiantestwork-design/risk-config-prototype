# Vite + React 项目重构设计

> 日期: 2026-04-12
> 状态: 已确认

## 1. 目标

分两阶段将编译产物 app.js 反编译为可读的 JSX 源码，搭建 Vite + React 项目。

**Phase 1（parity 还原）：** 精确还原 app.js 原版的所有页面，UI、交互、Mock 数据、页面跳转、跨页面状态联动必须与原版完全一致。验收标准：对照 legacy-host.html（加载 app.js 的原版）逐页面截图比对，无差异。

**Phase 2（新功能集成）：** 在 Phase 1 通过后，将 ep-detail-demo.html 中的新功能（属性提取转换管道、场景编排、变更集发布单）集成到接入点编辑页。这是增量变更，不影响 Phase 1 的 parity 验收。

**基准参考：** legacy-host.html 加载 app.js 的最后稳定版本即为"原版体验"。

## 2. 技术决策

| 决策 | 选择 | 原因 |
|------|------|------|
| 构建工具 | Vite | 快速，零配置 React 支持 |
| 路由 | react-router-dom HashRouter（唯一真源） | `npx serve dist` 可直接使用。**不维护独立的 currentPage state**，当前页面完全由 router location 推导（`useLocation()` + 菜单 key 映射）。菜单高亮、页面渲染、浏览器前进/后退全部由 router 驱动。 |
| CSS | Tailwind CSS | 与原版一致 |
| 图标 | lucide-react | 原版使用 Lucide 图标 |
| 状态管理 | App 顶层 useState + props 下发 | 与原版一致，关键共享状态由 App 持有（见 3.1） |
| Build 产物 | `npm run build` → `dist/` → `npx serve dist` 查看 | 用户选择 |
| 反编译精度 | 逐组件精确还原 | 用户要求与原版体验完全一致 |

## 3. App 顶层状态与跨页面联动

### 3.1 App 持有的共享状态

以下状态**必须**由 App.jsx 顶层持有，通过 props 传递给页面组件。不允许页面各自维护副本。

| 状态 | 类型 | 消费者（页面） |
|------|------|-------------|
| entryPoints | array | EntryPointList, EntryPointEditor, ActivationList |
| features | array | FeatureList, EntryPointEditor |
| activations | array | ActivationList, ReleaseCandidates |
| rules | array | RuleList, ActivationList |
| policies | array | PolicyManager (熔断/护栏) |
| overrides | array | Overrides |
| drafts | array | ReleaseCandidates（待发布草稿列表） |
| orders | array | ReleaseOrders（发布单列表） |
| users | array | UserManagement |
| roles | array | RoleManagement, UserManagement |
| currentUser | object | App（权限判断）、侧边栏（用户切换） |
| sidebarOpen | boolean | App 布局（移动端菜单） |
| docModalOpen | boolean | App（文档弹窗） |
| releaseResultModal | object `{isOpen, type, title, subTitle}` | ReleaseOrders（发布单操作成功/失败弹窗，跨页跳转时需保留） |
| currentOrderDetail | object / null | ReleaseOrders（当前查看/编辑的发布单，从列表点进详情时设置） |

### 3.2 跨页面回调链路

这些回调必须在 App 层实现，传给对应页面：

| 回调 | 触发页面 | 效果 |
|------|---------|------|
| onAddToDrafts(draft) | EntryPointList, FeatureList, ActivationList, RuleList | 向 drafts 数组追加条目 |
| onCreateOrder(order) | ReleaseCandidates | 创建发布单，追加到 orders，清空对应 drafts |
| onUpdateOrder(id, updates) | ReleaseOrders | 更新发布单状态（审批/发布/回滚） |
| onSaveEntity(entity) | EntityEditorShell 内的所有编辑页 | 更新对应实体数组（entryPoints/features 等） |
| onUpdateUsers(users) | UserManagement | 更新用户列表 |
| onUpdateRoles(roles) | RoleManagement | 更新角色列表 |

### 3.3 Mock 数据初始化

Mock 数据文件（`src/config/mock/*.js`）只提供**初始值**。App.jsx 在 `useState(initialData)` 中使用它们作为默认值。之后所有修改通过回调更新 App 的 state，不重新读取 mock 文件。

---

## 4. 项目结构

```
risk-config-prototype/
├── package.json
├── vite.config.js
├── index.html                       ← Vite 入口
├── src/
│   ├── main.jsx                     ← ReactDOM.createRoot + <App />
│   ├── App.jsx                      ← 布局：侧边栏 + 顶栏 + HashRouter
│   ├── App.css                      ← 全局样式（expand-section, confirm-popover 等）
│   ├── config/
│   │   ├── menu.js                  ← 菜单配置（gE 数组还原）
│   │   ├── permissions.js           ← PERM_GROUPS, MENU_PERM_MAP, EDIT_PERM_MAP, BUILTIN_ROLES, INIT_USERS
│   │   └── mock/
│   │       ├── entry-points.js      ← 接入点 Mock 数据（rn 数组还原）
│   │       ├── features.js          ← 特征 Mock 数据（eo 数组还原）
│   │       ├── activations.js       ← 策略 Mock 数据（gr 数组还原）
│   │       ├── rules.js             ← 规则 Mock 数据（Or 数组还原）
│   │       ├── policies.js          ← 熔断/护栏 Mock 数据
│   │       ├── overrides.js         ← 干预 Mock 数据
│   │       ├── releases.js          ← 发布单 Mock 数据
│   │       ├── versions.js          ← 版本历史 Mock 数据（lz 数组还原）
│   │       └── properties.js        ← 标准属性 Mock 数据
│   ├── components/
│   │   ├── EntityEditorShell.jsx     ← 通用编辑器外壳（精确还原）
│   │   ├── StatusToggle.jsx
│   │   ├── ConfirmPopover.jsx
│   │   ├── SearchSelect.jsx
│   │   ├── MultiSelectFilter.jsx
│   │   ├── FieldTypeTag.jsx
│   │   ├── ValidateTag.jsx
│   │   ├── Toast.jsx                ← showToast + AntdToastContainer
│   │   └── StatCard.jsx             ← 仪表盘统计卡片（kv 组件还原）
│   ├── pages/
│   │   ├── Dashboard.jsx            ← 还原 ez
│   │   ├── EntryPointList.jsx       ← 还原 xz（列表 + 批量操作 + 筛选）
│   │   ├── EntryPointEditor.jsx     ← Phase 1: 只还原 gz；Phase 2: 再接入 features/ 的 extraSections
│   │   ├── PropertyDictionary.jsx   ← 还原 PropertyDictionaryPage
│   │   ├── FeatureList.jsx          ← 还原 hz
│   │   ├── ActivationList.jsx       ← 还原 bz
│   │   ├── RuleList.jsx             ← 还原 Nz
│   │   ├── PolicyManager.jsx        ← 还原 IN（type prop 区分熔断/护栏）
│   │   ├── Overrides.jsx            ← 还原 uz
│   │   ├── ReleaseCandidates.jsx    ← 还原 Pz
│   │   ├── ReleaseOrders.jsx        ← 还原 Rz
│   │   ├── UserManagement.jsx       ← 还原 UserMgmt
│   │   └── RoleManagement.jsx       ← 还原 RoleMgmt
│   └── features/                    ← 新功能（从 ep-detail-demo.html 提取）
│       ├── extraction/
│       │   ├── ExtractionCard.jsx
│       │   ├── TransformerModal.jsx
│       │   ├── TransformerTags.jsx
│       │   ├── DataFlowVisualization.jsx
│       │   └── operators.js
│       ├── scene/
│       │   └── SceneCard.jsx
│       └── changeset/
│           └── ChangesetDetail.jsx
├── app.js                           ← 旧编译产物（还原参考源，完成后删除）
├── dist/                            ← build 产物（gitignore）
└── ...旧文件（完成后清理）
```

## 4. 反编译方法

### 4.1 组件定位

app.js 中每个组件的位置已知（通过之前的分析）：

| 组件 | app.js 变量名 | 大致 offset | 大小 |
|------|-------------|------------|------|
| Dashboard | ez | 565248 | ~5K |
| PolicyManager | IN | 569865 | ~54K |
| Overrides | uz | 623561 | ~53K |
| FeatureList | hz | 676820 | ~22K |
| EntityEditorShell | EntityEditorShell | 699073 | ~115K |
| EntryPointEditor | gz | 813972 | ~9K |
| EntryPointList | xz | 822759 | ~43K |
| ActivationList | bz | 865925 | ~61K |
| RuleList | Nz | 926883 | ~54K |
| ReleaseCandidates | Pz | 980808 | ~16K |
| ReleaseOrders | Rz | 996694 | ~209K |
| UserManagement | UserMgmt | 1206030 | ~10K |
| RoleManagement | RoleMgmt | 1215701 | ~22K |
| PropertyDictionary | PropertyDictionaryPage | 1237623 | ~26K |

### 4.2 还原步骤（每个组件）

1. 从 app.js 中提取对应区段的编译代码
2. 分析代码逻辑：state 定义、事件处理、条件渲染、Mock 数据引用
3. 用 JSX 重写，保持完全相同的：
   - UI 结构（DOM 层级、className）
   - 交互逻辑（点击、筛选、编辑、删除等）
   - Mock 数据内容
   - 状态管理逻辑
4. 验证：对比浏览器中的渲染结果，确保视觉和交互一致

### 4.3 编译格式 → JSX 对照表

| 编译格式 | JSX |
|---------|-----|
| `(0,X.jsx)("div",{className:"x",children:"text"})` | `<div className="x">text</div>` |
| `(0,X.jsxs)("div",{children:[a,b]})` | `<div>{a}{b}</div>` |
| `(0,Io.useState)(val)` | `useState(val)` |
| `(0,Io.useMemo)(fn,deps)` | `useMemo(fn,deps)` |
| `(0,Io.useCallback)(fn,deps)` | `useCallback(fn,deps)` |
| `condition&&(0,X.jsx)(C,{})` | `{condition && <C />}` |

### 5.4 全局依赖映射

app.js 中的混淆变量名与实际模块的对应关系：

| 混淆名 | 实际模块 | 用途 |
|--------|---------|------|
| X, $, ge, ze, Qe | react/jsx-runtime | JSX 渲染 |
| Io, Fa, ln, wi, qt, za | react (hooks) | useState, useMemo 等 |

**Lucide 图标映射：** app.js 中 bundled 了 49 个 lucide-react 图标（版本 v0.562.0），混淆变量名无法通过静态分析可靠提取。实施时**不依赖此映射表**，改为以下策略：

1. 打开 `legacy-host.html`（原版），用浏览器 DevTools 检查每个图标元素的 SVG path
2. 在 lucide.dev 搜索对应的 SVG path，确认图标名称
3. 在 JSX 中使用正确的 lucide-react 导入名

bundled 的 49 个图标文件列表（从 app.js 注释中提取，可作为查找范围）：
`activity, archive, arrow-left, arrow-right, bell, book-open, brackets, calendar, check, chevron-down, chevron-right, circle-alert, circle-check-big, circle-check, circle-play, circle-stop, circle-x, clock, database, eye, file-braces, file-text, funnel, git-branch, globe, grip-vertical, history, layers, layout-dashboard, list, loader-circle, menu, message-square, play, plus, rocket, save, search, settings, shield-alert, shield-check, shield, shopping-cart, square-pen, target, triangle-alert, user, x, zap`

## 5. 新功能集成（仅 Phase 2，Phase 1 parity 验收通过后才开始）

Phase 1 中 `EntryPointEditor.jsx` 只还原 gz 组件原有的 extraSections（关联策略、关联规则表格）。

Phase 2 在 `EntryPointEditor.jsx` 的 `extraSections` prop 中**追加**三个区域：

1. **属性提取配置**（ExtractionCard + DataFlowVisualization）
2. **场景编排**（SceneCard × 3 个场景阶段）
3. **变更集**（ChangesetDetail）

这些组件的源码直接从 `ep-detail-demo.html` 中提取，拆分为 `src/features/` 下的独立模块。Mock 数据（MOCK_EXTRACTIONS_LOGIN 等）放到 `src/config/mock/` 中。

## 7. 验收标准

### Phase 1 验收（parity 还原）

- `npm run dev` 启动后，逐页面对照 `legacy-host.html`（原版），UI 和交互无差异
- 跨页面联动正常：策略页加草稿 → 待发布清单可见；发布单创建 → 发布单列表更新；用户/角色联动
- 所有 Mock 数据内容与原版一致
- `npm run build` + `npx serve dist` 可正常访问
- 所有 JSX 源码可读、可维护

### Phase 2 验收（新功能集成）

- 接入点编辑页的 extraSections 中新增属性提取配置、场景编排、变更集三个区域
- 新功能的 UI 和交互与 ep-detail-demo.html 一致
- 新功能不影响 Phase 1 已还原页面的行为

## 8. 实施优先级

按依赖关系排序：

**Phase 1：**
1. 项目初始化（Vite + 依赖安装 + Tailwind 配置）
2. App.jsx 壳层（布局 + 路由 + 顶层状态 + 跨页面回调）
3. 全局配置（菜单、权限、Mock 数据初始值）
4. 共享组件（EntityEditorShell、Toast 等）
5. 页面组件（从简单到复杂，每个页面完成后对照原版验证）
6. Phase 1 全量验证

**Phase 2：**
7. 新功能组件（从 ep-detail-demo.html 提取到 src/features/）
8. 集成到 EntryPointEditor.jsx 的 extraSections
9. Phase 2 验证 + 清理旧文件（app.js、legacy-host.html、pages/、vendor/）
