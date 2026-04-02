# 用户管理、角色、权限管理实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为风控配置平台新增用户管理和角色管理页面，实现操作级权限控制（前端模拟）。

**Architecture:** 单文件 bundled React 应用（app.js）。新增 mock 数据常量（权限点、角色、用户）、两个独立页面组件（用户管理、角色管理）、侧边栏菜单扩展、权限过滤逻辑、当前用户切换 UI。

**Tech Stack:** React 19 (bundled)、Tailwind CSS (CDN)、Lucide React icons

**重要约束：** 所有代码修改直接在 app.js 中进行。代码经过 minification，需通过唯一字符串片段定位代码位置。验证方式为浏览器手动测试。

---

## 文件结构

所有修改集中在单个文件：

- **Modify:** `app.js` — 全部代码所在的 bundle 文件

### 关键位置索引

| 标识 | 用途 | 定位字符串 |
|------|------|-----------|
| gE 菜单数组 | 侧边栏菜单定义 | `gE=[{key:"dashboard"` |
| App 函数 | 主组件 | `function dce()` |
| App 状态 | 全局状态定义 | `let[e,t]=(0,Io.useState)("dashboard")` |
| 页面路由 | 页面渲染 switch | `e==="dashboard"&&(0,ge.jsx)(ez` |
| 侧边栏渲染 | 菜单列表 | `gE.map(L=>{let M=L.key===e` |

### 模块别名

- `Io` = React（App 组件使用）
- `ge` = JSX 工厂（App 组件使用）
- `X` = JSX 工厂（新组件使用，与 EntityEditor 一致）
- `qt` = React（新组件使用，与 EntityEditor 一致）

### Lucide 图标变量

- `ei` = Settings 图标
- `Uf` = User 图标
- `Gn` = Shield 图标（注意：也在风控策略菜单中使用）
- `lt` = FileEdit 图标
- `et` = Edit 图标
- `ot` = Trash 图标
- `Kt` = Eye 图标
- `We` = CheckCircle 图标
- `Fe` = Package 图标
- `na` = ArrowLeft 图标
- `tt` = X (close) 图标
- `oa` = ToggleRight 图标

---

### Task 1: 新增 Mock 数据常量（权限点、角色、用户）

**Files:**
- Modify: `app.js` — 在 gE 菜单数组之前插入数据常量

- [ ] **Step 1: 定位插入点**

搜索定位字符串: `gE=[{key:"dashboard"`

在其之前插入所有 mock 数据常量。

- [ ] **Step 2: 插入权限点定义、角色数据、用户数据**

在 `gE=[` 之前插入：

