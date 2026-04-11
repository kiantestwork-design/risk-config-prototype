# 平台静态 HTML 拆分迁移计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将编译产物 app.js 拆分为多个可读的静态 HTML 页面。已迁移页面（接入点管理、标准属性字典）为本地 JSX HTML，可完全离线运行；未迁移页面通过 legacy-host.html 兼容显示，需联网（过渡方案，非终态）。

**Architecture:** `index.html` 作为平台入口（侧边栏菜单 + iframe 内容区）。每个已迁移页面是独立的 HTML 文件（本地 React 18 + Babel standalone），放在 `pages/` 目录下。React/ReactDOM/Babel 等依赖全部离线化到 `vendor/` 目录，不请求任何外网资源。未迁移页面通过 `legacy-host.html` 加载旧 app.js 渲染（过渡方案，app.js 是编译产物，对其改动是脆弱操作，仅做最小必要修改）。

**Tech Stack:** React 18 UMD（本地 vendor/）、Babel standalone（本地 vendor/）、Tailwind CSS（已有本地 tailwind-cdn.js）、纯静态 HTML

**验收标准：**
- 断网状态下，双击 `index.html`，所有页面正常打开（已迁移页面用本地 vendor/，legacy 页面的 app.js 已内联所有依赖）
- 压缩整个目录发给别人，解压后双击 `index.html`，全部离线可用

**当前 app.js 页面清单（13 个路由）：**

| 路由 Key | 组件 | 大小 | 本次迁移 |
|---------|------|------|---------|
| property-dictionary | PropertyDictionaryPage | ~26K | ✅ 已有 demo |
| event-points | xz + gz | ~52K | ✅ 已有 demo |
| dashboard | ez | ~5K | ❌ legacy 过渡 |
| feature-list | hz | ~22K | ❌ legacy 过渡 |
| activations | bz | ~61K | ❌ legacy 过渡 |
| rules | Nz | ~54K | ❌ legacy 过渡 |
| circuit-breakers | IN | ~54K | ❌ legacy 过渡 |
| guardrails | IN | 同上 | ❌ legacy 过渡 |
| overrides | uz | ~53K | ❌ legacy 过渡 |
| release-candidates | Pz | ~16K | ❌ legacy 过渡 |
| release-orders | Rz | ~209K | ❌ legacy 过渡 |
| user-management | UserMgmt | ~10K | ❌ legacy 过渡 |
| role-management | RoleMgmt | ~22K | ❌ legacy 过渡 |

---

### Task 1: 离线化前端依赖

**Files:**
- Create: `vendor/react.production.min.js`
- Create: `vendor/react-dom.production.min.js`
- Create: `vendor/babel.min.js`

