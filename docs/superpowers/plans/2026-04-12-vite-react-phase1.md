# Vite + React 项目重构 Phase 1 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将编译产物 app.js 精确还原为 Vite + React 项目的 JSX 源码，所有页面 UI/交互/Mock 数据与原版完全一致。

**Architecture:** 在当前目录初始化 Vite + React，`src/` 目录存放 JSX 源码。App.jsx 作为壳层持有所有共享状态，通过 props 下发给页面组件。路由使用 HashRouter（唯一真源），菜单高亮由 useLocation 推导。每个页面组件通过读取 app.js 编译代码精确还原。

**Tech Stack:** Vite, React 18, react-router-dom (HashRouter), Tailwind CSS, lucide-react v0.562.0

**Spec:** `docs/superpowers/specs/2026-04-12-vite-react-migration-design.md`

**反编译参考源:** `app.js`（保留在项目根目录，实施时读取对应区段的编译代码进行还原）

**验收基准:** `legacy-host.html`（加载 app.js 的原版页面，逐页面对照）

---

## 反编译方法说明

每个页面 Task 的实施步骤相同：
1. 读取 app.js 中指定 offset 范围的编译代码
2. 将 `(0,X.jsx)(...)` 转为 JSX、`(0,Io.useState)(...)` 转为 `useState(...)` 等
3. 用浏览器 DevTools 对照 legacy-host.html 确认图标名称
4. 产出 JSX 文件，确保渲染结果与原版一致

编译格式 → JSX 对照：
- `(0,X.jsx)("div",{className:"x",children:"text"})` → `<div className="x">text</div>`
- `(0,X.jsxs)("div",{children:[a,b]})` → `<div>{a}{b}</div>`
- `condition&&(0,X.jsx)(C,{})` → `{condition && <C />}`
- `(0,Io.useState)(val)` → `useState(val)`

---

### Task 1: 项目初始化

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Modify: `index.html`（改为 Vite 入口）
- Create: `src/main.jsx`
- Create: `src/App.jsx`（空壳）
- Create: `src/App.css`
- Create: `.gitignore`（追加 node_modules, dist）

- [ ] **Step 1: 初始化 Vite + React 项目**

```bash
npm create vite@latest . -- --template react
```

如果提示目录非空，选择忽略已有文件。然后安装依赖：

```bash
npm install
npm install react-router-dom lucide-react
npm install -D tailwindcss @tailwindcss/vite
```

- [ ] **Step 2: 配置 Vite + Tailwind**

`vite.config.js`:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
})
```

`src/App.css`（替换 Vite 默认样式）：
```css
@import "tailwindcss";