```javascript
var PERM_GROUPS=[{key:"data-config",label:"\u6570\u636E\u914D\u7F6E",perms:[{key:"ep:view",label:"\u63A5\u5165\u70B9 - \u67E5\u770B"},{key:"ep:edit",label:"\u63A5\u5165\u70B9 - \u7F16\u8F91"},{key:"feature:view",label:"\u7279\u5F81 - \u67E5\u770B"},{key:"feature:edit",label:"\u7279\u5F81 - \u7F16\u8F91"}]},{key:"decision-config",label:"\u51B3\u7B56\u914D\u7F6E",perms:[{key:"activation:view",label:"\u7B56\u7565 - \u67E5\u770B"},{key:"activation:edit",label:"\u7B56\u7565 - \u7F16\u8F91"},{key:"rule:view",label:"\u89C4\u5219 - \u67E5\u770B"},{key:"rule:edit",label:"\u89C4\u5219 - \u7F16\u8F91"},{key:"action:view",label:"\u52A8\u4F5C - \u67E5\u770B"},{key:"action:edit",label:"\u52A8\u4F5C - \u7F16\u8F91"}]},{key:"risk-control",label:"\u98CE\u63A7\u7B56\u7565",perms:[{key:"policy:view",label:"\u7B56\u7565 - \u67E5\u770B"},{key:"policy:edit",label:"\u7B56\u7565 - \u7F16\u8F91"}]},{key:"release-management",label:"\u53D1\u5E03\u7BA1\u7406",perms:[{key:"release:view",label:"\u53D1\u5E03 - \u67E5\u770B"},{key:"release:approve",label:"\u53D1\u5E03 - \u5BA1\u6279"}]},{key:"system",label:"\u7CFB\u7EDF\u7BA1\u7406",perms:[{key:"user:view",label:"\u7528\u6237 - \u67E5\u770B"},{key:"user:edit",label:"\u7528\u6237 - \u7F16\u8F91"},{key:"role:view",label:"\u89D2\u8272 - \u67E5\u770B"},{key:"role:edit",label:"\u89D2\u8272 - \u7F16\u8F91"}]}],ALL_PERMS=PERM_GROUPS.flatMap(g=>g.perms.map(p=>p.key)),BUILTIN_ROLES=[{id:1,name:"admin",displayName:"\u7BA1\u7406\u5458",description:"\u62E5\u6709\u7CFB\u7EDF\u5168\u90E8\u6743\u9650",permissions:[...ALL_PERMS],isBuiltin:!0},{id:2,name:"release_manager",displayName:"\u53D1\u5E03\u7ECF\u7406",description:"\u53EF\u67E5\u770B\u6240\u6709\u914D\u7F6E\uFF0C\u5BA1\u6279\u53D1\u5E03\u5355",permissions:ALL_PERMS.filter(p=>p.endsWith(":view")||p==="release:approve"),isBuiltin:!0},{id:3,name:"developer",displayName:"\u5F00\u53D1\u8005",description:"\u53EF\u7F16\u8F91\u98CE\u63A7\u914D\u7F6E\uFF0C\u4E0D\u53EF\u5BA1\u6279\u53D1\u5E03",permissions:ALL_PERMS.filter(p=>p!=="release:approve"&&p!=="user:edit"&&p!=="role:edit"),isBuiltin:!0},{id:4,name:"viewer",displayName:"\u89C2\u5BDF\u8005",description:"\u53EA\u8BFB\u6743\u9650\uFF0C\u4EC5\u53EF\u67E5\u770B",permissions:ALL_PERMS.filter(p=>p.endsWith(":view")),isBuiltin:!0}],INIT_USERS=[{id:1,username:"admin",displayName:"\u7CFB\u7EDF\u7BA1\u7406\u5458",email:"admin@example.com",roleId:1,status:1,createAt:"2025-01-01 00:00:00",lastLoginAt:"2025-03-28 09:30:00"},{id:2,username:"zhang.san",displayName:"\u5F20\u4E09",email:"zhang.san@example.com",roleId:3,status:1,createAt:"2025-01-15 10:00:00",lastLoginAt:"2025-03-28 14:20:00"},{id:3,username:"li.si",displayName:"\u674E\u56DB",email:"li.si@example.com",roleId:2,status:1,createAt:"2025-02-01 09:00:00",lastLoginAt:"2025-03-27 16:45:00"},{id:4,username:"wang.wu",displayName:"\u738B\u4E94",email:"wang.wu@example.com",roleId:4,status:2,createAt:"2025-03-01 11:00:00",lastLoginAt:"2025-03-20 10:00:00"}],MENU_PERM_MAP={"event-points":"ep:view","feature-list":"feature:view",activations:"activation:view",rules:"rule:view",actions:"action:view","circuit-breakers":"policy:view",guardrails:"policy:view",overrides:"policy:view","release-candidates":"release:view","release-orders":"release:view","user-management":"user:view","role-management":"role:view"},EDIT_PERM_MAP={"event-points":"ep:edit","feature-list":"feature:edit",activations:"activation:edit",rules:"rule:edit",actions:"action:edit","user-management":"user:edit","role-management":"role:edit"};
```

- [ ] **Step 3: 验证语法**

用 node 检查插入点前后的代码片段没有语法错误。

- [ ] **Step 4: Commit**

```bash
git add app.js
git commit -m "feat: 新增权限点、角色、用户 mock 数据常量"
```

---

### Task 2: 新增用户管理页面组件

**Files:**
- Modify: `app.js` — 在 gE 菜单数组之前（Task 1 数据之后）插入用户管理组件

- [ ] **Step 1: 阅读现有列表页模式**

了解现有列表页（如 xz 接入点列表）的结构：LIST/VIEW 两态、筛选区、表格、按钮。用户管理页面采用类似但更简单的 LIST/EDIT 两态。

