# 用户管理、角色、权限管理设计

## 背景

风控配置平台需要后台管理能力：管理谁能登录平台、谁能编辑规则、谁能审批发布单。权限粒度为操作级（页面 + 操作权限）。

## 目标

- 新增"系统管理"侧边栏分组，包含用户管理和角色管理两个页面
- 四个预置角色：管理员、发布经理、开发者、观察者
- 操作级权限控制：前端模拟权限生效（菜单隐藏、按钮隐藏）
- 当前用户切换功能，方便演示不同角色的权限效果

## 数据模型

### 权限点定义

| 权限分组 | 权限点 | 说明 |
|---------|--------|------|
| 数据配置 | `ep:view` / `ep:edit` | 接入点查看/编辑 |
| 数据配置 | `feature:view` / `feature:edit` | 特征查看/编辑 |
| 决策配置 | `activation:view` / `activation:edit` | 策略查看/编辑 |
| 决策配置 | `rule:view` / `rule:edit` | 规则查看/编辑 |
| 决策配置 | `action:view` / `action:edit` | 动作查看/编辑 |
| 风控策略 | `policy:view` / `policy:edit` | 熔断/护栏策略查看/编辑 |
| 发布管理 | `release:view` / `release:approve` | 发布清单查看/审批发布单 |
| 系统管理 | `user:view` / `user:edit` | 用户管理 |
| 系统管理 | `role:view` / `role:edit` | 角色管理 |

权限点以数组形式定义为常量：

```javascript
const PERMISSION_GROUPS = [
  { key: "data-config", label: "数据配置", permissions: [
    { key: "ep:view", label: "接入点 - 查看" },
    { key: "ep:edit", label: "接入点 - 编辑" },
    { key: "feature:view", label: "特征 - 查看" },
    { key: "feature:edit", label: "特征 - 编辑" },
  ]},
  { key: "decision-config", label: "决策配置", permissions: [
    { key: "activation:view", label: "策略 - 查看" },
    { key: "activation:edit", label: "策略 - 编辑" },
    { key: "rule:view", label: "规则 - 查看" },
    { key: "rule:edit", label: "规则 - 编辑" },
    { key: "action:view", label: "动作 - 查看" },
    { key: "action:edit", label: "动作 - 编辑" },
  ]},
  { key: "risk-control", label: "风控策略", permissions: [
    { key: "policy:view", label: "策略 - 查看" },
    { key: "policy:edit", label: "策略 - 编辑" },
  ]},
  { key: "release-management", label: "发布管理", permissions: [
    { key: "release:view", label: "发布 - 查看" },
    { key: "release:approve", label: "发布 - 审批" },
  ]},
  { key: "system", label: "系统管理", permissions: [
    { key: "user:view", label: "用户 - 查看" },
    { key: "user:edit", label: "用户 - 编辑" },
    { key: "role:view", label: "角色 - 查看" },
    { key: "role:edit", label: "角色 - 编辑" },
  ]},
]
```

### 角色数据

```javascript
{
  id: number,
  name: string,           // 如 "admin", "developer"
  displayName: string,    // 如 "管理员", "开发者"
  description: string,
  permissions: string[],  // 权限点 key 数组
  isBuiltin: boolean,     // 内置角色不可删除
}
```

四个预置角色：

| 角色 | name | 权限 |
|------|------|------|
| 管理员 | admin | 全部权限 |
| 发布经理 | release_manager | 全部 view + `release:approve` |
| 开发者 | developer | 全部 view + 全部 edit（除 `release:approve`、`user:edit`、`role:edit`） |
| 观察者 | viewer | 全部 view |

### 用户数据

```javascript
{
  id: number,
  username: string,       // 登录名
  displayName: string,    // 显示名
  email: string,
  roleId: number,         // 关联角色 ID
  status: 1 | 2,          // 1=启用, 2=禁用
  createAt: string,
  lastLoginAt: string,
}
```

Mock 用户数据（3-5 条）：

| 用户名 | 显示名 | 角色 |
|--------|--------|------|
| admin | 系统管理员 | 管理员 |
| zhang.san | 张三 | 开发者 |
| li.si | 李四 | 发布经理 |
| wang.wu | 王五 | 观察者 |