- [ ] **Step 1: 下载 React 18 UMD + Babel standalone 到 vendor/**

```bash
mkdir -p vendor
curl -Lo vendor/react.production.min.js "https://unpkg.com/react@18/umd/react.production.min.js"
curl -Lo vendor/react-dom.production.min.js "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"
curl -Lo vendor/babel.min.js "https://unpkg.com/@babel/standalone/babel.min.js"
```

- [ ] **Step 2: 验证文件完整性**

```bash
wc -c vendor/*.js
# 预期：react ~11K, react-dom ~132K, babel ~3.1M
```

- [ ] **Step 3: Commit**

```bash
git add vendor/
git commit -m "feat: 离线化前端依赖（React 18 + Babel standalone → vendor/）"
```

---

### Task 2: 创建平台入口（index.html 改造）

**Files:**
- Rename: `index.html` → `legacy-host.html`（旧入口保留为 legacy 宿主）
- Create: `index.html`（新的平台入口，侧边栏 + iframe）

- [ ] **Step 1: 备份旧 index.html**

```bash
cp index.html legacy-host.html
```

- [ ] **Step 2: 创建新的 index.html — 侧边栏 + iframe 布局**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>风控配置平台</title>
  <script src="./tailwind-cdn.js"></script>
  <link rel="stylesheet" href="./index.css" />
  <style>
    body { margin: 0; font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif; }
    .menu-item { display: flex; align-items: center; padding: 8px 16px 8px 24px; color: rgba(255,255,255,0.65); font-size: 14px; cursor: pointer; transition: all 0.2s; text-decoration: none; }
    .menu-item:hover { color: #fff; background: rgba(255,255,255,0.08); }
    .menu-item.active { color: #fff; background: #1890ff; }
    .menu-group { padding: 12px 16px 4px 16px; font-size: 12px; color: rgba(255,255,255,0.35); letter-spacing: 0.5px; }
  </style>
</head>
<body class="bg-[#f0f2f5]">
  <div style="display:flex; height:100vh;">
    <!-- 侧边栏 -->
    <div id="sidebar" style="width:220px; background:#001529; flex-shrink:0; display:flex; flex-direction:column; overflow-y:auto;">
      <div style="padding:16px 20px; color:#fff; font-size:16px; font-weight:600; border-bottom:1px solid rgba(255,255,255,0.1);">
        风控配置平台
      </div>
      <nav id="menu"></nav>
    </div>
    <!-- 主内容区 -->
    <div style="flex:1; display:flex; flex-direction:column; min-width:0;">
      <div style="height:48px; background:#fff; border-bottom:1px solid #f0f0f0; display:flex; align-items:center; padding:0 24px; flex-shrink:0;">
        <span id="page-title" style="font-size:16px; font-weight:600; color:rgba(0,0,0,0.88);"></span>
        <div style="margin-left:auto; display:flex; align-items:center; gap:12px;">
          <span style="font-size:12px; background:#f6ffed; color:#52c41a; padding:2px 8px; border-radius:4px; border:1px solid #b7eb8f;">生产环境</span>
          <span style="font-size:12px; color:rgba(0,0,0,0.45);">v2.5.0</span>
        </div>
      </div>
      <iframe id="content-frame" style="flex:1; border:none; width:100%;" src="about:blank"></iframe>
    </div>
  </div>

  <script>
    var MENU = [
      { group: '数据配置', items: [
        { key: 'property-dictionary', label: '标准属性字典', page: 'pages/property-dictionary.html' },
        { key: 'event-points', label: '接入点管理', page: 'pages/entry-points.html' },
        { key: 'feature-list', label: '特征管理', page: 'legacy-host.html?page=feature-list' },
      ]},
      { group: '决策配置', items: [
        { key: 'activations', label: '策略管理', page: 'legacy-host.html?page=activations' },
        { key: 'rules', label: '规则管理', page: 'legacy-host.html?page=rules' },
      ]},
      { group: '风控策略', items: [
        { key: 'circuit-breakers', label: '服务熔断策略', page: 'legacy-host.html?page=circuit-breakers' },
        { key: 'guardrails', label: '业务护栏策略', page: 'legacy-host.html?page=guardrails' },
        { key: 'overrides', label: '手动干预管理', page: 'legacy-host.html?page=overrides' },
      ]},
      { group: '发布管理', items: [
        { key: 'release-candidates', label: '待发布清单', page: 'legacy-host.html?page=release-candidates' },
        { key: 'release-orders', label: '发布单列表', page: 'legacy-host.html?page=release-orders' },
      ]},
      { group: '系统管理', items: [
        { key: 'user-management', label: '用户管理', page: 'legacy-host.html?page=user-management' },
        { key: 'role-management', label: '角色管理', page: 'legacy-host.html?page=role-management' },
      ]},
    ];

    var activeKey = 'event-points';

    function renderMenu() {
      var nav = document.getElementById('menu');
      nav.innerHTML = MENU.map(function(group) {
        return '<div class="menu-group">' + group.group + '</div>' +
          group.items.map(function(item) {
            return '<a class="menu-item ' + (item.key === activeKey ? 'active' : '') + '"' +
              ' data-key="' + item.key + '" data-page="' + item.page + '" data-label="' + item.label + '"' +
              ' onclick="navigate(this)">' + item.label + '</a>';
          }).join('');
      }).join('');
    }

    function navigate(el) {
      activeKey = el.dataset.key;
      document.getElementById('content-frame').src = el.dataset.page;
      document.getElementById('page-title').textContent = el.dataset.label;
      renderMenu();
    }

    // 子页面调用：跳转到指定菜单页
    window.navigateTo = function(key, params) {
      var allItems = MENU.reduce(function(acc, g) { return acc.concat(g.items); }, []);
      var item = allItems.find(function(i) { return i.key === key; });
      if (item) {
        activeKey = key;
        var url = item.page;
        if (params) url += (url.indexOf('?') >= 0 ? '&' : '?') + new URLSearchParams(params).toString();
        document.getElementById('content-frame').src = url;
        document.getElementById('page-title').textContent = item.label;
        renderMenu();
      }
    };

    // 子页面调用：打开接入点编辑页
    window.openEntryPointDetail = function(epCode) {
      document.getElementById('content-frame').src = 'pages/entry-point-edit.html?ep=' + epCode;
      document.getElementById('page-title').textContent = '接入点详情 - ' + epCode;
    };

    // 初始加载
    renderMenu();
    var defaultItem = MENU.reduce(function(acc, g) { return acc.concat(g.items); }, []).find(function(i) { return i.key === activeKey; });
    if (defaultItem) {
      document.getElementById('content-frame').src = defaultItem.page;
      document.getElementById('page-title').textContent = defaultItem.label;
    }
  </script>
</body>
</html>
```

- [ ] **Step 3: 确认 index.html 可以打开并显示侧边栏**

双击 `index.html`，确认左侧深色菜单正常渲染，菜单点击切换高亮。

- [ ] **Step 4: Commit**

```bash
git add index.html legacy-host.html
git commit -m "feat: index.html改造为平台外壳，旧入口保留为legacy-host.html"
```

---

### Task 3: 迁移接入点列表页

**Files:**
- Create: `pages/entry-points.html`

从 app.js 中的 `xz` 组件逻辑重写为可读 JSX。引用本地 vendor/ 依赖。

- [ ] **Step 1: 创建 pages/entry-points.html**

创建接入点列表页面，包含：
- 搜索栏（编码/描述搜索 + 状态筛选下拉）
- 表格（接入点信息、关联策略数、运行状态、更新时间、操作列）
- 操作列：编辑（跳转到 entry-point-edit.html）、删除（ConfirmPopover 确认）
- Mock 数据：5 个接入点
- 点击接入点编码或"编辑"：调用 `parent.openEntryPointDetail(epCode)`（在 iframe 中）或 `window.location.href`（独立打开时）

所有 script 标签引用 `../vendor/` 下的本地文件，不引用任何 CDN：

```html
<script src="../vendor/react.production.min.js"></script>
<script src="../vendor/react-dom.production.min.js"></script>
<script src="../vendor/babel.min.js"></script>
<script src="../tailwind-cdn.js"></script>
```

完整代码参考 Task 2 原计划中的 entry-points.html 模板，将 CDN 路径替换为 `../vendor/`。

- [ ] **Step 2: 断网验证**

断开网络，双击 `pages/entry-points.html`，确认页面正常显示。

- [ ] **Step 3: 在 index.html iframe 中验证**

双击 `index.html` → 点击"接入点管理" → 确认列表正常加载。

- [ ] **Step 4: Commit**

```bash
git add pages/entry-points.html
git commit -m "feat: 接入点列表页（可读JSX，离线可运行）"
```

---

### Task 4: 迁移接入点编辑/详情页

**Files:**
- Create: `pages/entry-point-edit.html`（基于 ep-detail-demo.html 改造）

- [ ] **Step 1: 基于 ep-detail-demo.html 创建 pages/entry-point-edit.html**

复制 `ep-detail-demo.html` 为 `pages/entry-point-edit.html`，做以下修改：

1. CDN 引用改为本地 vendor/：
   ```html
   <script src="../vendor/react.production.min.js"></script>
   <script src="../vendor/react-dom.production.min.js"></script>
   <script src="../vendor/babel.min.js"></script>
   <script src="../tailwind-cdn.js"></script>
   ```
2. tailwind-cdn.js 和 index.css 路径加 `../` 前缀
3. "基础信息" Tab 改为可编辑表单（接入点编码只读，描述/状态可编辑）
4. 增加"返回列表"按钮（调用 `parent.navigateTo('event-points')` 或 `window.history.back()`）
5. 去掉 EP 切换按钮（从 URL 参数读取 EP 编码，不需要手动切换）
6. 移除 debug 用的 `window.onerror` 红色报错（改为 console.error）

- [ ] **Step 2: 验证列表→编辑跳转**

在 index.html 中：接入点管理 → 点击接入点编码 → iframe 加载编辑页 → 4 个 Tab 正常显示

- [ ] **Step 3: 断网验证**

断开网络验证：
- 双击 `pages/entry-point-edit.html` 独立打开，确认以默认 Mock EP 正常渲染
- 通过 `index.html` → 接入点管理 → 点击编辑，确认 iframe 内 `entry-point-edit.html?ep=EP00010001` 正常加载

- [ ] **Step 4: Commit**

```bash
git add pages/entry-point-edit.html
git commit -m "feat: 接入点编辑页（基础信息+属性提取+场景编排+变更集，离线可运行）"
```

---

### Task 5: 迁移标准属性字典页

**Files:**
- Create: `pages/property-dictionary.html`（基于 property-dictionary-demo.html 改造）

- [ ] **Step 1: 基于 property-dictionary-demo.html 创建 pages/property-dictionary.html**

复制并修改：
1. CDN 引用改为本地 vendor/（同上）
2. tailwind-cdn.js 和 index.css 路径加 `../` 前缀
3. React 19 → React 18（已知 React 19 无 UMD 构建）
4. `ReactDOM.createRoot` → `ReactDOM.render`

- [ ] **Step 2: 断网验证**

断开网络，双击 `pages/property-dictionary.html`，确认页面正常显示。

- [ ] **Step 3: Commit**

```bash
git add pages/property-dictionary.html
git commit -m "feat: 标准属性字典页（可读JSX，离线可运行）"
```

---

### Task 6: 创建 legacy 兼容宿主

**Files:**
- Modify: `legacy-host.html`（从旧 index.html 改造，支持 URL 参数指定页面）
- Modify: `app.js`（最小改动：读取 URL 参数设置默认页面 + 隐藏侧边栏和顶部栏，只保留内容区）

**注意：对 app.js 的改动是过渡方案，不是终态。app.js 是编译产物，改动脆弱，仅做最小必要修改。随着后续页面逐个迁移为独立 HTML，legacy-host.html 和 app.js 最终会被完全移除。**

- [ ] **Step 1: 修改 legacy-host.html**

在 `<script src="./app.js"></script>` 前面加一段脚本，设置全局标志：

```html
<script>
  var params = new URLSearchParams(window.location.search);
  var targetPage = params.get('page');
  if (targetPage) {
    window.__LEGACY_PAGE__ = targetPage;
    window.__LEGACY_MODE__ = true;
  }
</script>
```

- [ ] **Step 2: 修改 app.js — 两处最小改动**

改动 1：默认页面从 "dashboard" 改为读取 URL 参数。找到初始化 state 的位置（`useState("dashboard")` 用于页面路由的那一行），改为：

```javascript
// 找到: (0,ln.useState)("dashboard")  — 这是页面路由的默认值
// 改为: (0,ln.useState)(window.__LEGACY_PAGE__||"dashboard")
```

改动 2：当 `__LEGACY_MODE__` 为 true 时隐藏侧边栏和顶部栏，只保留页面内容区（因为 legacy 页面运行在 index.html 的 iframe 内，外层已经有菜单和顶栏，iframe 内不能重复显示）。找到侧边栏容器和顶部栏容器，分别加 `style={window.__LEGACY_MODE__?{display:"none"}:{}}` 条件隐藏。

具体定位方法：在 app.js 中搜索 `"dashboard"` 找到路由初始化的 useState 调用，搜索 `width:220` 或 `#001529` 找到侧边栏，搜索 `h-16` 或 `header` 找到顶部栏。

- [ ] **Step 3: 验证 legacy 页面**

```bash
node -c app.js  # 语法检查通过
```

在 index.html 中点击"特征管理"/"策略管理"等未迁移菜单项，确认通过 legacy-host.html 正常显示。

- [ ] **Step 4: Commit**

```bash
git add legacy-host.html app.js
git commit -m "feat: legacy兼容宿主（过渡方案，未迁移页面通过app.js显示）"
```

---

### Task 7: 全流程验证 + 清理

**Files:**
- 可能修改: `index.html`（微调）
- 删除: 旧的 demo 文件不删除，保留作为参考

- [ ] **Step 1: 离线全流程验证**

断开网络，双击 `index.html`，依次验证：

1. ✅ 侧边栏菜单正常渲染
2. ✅ 点击"接入点管理" → 列表页正常显示 5 个接入点
3. ✅ 点击接入点编码 → 跳转到编辑页，4 个 Tab（基础信息/属性提取/场景编排/变更集）正常
4. ✅ 编辑页点"返回列表" → 回到接入点列表
5. ✅ 点击"标准属性字典" → 正常显示属性列表
6. ✅ 以上操作全程无外网请求

联网后：
7. ✅ 点击"特征管理"等未迁移菜单项 → 通过 legacy-host.html 正常显示

独立验证：
8. ✅ 双击 `pages/entry-points.html` → 独立打开正常
9. ✅ 双击 `pages/entry-point-edit.html` → 独立打开正常
10. ✅ 双击 `pages/property-dictionary.html` → 独立打开正常

- [ ] **Step 2: 目录结构确认**

最终目录结构应为：

```
risk-config-prototype/
├── index.html                    ← 新的平台入口（双击打开）
├── legacy-host.html              ← 旧入口（legacy 页面宿主）
├── app.js                        ← 旧编译产物（legacy 页面渲染）
├── tailwind-cdn.js               ← Tailwind CSS（已有本地文件）
├── index.css                     ← 样式
├── vendor/                       ← 离线化依赖
│   ├── react.production.min.js
│   ├── react-dom.production.min.js
│   └── babel.min.js
├── pages/                        ← 已迁移的静态 HTML 页面（可读 JSX 源码）
│   ├── entry-points.html         ← 接入点列表
│   ├── entry-point-edit.html     ← 接入点编辑（基础信息+属性提取+场景编排+变更集）
│   └── property-dictionary.html  ← 标准属性字典
├── ep-detail-demo.html           ← 旧 demo（保留参考，不再使用）
├── property-dictionary-demo.html ← 旧 demo（保留参考，不再使用）
└── docs/                         ← 文档
```

- [ ] **Step 3: Commit + Push**

```bash
git add .
git commit -m "feat: 平台静态HTML拆分完成（index.html入口+pages子页面+legacy过渡）"
git push
```

---

## 后续迁移（不在本次计划范围内）

每个旧页面按需迁移为 `pages/xxx.html`，步骤统一：
1. 从 app.js 中分析对应组件的逻辑和 Mock 数据
2. 用 JSX 源码重写为 `pages/xxx.html`（引用 `../vendor/` 本地依赖）
3. 更新 `index.html` 菜单配置，将 `legacy-host.html?page=xxx` 改为 `pages/xxx.html`
4. 断网测试 + 提交

全部页面迁移完成后，`legacy-host.html` 和 `app.js` 可以安全删除。