- [ ] **Step 2: 插入用户管理组件**

在 EDIT_PERM_MAP 定义之后、`gE=[` 之前插入用户管理组件 `UserMgmt`。

组件需要使用 `qt` 作为 React 别名、`X` 作为 JSX 工厂（与 EntityEditor 一致）。

组件结构：
```
UserMgmt = ({roles, users, onUpdateUsers}) => {
  // 状态: mode (LIST/EDIT), selectedUser, filter
  // LIST态: 筛选(用户名搜索、角色下拉、状态下拉) + 新建按钮 + 表格
  // EDIT态: 表单(用户名/显示名/邮箱/角色下拉/状态开关) + 保存/取消
}
```

Props:
- `roles` — 角色列表（用于角色下拉选择）
- `users` — 用户数据数组
- `onUpdateUsers` — 更新用户数组的回调

完整实现需要包含：

**LIST 态：**
- 筛选区：用户名搜索 input、角色下拉 select、状态下拉 select、查询按钮
- 新建按钮
- 表格列：用户名(font-mono)、显示名、邮箱、角色(badge)、状态(启用绿色/禁用红色 badge)、最后登录时间、操作(编辑/删除)
- admin 用户不可删除

**EDIT 态：**
- 顶部：返回按钮 + 标题（新建用户/编辑用户）+ 保存按钮
- 表单卡片：
  - 用户名 input（编辑已有时 disabled）
  - 显示名 input
  - 邮箱 input
  - 角色 select（从 roles prop 生成选项）
  - 状态 toggle 开关

- [ ] **Step 3: 验证语法**

- [ ] **Step 4: Commit**

```bash
git add app.js
git commit -m "feat: 新增用户管理页面组件"
```

---

### Task 3: 新增角色管理页面组件

**Files:**
- Modify: `app.js` — 在 UserMgmt 之后、gE 之前插入角色管理组件

- [ ] **Step 1: 插入角色管理组件**

组件 `RoleMgmt`，使用 `qt`/`X`。

Props:
- `roles` — 角色数据数组
- `users` — 用户数据（用于统计每个角色关联的用户数）
- `onUpdateRoles` — 更新角色数组的回调

组件结构：
```
RoleMgmt = ({roles, users, onUpdateRoles}) => {
  // 状态: mode (LIST/EDIT), selectedRole, form
  // LIST态: 角色表格(角色名/描述/权限数/用户数/内置标识/操作)
  // EDIT态: 基本信息表单 + 权限checkbox分组
}
```

**LIST 态：**
- 新建角色按钮
- 表格列：角色显示名、name(font-mono)、描述、权限数量 badge、关联用户数、内置标识(内置/自定义 badge)、操作(查看/编辑/删除)
- 内置角色不可删除，只能查看

**EDIT 态：**
- 顶部：返回按钮 + 标题 + 保存按钮（内置角色无保存按钮）
- 基本信息卡片：角色名 input（内置或编辑已有时 disabled）、显示名 input、描述 textarea
- 权限配置卡片：
  - 遍历 PERM_GROUPS 数组
  - 每个分组一个子卡片，标题为分组 label，右侧有"全选/取消"按钮
  - 卡片内每个权限点一个 checkbox + label
  - 内置角色时所有 checkbox disabled
  - 勾选/取消通过 form.permissions 数组操作

- [ ] **Step 2: 验证语法**

- [ ] **Step 3: Commit**

```bash
git add app.js
git commit -m "feat: 新增角色管理页面组件"
```

---

### Task 4: 侧边栏菜单扩展 + 页面路由 + App 状态

**Files:**
- Modify: `app.js` — 修改 gE 菜单数组、App 函数状态、页面路由

- [ ] **Step 1: 在 gE 菜单数组末尾新增"系统管理"分组**

搜索定位字符串（gE 数组的最后一个元素结尾）:
`{key:"release-orders",label:"\u53D1\u5E03\u5355\u5217\u8868",icon:rs}]}]`