## 页面设计

### 侧边栏

在现有 gE 菜单数组末尾新增：

```javascript
{
  key: "system",
  label: "系统管理",
  icon: Settings,  // lucide-react Settings 图标
  children: [
    { key: "user-management", label: "用户管理", icon: Users },
    { key: "role-management", label: "角色管理", icon: Shield },
  ]
}
```

### 用户管理页面

独立组件，不使用 EntityEditor。LIST/EDIT 两态。

**LIST 态：**
- 筛选区：用户名搜索、角色下拉筛选、状态筛选
- 新建按钮
- 用户表格：
  - 列：用户名（font-mono）、显示名、邮箱、角色（badge）、状态（启用/禁用 badge）、最后登录、操作（编辑/删除）
  - 内置用户 admin 不可删除

**EDIT 态：**
- 页面内切换（与其他页面一致的 LIST/VIEW 模式），不用弹窗
- 表单字段：
  - 用户名（创建后不可修改）
  - 显示名
  - 邮箱
  - 角色（下拉选择，从角色列表读取）
  - 状态开关
- 保存/取消按钮
- 无脏检测（简单页面不需要）

### 角色管理页面

独立组件，不使用 EntityEditor。LIST/EDIT 两态。

**LIST 态：**
- 角色表格：
  - 列：角色名、描述、权限数量、关联用户数、内置标识（badge）、操作（查看/编辑/删除）
  - 内置角色不可删除，只能查看
- 新建角色按钮

**EDIT 态：**
- 页面内切换
- 上半部分 — 基本信息：
  - 角色名（name，创建后不可修改）
  - 显示名
  - 描述
- 下半部分 — 权限配置：
  - 按 PERMISSION_GROUPS 分组展示
  - 每组一个卡片，标题为分组名
  - 卡片内列出该组的权限点，每个权限点一个 checkbox
  - 分组标题旁有"全选/取消全选"快捷操作
  - 内置角色：checkbox 全部 disabled，仅展示当前权限
- 保存/取消按钮

## 权限生效机制

### 当前用户状态

App 组件新增状态：
- `currentUser` — 当前登录用户对象，默认为 admin
- `hasPermission(permKey)` — 工具函数，检查当前用户的角色是否包含某权限

### 侧边栏菜单过滤

根据当前用户权限过滤菜单项的可见性。映射关系：

| 菜单项 key | 所需权限 |
|------------|---------|
| event-points | `ep:view` |
| feature-list | `feature:view` |
| activations | `activation:view` |
| rules | `rule:view` |
| actions | `action:view` |
| circuit-breakers | `policy:view` |
| guardrails | `policy:view` |
| overrides | `policy:view` |
| release-candidates | `release:view` |
| release-orders | `release:view` |
| user-management | `user:view` |
| role-management | `role:view` |
| dashboard | 无需权限，所有人可见 |

子菜单全部隐藏时，分组也隐藏。

### 编辑按钮控制

各列表页的"新建"和"编辑"按钮根据对应的 edit 权限控制显示：
- 接入点列表：需要 `ep:edit`
- 特征列表：需要 `feature:edit`
- 策略列表：需要 `activation:edit`
- 规则列表：需要 `rule:edit`
- 动作列表：需要 `action:edit`
- 发布单审批：需要 `release:approve`
- 用户管理编辑：需要 `user:edit`
- 角色管理编辑：需要 `role:edit`

无 edit 权限时按钮不显示，但"查看"按钮仍然可见。

### 当前用户切换（演示用）

侧边栏底部显示当前登录用户信息：
- 用户头像（首字母 avatar）
- 显示名
- 角色名 badge
- 点击弹出用户切换下拉，列出所有 mock 用户，点击即切换

切换后立即生效：菜单刷新、按钮权限刷新。

### 不做的事

- 不做路由拦截
- 不做 API 级鉴权
- 不改现有页面内部逻辑，只在入口处控制按钮可见性
- EntityEditor 的 view 模式不受权限影响（有 view 权限就能查看详情）
