# Vite + React 项目重构设计

> 日期: 2026-04-12
> 状态: 已确认

## 1. 目标

将编译产物 app.js 反编译为可读的 JSX 源码，搭建 Vite + React 项目。最终效果必须与 app.js 原版体验完全一致（UI、交互、Mock 数据、页面跳转），同时将 ep-detail-demo.html 中的新功能（属性提取转换管道、场景编排、变更集发布单）集成到接入点编辑页中。

**基准参考：** app.js 的最后稳定版本（commit `e42c7b7` 之前的状态）即为"原版体验"。每个组件的还原都要对照 app.js 编译代码精确还原。

## 2. 技术决策

| 决策 | 选择 | 原因 |
|------|------|------|
| 构建工具 | Vite | 快速，零配置 React 支持 |
| 路由 | react-router-dom HashRouter | `npx serve dist` 可直接使用 |
| CSS | Tailwind CSS | 与原版一致 |
| 图标 | lucide-react | 原版使用 Lucide 图标 |
| 状态管理 | React useState（组件内） | 与原版一致，无全局状态库 |
| Build 产物 | `npm run build` → `dist/` → `npx serve dist` 查看 | 用户选择 |
| 反编译精度 | 逐组件精确还原 | 用户要求与原版体验完全一致 |

## 3. 项目结构

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
│   │   ├── EntryPointEditor.jsx     ← 还原 gz + 集成新功能
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

### 4.4 全局依赖映射

app.js 中的混淆变量名与实际模块的对应关系：

| 混淆名 | 实际模块 | 用途 |
|--------|---------|------|
| X, $, ge, ze, Qe | react/jsx-runtime | JSX 渲染 |
| Io, Fa, ln, wi, qt, za | react (hooks) | useState, useMemo 等 |
| Kt | lucide-react Eye | 查看图标 |
| et | lucide-react Pencil | 编辑图标 |
| ot | lucide-react Trash2 | 删除图标 |
| Ue | lucide-react Search | 搜索图标 |
| Fe | lucide-react Clock | 时钟图标 |
| We | lucide-react CheckCircle | 成功图标 |
| lt | lucide-react FileText | 文件图标 |
| Ht | lucide-react Archive | 归档图标 |
| Ra | lucide-react Settings | 设置图标 |
| na | lucide-react ArrowLeft | 返回图标 |
| Zo | lucide-react ChevronDown | 下拉图标 |
| Bf | lucide-react Menu | 菜单图标 |

## 5. 新功能集成

在 `EntryPointEditor.jsx` 中，`EntityEditorShell` 的 `extraSections` prop 增加三个区域：

1. **属性提取配置**（ExtractionCard + DataFlowVisualization）
2. **场景编排**（SceneCard × 3 个场景阶段）
3. **变更集**（ChangesetDetail）

这些组件的源码直接从 `ep-detail-demo.html` 中提取，拆分为 `src/features/` 下的独立模块。Mock 数据（MOCK_EXTRACTIONS_LOGIN 等）放到 `src/config/mock/` 中。

## 6. 验收标准

- `npm run dev` 启动后，每个页面的 UI 和交互与 app.js 原版完全一致
- `npm run build` + `npx serve dist` 可正常访问
- 接入点编辑页包含新功能（属性提取+场景编排+变更集）
- 所有 JSX 源码可读、可维护
- 项目无任何 CDN 依赖（npm 管理所有依赖）

## 7. 实施优先级

按依赖关系排序：
1. 项目初始化（Vite + 依赖安装）
2. 全局配置（菜单、权限、Mock 数据）
3. 共享组件（EntityEditorShell 等）
4. 页面组件（从简单到复杂）
5. 新功能集成
6. 验证 + 清理旧文件