在 `]}]` 的最后一个 `]` 之前插入新分组：
```javascript
,{key:"system",label:"\u7CFB\u7EDF\u7BA1\u7406",icon:ei,children:[{key:"user-management",label:"\u7528\u6237\u7BA1\u7406",icon:Uf},{key:"role-management",label:"\u89D2\u8272\u7BA1\u7406",icon:Gn}]}
```

- [ ] **Step 2: 在 App 函数中新增用户/角色状态**

搜索 App 函数的状态定义区域。找到:
`[y,g]=(0,Io.useState)({isOpen:!1,order:null})`

在其后插入新状态：
```javascript
,[UM,setUM]=(0,Io.useState)(INIT_USERS),[RM,setRM]=(0,Io.useState)(BUILTIN_ROLES),[CU,setCU]=(0,Io.useState)(INIT_USERS[0])
```

- `UM`/`setUM` = users 数据
- `RM`/`setRM` = roles 数据
- `CU`/`setCU` = 当前登录用户（默认 admin）

同时新增权限检查工具函数（在状态之后、现有 handler 之前）：
```javascript
,hasPerm=L=>{let M=RM.find(O=>O.id===CU.roleId);return M?M.permissions.includes(L):!1}
```

- [ ] **Step 3: 在页面路由区域新增用户管理和角色管理的渲染**

搜索定位字符串:
`e==="release-orders"&&(0,ge.jsx)(Rz,{orders:f,onUpdateOrder:b})`

在其后追加：
```javascript
,e==="user-management"&&(0,ge.jsx)(UserMgmt,{roles:RM,users:UM,onUpdateUsers:setUM}),e==="role-management"&&(0,ge.jsx)(RoleMgmt,{roles:RM,users:UM,onUpdateRoles:setRM})
```

- [ ] **Step 4: 在 App 的 expanded sections 默认值中加入 "system"**

搜索:
`(0,Io.useState)(["data-config","decision-config","risk-control","release-management"])`

替换为:
```javascript
(0,Io.useState)(["data-config","decision-config","risk-control","release-management","system"])
```

- [ ] **Step 5: 验证语法**

- [ ] **Step 6: Commit**

```bash
git add app.js
git commit -m "feat: 侧边栏新增系统管理分组，接入用户/角色页面"
```

---

### Task 5: 权限过滤 — 侧边栏菜单 + 编辑按钮

**Files:**
- Modify: `app.js` — 修改侧边栏渲染逻辑和各列表页的按钮显示

- [ ] **Step 1: 侧边栏菜单过滤**

找到侧边栏菜单渲染逻辑。搜索定位字符串:
`gE.map(L=>{let M=L.key===e`

在 map 回调的开头加入权限过滤逻辑。如果菜单项有 children，过滤掉无权限的子项；如果过滤后没有子项，隐藏整个分组。如果菜单项无 children 且 key 在 MENU_PERM_MAP 中但用户无权限，隐藏该项。

将 `gE.map(L=>{` 替换为：
```javascript
gE.map(L=>{if(L.children){let fL=L.children.filter(cL=>!MENU_PERM_MAP[cL.key]||hasPerm(MENU_PERM_MAP[cL.key]));if(fL.length===0)return null;L={...L,children:fL}}else if(MENU_PERM_MAP[L.key]&&!hasPerm(MENU_PERM_MAP[L.key]))return null;
```

同时在 map 之后加 `.filter(Boolean)` 过滤掉 null 项。找到 `gE.map(L=>{...}).map(` 或者 map 链的末尾，确保返回的 null 被过滤。

注意：如果 gE.map 的结果直接渲染（没有 filter），需要在末尾加 `.filter(Boolean)`。

- [ ] **Step 2: 各列表页编辑按钮权限控制**

需要将 `hasPerm` 函数传递给各列表页组件。但由于现有列表页组件不接受权限 prop，有两种方式：

**方式 A（推荐）：** 将 `hasPerm` 挂到全局变量上，列表页直接调用。在 App 中定义 `hasPerm` 之后：
```javascript
,window.__hasPerm=hasPerm
```

然后在各列表页的"新建"和"编辑"按钮渲染处，用 `window.__hasPerm && !window.__hasPerm(EDIT_PERM_MAP["对应key"])` 判断是否隐藏。