body {
  background: #f0f2f5;
  color: rgba(0,0,0,0.88);
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
  margin: 0;
}
.expand-section { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.3s ease; }
.expand-section.open { grid-template-rows: 1fr; }
.expand-inner { overflow: hidden; }
.confirm-popover {
  position: absolute; right: 0; top: 100%; z-index: 10; margin-top: 4px;
  background: white; border-radius: 8px; padding: 12px 16px; white-space: nowrap;
  box-shadow: 0 6px 16px rgba(0,0,0,0.08), 0 3px 6px -4px rgba(0,0,0,0.12), 0 9px 28px 8px rgba(0,0,0,0.05);
}
.editing-row { background: #fffbe6 !important; }
```

- [ ] **Step 3: 修改 index.html 为 Vite 入口**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>风控配置平台</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 4: 创建 main.jsx 入口**

`src/main.jsx`:
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './App.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 5: 创建 App.jsx 空壳（验证构建链路）**

`src/App.jsx`:
```jsx
export default function App() {
  return <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
    <h1 className="text-2xl text-slate-600">风控配置平台 - 构建中...</h1>
  </div>
}
```

- [ ] **Step 6: 更新 .gitignore**

追加：
```
node_modules/
dist/
```

- [ ] **Step 7: 验证构建链路**

```bash
npm run dev
# 浏览器打开 http://localhost:5173，确认显示"风控配置平台 - 构建中..."
# Ctrl+C 停止

npm run build
npx serve dist
# 浏览器打开 http://localhost:3000，确认同样显示
```

- [ ] **Step 8: Commit**

```bash
git add package.json vite.config.js src/ index.html .gitignore
git commit -m "feat: Vite+React项目初始化（构建链路验证通过）"
```

---

### Task 2: 全局配置（菜单、权限、Mock 数据）

**Files:**
- Create: `src/config/menu.js`
- Create: `src/config/permissions.js`
- Create: `src/config/mock/entry-points.js`
- Create: `src/config/mock/features.js`
- Create: `src/config/mock/activations.js`
- Create: `src/config/mock/rules.js`
- Create: `src/config/mock/policies.js`
- Create: `src/config/mock/overrides.js`
- Create: `src/config/mock/releases.js`
- Create: `src/config/mock/versions.js`
- Create: `src/config/mock/properties.js`

- [ ] **Step 1: 提取菜单配置**

读取 app.js 中 `gE` 数组（约 offset 1245030），精确还原为 `src/config/menu.js`。注意：icon 字段先用字符串占位（如 `icon: 'LayoutDashboard'`），后续在 App.jsx 中映射为 lucide-react 组件。

菜单结构（从 app.js 分析得到）：
- dashboard / 监控大盘
- data-config / 数据配置 → property-dictionary, event-points, feature-list
- decision-config / 决策配置 → activations, rules
- risk-control / 风控策略 → circuit-breakers, guardrails, overrides
- release-management / 发布管理 → release-candidates, release-orders
- system / 系统管理 → user-management, role-management

- [ ] **Step 2: 提取权限配置**

读取 app.js 中 `PERM_GROUPS`、`ALL_PERMS`、`BUILTIN_ROLES`、`INIT_USERS`、`MENU_PERM_MAP`、`EDIT_PERM_MAP`（约 offset 1237623），精确还原为 `src/config/permissions.js`。这些数据在前面的分析中已经完整记录。

- [ ] **Step 3: 提取所有 Mock 数据**

从 app.js 中找到以下变量的定义，提取为独立模块：

| 变量名 | 产出文件 | 查找方法 |
|--------|---------|---------|
| rn | mock/entry-points.js | 搜索 `eventPoint:"EP00010001"` |
| eo | mock/features.js | 搜索 `featureCode:` 或特征名称 |
| gr | mock/activations.js | 搜索 `activationCode:` 或策略名称 |
| Or | mock/rules.js | 搜索 `ruleCode:` 或规则名称 |
| zv | mock/policies.js | 搜索 `policyId:` 或熔断策略名称 |
| nz | mock/overrides.js | 搜索 `overrideId:` 或干预名称 |
| iz | mock/releases.js | 搜索发布单ID或发布单标题 |
| oz | mock/releases.js（待发布清单，和发布单放同一文件） | 搜索待发布草稿 |
| lz | mock/versions.js | 搜索 `eventPointId:` 版本历史 |
| PD_MOCK_DATA | mock/properties.js | 已知（PropertyDictionaryPage 中定义） |

每个 mock 文件 export 对应的数组。

- [ ] **Step 4: Commit**

```bash
git add src/config/
git commit -m "feat: 全局配置（菜单+权限+Mock数据）"
```

---

### Task 3: App.jsx 壳层（布局 + 路由 + 顶层状态）

**Files:**
- Modify: `src/App.jsx`
- Create: `src/components/Toast.jsx`

**反编译源:** app.js 中 `dce` 函数（约 offset 1246300，~20K 代码）

- [ ] **Step 1: 读取 app.js 中 dce 函数，还原 App.jsx**

App.jsx 需要精确还原以下内容（从 dce 函数分析得到）：

**布局结构：**
- 侧边栏（fixed, w-64, bg-[#001529]）：Logo + 菜单组（可折叠）+ 底部用户切换
- 顶栏（h-16, bg-white）：面包屑 + 环境标签 + 搜索框 + 文档按钮 + 通知铃铛
- 内容区（flex-1, overflow-auto, p-6, max-w-[1600px]）：路由页面渲染
- 移动端遮罩（侧边栏展开时）

**顶层 state（全部从 dce 的 useState 还原）：**
```
entryPoints, features, activations, rules, policies, overrides,
drafts, orders, users, roles, currentUser,
sidebarOpen, docModalOpen, expandedMenus,
releaseResultModal, userSelectorOpen
```

**跨页面回调（全部从 dce 的函数定义还原）：**
```
onAddToDrafts, onCreateOrder, onUpdateOrder,
onSavePolicies, onDeletePolicy, onDeleteOverride,
onUpdateUsers, onUpdateRoles
```

**路由：** 使用 HashRouter + Routes，每个路由传入对应的 state 和回调 props。

**其他：**
- `window.__hasPerm` 权限检查函数
- 文档弹窗（SH 组件还原为 DocModal）
- 发布成功弹窗
- AntdToastContainer

- [ ] **Step 2: 创建 Toast 组件**

读取 app.js 中 `showToast` 和 `AntdToastContainer` 的定义，还原为 `src/components/Toast.jsx`。

- [ ] **Step 3: 验证壳层渲染**

```bash
npm run dev
```

确认：
- 侧边栏菜单正常渲染（深色背景、6 个分组、可折叠）
- 顶栏显示面包屑、环境标签
- 点击菜单项切换路由（内容区暂时显示空白，后续 Task 补充页面）
- 底部用户切换正常工作

- [ ] **Step 4: Commit**

```bash
git add src/
git commit -m "feat: App壳层（布局+路由+顶层状态+跨页面回调）"
```

---

### Task 4: 共享组件

**Files:**
- Create: `src/components/EntityEditorShell.jsx`
- Create: `src/components/StatusToggle.jsx`
- Create: `src/components/ConfirmPopover.jsx`
- Create: `src/components/SearchSelect.jsx`
- Create: `src/components/MultiSelectFilter.jsx`
- Create: `src/components/FieldTypeTag.jsx`
- Create: `src/components/ValidateTag.jsx`
- Create: `src/components/StatCard.jsx`

**反编译源:** app.js 中各组件定义位置

- [ ] **Step 1: 还原 EntityEditorShell**

读取 app.js offset 699073 开始的 ~115K 编译代码，精确还原 `EntityEditorShell.jsx`。

这是最复杂的共享组件，包含：
- 查看/编辑模式切换
- 脏数据检测（isDirty）
- 保存确认弹框（含变更备注 changeNote 输入框）
- 版本历史面板
- 自定义表单渲染（renderForm prop）
- 额外分区（extraSections prop）
- 返回导航守卫（guardNav）

- [ ] **Step 2: 还原其他共享组件**

从 app.js 中找到以下组件的定义并还原：

| 组件 | 查找方法 | 功能 |
|------|---------|------|
| StatusToggle | 搜索 `StatusToggle` 或 `PdStatusToggle` | 启用/禁用开关 |
| ConfirmPopover | 搜索 `ConfirmPopover` 或 `PdConfirmPopover` | 内联确认气泡 |
| SearchSelect | 搜索 `PdSearchSelect` | 搜索下拉选择器 |
| MultiSelectFilter | 搜索 `PdMultiSelectFilter` | 多选筛选器 |
| FieldTypeTag | 搜索 `PdFieldTypeTag` | 字段类型彩色标签 |
| ValidateTag | 搜索 `PdValidateTag` | 校验规则标签 |
| StatCard | 搜索 `kv` 组件（Dashboard 使用） | 统计数字卡片 |

注意：PropertyDictionaryPage 中以 `Pd` 前缀定义的组件（PdSearchSelect 等）实际上是通用组件，在其他页面中也通过类似的内联定义使用。还原为共享组件后，所有页面统一导入。

- [ ] **Step 3: 验证共享组件可导入**

在 App.jsx 中临时导入并渲染一个 StatusToggle，确认组件正常工作：

```bash
npm run dev
# 确认页面无报错
```

- [ ] **Step 4: Commit**

```bash
git add src/components/
git commit -m "feat: 共享组件（EntityEditorShell+表单控件+标签）"
```

---

### Task 5: Dashboard 页面

**Files:**
- Create: `src/pages/Dashboard.jsx`

**反编译源:** app.js offset 565248，变量名 `ez`，~5K

- [ ] **Step 1: 读取 app.js 中 ez 的编译代码，还原为 Dashboard.jsx**

Dashboard 页面包含：
- 4 个统计卡片（使用 StatCard 组件）
- 最近操作记录表格
- 可能的图表区域

精确还原 UI 结构、样式类名、Mock 数据。

- [ ] **Step 2: 在 App.jsx 路由中注册**

```jsx
import Dashboard from './pages/Dashboard'
// 在 Routes 中：
<Route path="/" element={<Dashboard />} />
```

- [ ] **Step 3: 对照验证**

打开 `legacy-host.html`（原版），点击"监控大盘"。
打开 `http://localhost:5173/#/`（新版）。
对比两者的 UI，确保一致。

- [ ] **Step 4: Commit**

```bash
git add src/pages/Dashboard.jsx src/App.jsx
git commit -m "feat: Dashboard页面还原"
```

---

### Task 6-17: 各页面还原（每个页面一个 Task）

以下每个 Task 结构相同，只是目标文件和反编译源不同。

**通用步骤：**
1. 读取 app.js 中指定 offset 的编译代码
2. 还原为 JSX，使用已有的共享组件
3. 在 App.jsx 路由中注册，传入正确的 props（state + 回调）
4. 对照 legacy-host.html 验证
5. Commit

---

### Task 6: PropertyDictionary 页面

**Files:** Create `src/pages/PropertyDictionary.jsx`
**反编译源:** app.js offset 1237623，变量名 `PropertyDictionaryPage`，~26K

- [ ] **Step 1: 还原 PropertyDictionary.jsx**

从 app.js 精确还原。注意：这个页面自带了 PdSearchSelect、PdFieldTypeTag 等子组件（已在 Task 4 提取为共享组件），还原时改为从 `src/components/` 导入。

- [ ] **Step 2: 注册路由，对照验证，Commit**

---

### Task 7: UserManagement 页面

**Files:** Create `src/pages/UserManagement.jsx`
**反编译源:** app.js offset 1206030，变量名 `UserMgmt`，~10K
**Props:** `{ roles, users, onUpdateUsers }`

- [ ] **Step 1: 还原 UserManagement.jsx**
- [ ] **Step 2: 注册路由，对照验证，Commit**

---

### Task 8: RoleManagement 页面

**Files:** Create `src/pages/RoleManagement.jsx`
**反编译源:** app.js offset 1215701，变量名 `RoleMgmt`，~22K
**Props:** `{ roles, users, onUpdateRoles }`

- [ ] **Step 1: 还原 RoleManagement.jsx**
- [ ] **Step 2: 注册路由，对照验证，Commit**

---

### Task 9: EntryPointList 页面

**Files:** Create `src/pages/EntryPointList.jsx`
**反编译源:** app.js offset 822759，变量名 `xz`，~43K
**Props:** `{ onAddToDrafts }`

- [ ] **Step 1: 还原 EntryPointList.jsx**

包含列表视图和详情视图（通过内部 state 切换 LIST/VIEW 模式）。详情视图使用 `EntityEditorShell` 渲染 `gz` 组件的 `renderForm` 和 `extraSections`。

注意：`xz` 内部引用了 `gz`（EntryPointEditor），在还原时需要把 gz 的编辑表单逻辑也包含进来（作为 EntityEditorShell 的 renderForm）。

- [ ] **Step 2: 注册路由，对照验证，Commit**

---

### Task 10: FeatureList 页面

**Files:** Create `src/pages/FeatureList.jsx`
**反编译源:** app.js offset 676820，变量名 `hz`，~22K
**Props:** `{ onAddToDrafts }`

- [ ] **Step 1: 还原 FeatureList.jsx**
- [ ] **Step 2: 注册路由，对照验证，Commit**

---

### Task 11: ActivationList 页面

**Files:** Create `src/pages/ActivationList.jsx`
**反编译源:** app.js offset 865925，变量名 `bz`，~61K
**Props:** `{ onAddToDrafts }`

- [ ] **Step 1: 还原 ActivationList.jsx**
- [ ] **Step 2: 注册路由，对照验证，Commit**

---

### Task 12: RuleList 页面

**Files:** Create `src/pages/RuleList.jsx`
**反编译源:** app.js offset 926883，变量名 `Nz`，~54K
**Props:** `{ onAddToDrafts }`

- [ ] **Step 1: 还原 RuleList.jsx**
- [ ] **Step 2: 注册路由，对照验证，Commit**

---

### Task 13: PolicyManager 页面

**Files:** Create `src/pages/PolicyManager.jsx`
**反编译源:** app.js offset 569865，变量名 `IN`，~54K
**Props:** `{ type, policies, onSave, onDelete }` — type 为 "CIRCUIT_BREAKER" 或 "GUARDRAIL"

- [ ] **Step 1: 还原 PolicyManager.jsx**

注意：`IN` 是一个共用组件，通过 `type` prop 区分服务熔断和业务护栏。路由中注册两次：
```jsx
<Route path="/circuit-breakers" element={<PolicyManager type="CIRCUIT_BREAKER" ... />} />
<Route path="/guardrails" element={<PolicyManager type="GUARDRAIL" ... />} />
```

- [ ] **Step 2: 注册路由，对照验证，Commit**

---

### Task 14: Overrides 页面

**Files:** Create `src/pages/Overrides.jsx`
**反编译源:** app.js offset 623561，变量名 `uz`，~53K
**Props:** `{ overrides, onDelete }`

- [ ] **Step 1: 还原 Overrides.jsx**
- [ ] **Step 2: 注册路由，对照验证，Commit**

---

### Task 15: ReleaseCandidates 页面

**Files:** Create `src/pages/ReleaseCandidates.jsx`
**反编译源:** app.js offset 980808，变量名 `Pz`，~16K
**Props:** `{ drafts, onCreateOrder }`

- [ ] **Step 1: 还原 ReleaseCandidates.jsx**
- [ ] **Step 2: 注册路由，对照验证，Commit**

---

### Task 16: ReleaseOrders 页面

**Files:** Create `src/pages/ReleaseOrders.jsx`
**反编译源:** app.js offset 996694，变量名 `Rz`，~209K（最大的组件）
**Props:** `{ orders, onUpdateOrder }`

- [ ] **Step 1: 还原 ReleaseOrders.jsx**

这是最复杂的页面（~209K 编译代码），包含：
- 发布单列表视图（筛选、分页）
- 发布单详情视图（变更明细、审批记录、操作按钮）
- 多种状态的操作流程（审批、发布、回滚）
- 文档/Markdown 预览

建议分多个子步骤：先还原列表视图，再还原详情视图。

- [ ] **Step 2: 注册路由，对照验证，Commit**

---

### Task 17: Phase 1 全量验证

**Files:** 无新文件

- [ ] **Step 1: 逐页面对照验证**

打开 `legacy-host.html` 和 `http://localhost:5173` 并排对比每个页面：

| 页面 | 路由 | 检查项 |
|------|------|--------|
| 监控大盘 | `/#/` | 4 个统计卡片、最近操作表 |
| 标准属性字典 | `/#/property-dictionary` | 搜索、筛选、表格、编辑、删除 |
| 接入点管理 | `/#/entry-points` | 列表、编辑（EntityEditorShell）、批量操作 |
| 特征管理 | `/#/features` | 列表、编辑、状态切换 |
| 策略管理 | `/#/activations` | 列表、编辑、关联规则 |
| 规则管理 | `/#/rules` | 列表、编辑、评分配置 |
| 服务熔断 | `/#/circuit-breakers` | 策略列表、编辑 |
| 业务护栏 | `/#/guardrails` | 策略列表、编辑 |
| 手动干预 | `/#/overrides` | 警告横幅、干预列表 |
| 待发布清单 | `/#/release-candidates` | 草稿列表、创建发布单 |
| 发布单列表 | `/#/release-orders` | 发布单列表、详情、审批/发布/回滚 |
| 用户管理 | `/#/users` | 用户列表、编辑、角色关联 |
| 角色管理 | `/#/roles` | 角色列表、权限配置 |

- [ ] **Step 2: 验证跨页面联动**

1. 接入点列表 → 点击"加入待发布" → 切换到待发布清单，确认可见
2. 待发布清单 → 创建发布单 → 确认成功弹窗 → 点击"进入发布单列表" → 确认跳转
3. 发布单列表 → 审批 → 发布 → 回滚，确认状态正确更新
4. 用户管理 → 修改用户角色 → 角色管理页确认关联用户数更新

- [ ] **Step 3: 验证构建产物**

```bash
npm run build
npx serve dist
# 访问 http://localhost:3000，重复上述验证
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: Phase 1 parity还原完成，全量验证通过"
```

---

## Phase 2 计划（Phase 1 验收通过后单独编写）

Phase 2 将在单独的计划文档中定义，包含：
- Task 18: 从 ep-detail-demo.html 提取新功能组件到 `src/features/`
- Task 19: 集成到 EntryPointEditor.jsx 的 extraSections
- Task 20: Phase 2 验证 + 清理旧文件