**方式 B：** 在 App 层的路由渲染处，给各列表页传一个 `canEdit` prop。

由于这是原型项目，采用方式 A 更简单，改动最小。

在各列表页组件中，找到"新建"和"编辑"按钮，包装一层权限检查。由于列表页较多（xz, hz, bz, Nz, Tz），需要逐个修改。

每个列表页的修改模式相同：
- 找到"新建"按钮，包装 `window.__hasPerm && window.__hasPerm("对应:edit") &&`
- 找到行级"编辑"按钮，同样包装

具体实现时需读取每个列表页的代码找到按钮位置。

- [ ] **Step 3: 验证**

浏览器验证：
1. 以 admin 登录 → 所有菜单和按钮可见
2. 切换到 viewer → 编辑/新建按钮消失，菜单项中系统管理不可见
3. 切换到 developer → 系统管理中用户/角色编辑按钮不可见

- [ ] **Step 4: Commit**

```bash
git add app.js
git commit -m "feat: 权限过滤 — 侧边栏菜单和编辑按钮"
```

---

### Task 6: 当前用户切换 UI

**Files:**
- Modify: `app.js` — 在侧边栏底部添加用户切换 UI

- [ ] **Step 1: 在侧边栏底部添加当前用户显示 + 切换下拉**

找到侧边栏组件的底部区域。侧边栏是 App 函数内渲染的，找到菜单列表结束后的位置。

在侧边栏的 `</ul>` 或列表区域之后、侧边栏容器关闭之前，插入用户信息区域：

```
当前用户区域:
├── 用户头像（首字母圆形 avatar）
├── 显示名
├── 角色名 badge
└── 切换按钮 → 展开下拉列表
    ├── 用户1 (点击切换)
    ├── 用户2
    └── ...
```

需要新增一个展开/收起状态 `[showUserSwitch, setShowUserSwitch]`。

在 App 的状态区域（Step 2 of Task 4 插入的状态之后）追加：
```javascript
,[SUS,setSUS]=(0,Io.useState)(!1)
```

然后在侧边栏底部渲染用户切换 UI。切换时调用 `setCU(selectedUser)`。

- [ ] **Step 2: 验证**

浏览器验证：
1. 侧边栏底部显示当前用户名 + 角色
2. 点击展开用户列表
3. 点击其他用户 → 切换成功
4. 切换后菜单和按钮权限立即刷新

- [ ] **Step 3: Commit**

```bash
git add app.js
git commit -m "feat: 侧边栏底部当前用户切换 UI"
```

---

### Task 7: 全面浏览器验证

- [ ] **Step 1: 用户管理页面验证**

- [ ] 列表正常显示（4 个 mock 用户）
- [ ] 筛选功能正常（按用户名、角色、状态）
- [ ] 新建用户：填写表单，保存后出现在列表
- [ ] 编辑用户：修改角色，保存后列表更新
- [ ] 删除用户：admin 不可删除，其他可删除
- [ ] 编辑态返回列表正常

- [ ] **Step 2: 角色管理页面验证**

- [ ] 列表正常显示（4 个内置角色）
- [ ] 内置角色：可查看，不可编辑权限，不可删除
- [ ] 查看角色：权限 checkbox 全部 disabled 但正确反映当前权限
- [ ] 新建自定义角色：填写信息 + 勾选权限，保存后出现在列表
- [ ] 编辑自定义角色：修改权限，保存后更新
- [ ] 全选/取消功能正常

- [ ] **Step 3: 权限控制验证**

- [ ] admin 登录：所有菜单可见，所有编辑按钮可见
- [ ] developer 登录：系统管理中用户/角色的编辑按钮不可见
- [ ] release_manager 登录：只有查看权限 + 发布审批
- [ ] viewer 登录：只有查看权限，无编辑/新建按钮
- [ ] 用户切换后立即生效

- [ ] **Step 4: 现有功能回归验证**

- [ ] 接入点/特征/策略/规则/动作的查看/编辑功能不受影响
- [ ] EntityEditor 脏检测、版本切换正常
- [ ] 发布管理流程正常

- [ ] **Step 5: Commit（如有修复）**

```bash
git add app.js
git commit -m "fix: 用户/角色/权限管理修复"
```
