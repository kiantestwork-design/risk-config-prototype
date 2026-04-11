# 平台静态 HTML 拆分迁移计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将编译产物 app.js 拆分为多个可读的静态 HTML 页面，保持双击即可运行，所有页面通过统一的外壳框架导航。

**Architecture:** 创建一个轻量的 index.html 外壳（侧边栏菜单 + iframe 内容区），每个页面是独立的 HTML 文件（React 18 CDN + Babel standalone），放在 `pages/` 目录下。外壳通过 iframe 加载子页面，菜单点击切换 iframe src。子页面之间通过 URL 参数传递数据（如接入点编码）。

**Tech Stack:** React 18 UMD CDN、Babel standalone、Tailwind CSS CDN、纯静态 HTML（双击可运行）

**当前 app.js 页面清单（13 个路由）：**

| 路由 Key | 组件 | 大小 | 迁移优先级 |
|---------|------|------|----------|
| dashboard | ez | ~5K | P2 |
| property-dictionary | PropertyDictionaryPage | ~26K | P0（已有 demo） |
| event-points | xz + gz | ~52K | P0（已有 demo） |
| feature-list | hz | ~22K | P1 |
| activations | bz | ~61K | P1 |
| rules | Nz | ~54K | P1 |
| circuit-breakers | IN | ~54K（共用） | P2 |
| guardrails | IN | 同上 | P2 |
| overrides | uz | ~53K | P2 |
| release-candidates | Pz | ~16K | P1 |
| release-orders | Rz | ~209K | P1 |
| user-management | UserMgmt | ~10K | P2 |
| role-management | RoleMgmt | ~22K | P2 |

**共享组件：** EntityEditorShell (~115K) — 通用编辑器，被接入点、特征、策略、规则等多个页面使用。

**迁移策略：** 分阶段进行。第一阶段先搭建外壳 + 迁移已有 demo 的页面（接入点、属性字典），未迁移的页面通过 iframe 指向旧的 app.js 临时页面。

---

### Task 1: 创建外壳框架（Shell）

**Files:**
- Create: `shell.html`（新的主入口，替代 index.html）
- Keep: `index.html`（保留旧版不动，作为未迁移页面的宿主）

- [ ] **Step 1: 创建 shell.html — 侧边栏 + iframe 布局**

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
    .menu-group { padding: 12px 16px 4px 16px; font-size: 12px; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.5px; }
    .menu-item .icon { width: 16px; height: 16px; margin-right: 8px; opacity: 0.65; }
    .menu-item.active .icon { opacity: 1; }
  </style>
</head>
<body class="bg-[#f0f2f5]">
  <div style="display:flex; height:100vh;">
    <!-- 侧边栏 -->
    <div id="sidebar" style="width:220px; background:#001529; flex-shrink:0; display:flex; flex-direction:column; overflow-y:auto;">
      <!-- Logo -->
      <div style="padding:16px 20px; color:#fff; font-size:16px; font-weight:600; border-bottom:1px solid rgba(255,255,255,0.1);">
        风控配置平台
      </div>
      <!-- 菜单由 JS 渲染 -->
      <nav id="menu"></nav>
    </div>

    <!-- 主内容区 -->
    <div style="flex:1; display:flex; flex-direction:column; min-width:0;">
      <!-- 顶部栏 -->
      <div style="height:48px; background:#fff; border-bottom:1px solid #f0f0f0; display:flex; align-items:center; padding:0 24px; flex-shrink:0;">
        <span id="page-title" style="font-size:16px; font-weight:600; color:rgba(0,0,0,0.88);"></span>
        <div style="margin-left:auto; display:flex; align-items:center; gap:12px;">
          <span style="font-size:12px; color:rgba(0,0,0,0.45); background:#f6ffed; color:#52c41a; padding:2px 8px; border-radius:4px; border:1px solid #b7eb8f;">生产环境</span>
          <span style="font-size:12px; color:rgba(0,0,0,0.45);">v2.5.0</span>
        </div>
      </div>
      <!-- iframe 内容区 -->
      <iframe id="content-frame" style="flex:1; border:none; width:100%;" src="about:blank"></iframe>
    </div>
  </div>

  <script>
    // ============================================================
    //  菜单配置
    // ============================================================
    const MENU = [
      { group: '数据配置', items: [
        { key: 'property-dictionary', label: '标准属性字典', page: 'pages/property-dictionary.html' },
        { key: 'event-points', label: '接入点管理', page: 'pages/entry-points.html' },
        { key: 'feature-list', label: '特征管理', page: 'legacy.html?page=feature-list' },
      ]},
      { group: '决策配置', items: [
        { key: 'activations', label: '策略管理', page: 'legacy.html?page=activations' },
        { key: 'rules', label: '规则管理', page: 'legacy.html?page=rules' },
      ]},
      { group: '风控策略', items: [
        { key: 'circuit-breakers', label: '服务熔断策略', page: 'legacy.html?page=circuit-breakers' },
        { key: 'guardrails', label: '业务护栏策略', page: 'legacy.html?page=guardrails' },
        { key: 'overrides', label: '手动干预管理', page: 'legacy.html?page=overrides' },
      ]},
      { group: '发布管理', items: [
        { key: 'release-candidates', label: '待发布清单', page: 'legacy.html?page=release-candidates' },
        { key: 'release-orders', label: '发布单列表', page: 'legacy.html?page=release-orders' },
      ]},
      { group: '系统管理', items: [
        { key: 'user-management', label: '用户管理', page: 'legacy.html?page=user-management' },
        { key: 'role-management', label: '角色管理', page: 'legacy.html?page=role-management' },
      ]},
    ];

    let activeKey = 'event-points';

    function renderMenu() {
      const nav = document.getElementById('menu');
      nav.innerHTML = MENU.map(group => `
        <div class="menu-group">${group.group}</div>
        ${group.items.map(item => `
          <a class="menu-item ${item.key === activeKey ? 'active' : ''}"
             data-key="${item.key}" data-page="${item.page}" data-label="${item.label}"
             onclick="navigate(this)">
            ${item.label}
          </a>
        `).join('')}
      `).join('');
    }

    function navigate(el) {
      activeKey = el.dataset.key;
      document.getElementById('content-frame').src = el.dataset.page;
      document.getElementById('page-title').textContent = el.dataset.label;
      renderMenu();
    }

    // 子页面可以通过 parent.navigateTo(key) 触发导航
    window.navigateTo = function(key, params) {
      const allItems = MENU.flatMap(g => g.items);
      const item = allItems.find(i => i.key === key);
      if (item) {
        activeKey = key;
        let url = item.page;
        if (params) url += (url.includes('?') ? '&' : '?') + new URLSearchParams(params).toString();
        document.getElementById('content-frame').src = url;
        document.getElementById('page-title').textContent = item.label;
        renderMenu();
      }
    };

    // 子页面导航到接入点详情
    window.openEntryPointDetail = function(epCode) {
      document.getElementById('content-frame').src = 'pages/entry-point-edit.html?ep=' + epCode;
      document.getElementById('page-title').textContent = '接入点详情';
    };

    // 初始加载
    renderMenu();
    const defaultItem = MENU.flatMap(g => g.items).find(i => i.key === activeKey);
    if (defaultItem) {
      document.getElementById('content-frame').src = defaultItem.page;
      document.getElementById('page-title').textContent = defaultItem.label;
    }
  </script>
</body>
</html>
```

- [ ] **Step 2: 创建 pages/ 目录**

```bash
mkdir -p pages
```

- [ ] **Step 3: 确认 shell.html 可以打开并显示侧边栏**

双击 `shell.html`，确认：
- 左侧深色侧边栏显示完整菜单
- 右侧内容区显示空白（子页面还没创建）
- 菜单点击高亮切换

- [ ] **Step 4: Commit**

```bash
git add shell.html
git commit -m "feat: 创建平台外壳框架（侧边栏菜单+iframe内容区）"
```

---

### Task 2: 迁移接入点列表页

**Files:**
- Create: `pages/entry-points.html`

从 app.js 中的 `xz` 组件（~52K，接入点列表）提取出来，用 JSX 源码重写。这个页面包含：接入点列表表格、搜索筛选、批量操作、新增/编辑（跳转到详情页）。

- [ ] **Step 1: 创建 pages/entry-points.html**

基于 demo HTML 模式（React 18 CDN + Babel standalone），创建接入点列表页。包含：
- 搜索栏（编码搜索、描述搜索、生命周期筛选、状态筛选）
- 表格（接入点信息、关联策略数、运行状态、更新时间、操作列）
- 操作列：查看、编辑（跳转到 entry-point-edit.html）、删除
- 批量操作（发布、启用、禁用、删除）
- 新增按钮
- Mock 数据：至少 5 个接入点（登录风控、App提现、注册风控、充值风控、交易风控）

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>接入点管理</title>
  <script src="../tailwind-cdn.js"></script>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <link rel="stylesheet" href="../index.css" />
  <style>
    body { background: #f0f2f5; color: rgba(0,0,0,0.88); font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif; }
    .confirm-popover {
      position: absolute; right: 0; top: 100%; z-index: 10; margin-top: 4px;
      background: white; border-radius: 8px; padding: 12px 16px; white-space: nowrap;
      box-shadow: 0 6px 16px rgba(0,0,0,0.08), 0 3px 6px -4px rgba(0,0,0,0.12), 0 9px 28px 8px rgba(0,0,0,0.05);
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>window.onerror=function(m,s,l,c,e){document.getElementById('root').innerHTML='<pre style="color:red;padding:20px">'+m+'\nLine:'+l+'</pre>';}</script>
  <script type="text/babel">
    const { useState, useMemo } = React;

    /* Mock 数据 */
    const MOCK_ENTRY_POINTS = [
      { id: 1, eventPoint: 'EP00010001', description: '用户登录行为风控检测', status: 1, lifecycleState: 'PUBLISHED', relatedPolicies: 3, updateAt: '2026-04-01 10:00:00', operator: 'zhang.san' },
      { id: 2, eventPoint: 'EP00000005', description: 'App端提现风控检测', status: 1, lifecycleState: 'PUBLISHED', relatedPolicies: 2, updateAt: '2026-04-02 14:30:00', operator: 'li.si' },
      { id: 3, eventPoint: 'EP00020001', description: '新用户注册风控检测', status: 1, lifecycleState: 'DRAFT', relatedPolicies: 0, updateAt: '2026-04-05 09:15:00', operator: 'wang.wu' },
      { id: 4, eventPoint: 'EP00030001', description: '法币充值风控检测', status: 2, lifecycleState: 'PUBLISHED', relatedPolicies: 1, updateAt: '2026-03-28 16:00:00', operator: 'zhang.san' },
      { id: 5, eventPoint: 'EP00040001', description: 'P2P交易风控检测', status: 1, lifecycleState: 'DRAFT', relatedPolicies: 0, updateAt: '2026-04-08 11:20:00', operator: 'li.si' },
    ];

    /* 状态标签 */
    function StatusBadge({ status, lifecycleState }) {
      if (lifecycleState === 'PUBLISHED' && status === 1) return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs whitespace-nowrap text-[#52c41a] bg-[#f6ffed] border border-[#52c41a30]"><span className="w-1.5 h-1.5 rounded-full bg-[#52c41a] mr-1.5"></span>运行中</span>;
      if (lifecycleState === 'PUBLISHED' && status === 2) return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs whitespace-nowrap text-[rgba(0,0,0,0.45)] bg-[#f5f5f5] border border-[rgba(0,0,0,0.06)]"><span className="w-1.5 h-1.5 rounded-full bg-[rgba(0,0,0,0.25)] mr-1.5"></span>已停用</span>;
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs whitespace-nowrap text-[#faad14] bg-[#fffbe6] border border-[#faad1430]"><span className="w-1.5 h-1.5 rounded-full bg-[#faad14] mr-1.5"></span>未发布</span>;
    }

    /* 确认弹框 */
    function ConfirmPopover({ visible, onConfirm, onCancel, message }) {
      if (!visible) return null;
      return (
        <div className="confirm-popover">
          <div className="text-sm text-[rgba(0,0,0,0.88)] mb-2 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-[#faad14] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
            {message}
          </div>
          <div className="flex justify-end gap-2">
            <button className="h-6 px-2 text-xs rounded border border-[#d9d9d9] bg-white text-[rgba(0,0,0,0.65)] hover:border-[#1890ff] hover:text-[#1890ff] transition-colors" onClick={onCancel}>取消</button>
            <button className="h-6 px-2 text-xs rounded bg-[#ff4d4f] text-white border-none hover:bg-[#ff7875] transition-colors" onClick={onConfirm}>确认</button>
          </div>
        </div>
      );
    }

    /* 主组件 */
    function EntryPointList() {
      const [data, setData] = useState(MOCK_ENTRY_POINTS.map(d => ({...d})));
      const [filter, setFilter] = useState({ code: '', status: 'ALL' });
      const [deleteConfirmId, setDeleteConfirmId] = useState(null);

      const filtered = useMemo(() => data.filter(ep => {
        if (filter.code && !ep.eventPoint.toLowerCase().includes(filter.code.toLowerCase()) && !ep.description.includes(filter.code)) return false;
        if (filter.status !== 'ALL') {
          if (filter.status === 'running' && !(ep.lifecycleState === 'PUBLISHED' && ep.status === 1)) return false;
          if (filter.status === 'stopped' && !(ep.lifecycleState === 'PUBLISHED' && ep.status === 2)) return false;
          if (filter.status === 'draft' && ep.lifecycleState !== 'DRAFT') return false;
        }
        return true;
      }), [data, filter]);

      const handleDelete = (id) => {
        setData(data.filter(d => d.id !== id));
        setDeleteConfirmId(null);
      };

      const openDetail = (epCode) => {
        // 如果在 shell 的 iframe 中，调用父级导航
        if (window.parent && window.parent.openEntryPointDetail) {
          window.parent.openEntryPointDetail(epCode);
        } else {
          // 独立打开
          window.location.href = 'entry-point-edit.html?ep=' + epCode;
        }
      };

      return (
        <div className="max-w-[1600px] mx-auto p-6">
          {/* 搜索栏 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <input
                type="text" placeholder="搜索编码或描述"
                className="border border-[#d9d9d9] rounded-md px-3 h-8 text-sm outline-none bg-white focus:border-[#1890ff] focus:shadow-[0_0_0_2px_rgba(24,144,255,0.2)] transition-colors w-64"
                value={filter.code} onChange={e => setFilter({...filter, code: e.target.value})}
              />
              <select
                className="border border-[#d9d9d9] rounded-md px-3 h-8 text-sm outline-none bg-white focus:border-[#1890ff] transition-colors"
                value={filter.status} onChange={e => setFilter({...filter, status: e.target.value})}
              >
                <option value="ALL">全部状态</option>
                <option value="running">运行中</option>
                <option value="stopped">已停用</option>
                <option value="draft">未发布</option>
              </select>
            </div>
            <button className="h-8 px-4 text-sm rounded-md bg-[#1890ff] text-white border-none hover:bg-[#40a9ff] transition-colors flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              新增接入点
            </button>
          </div>

          {/* 表格 */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full" style={{ tableLayout: 'auto' }}>
              <thead>
                <tr className="bg-[#fafafa] border-b border-[#f0f0f0]">
                  <th className="px-3 py-3 text-left text-xs font-medium text-[rgba(0,0,0,0.65)]">接入点信息</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-[rgba(0,0,0,0.65)]">关联策略</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-[rgba(0,0,0,0.65)] w-[90px]">运行状态</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-[rgba(0,0,0,0.65)]">更新时间</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-[rgba(0,0,0,0.65)] w-[100px]">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(ep => (
                  <tr key={ep.id} className="border-b border-[#f0f0f0] hover:bg-[#fafafa] transition-colors">
                    <td className="px-3 py-3">
                      <div className="text-sm text-[#1890ff] cursor-pointer hover:underline font-mono" onClick={() => openDetail(ep.eventPoint)}>{ep.eventPoint}</div>
                      <div className="text-xs text-[rgba(0,0,0,0.45)] mt-0.5">{ep.description}</div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-sm text-[rgba(0,0,0,0.65)]">{ep.relatedPolicies} 个</span>
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={ep.status} lifecycleState={ep.lifecycleState} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-sm text-[rgba(0,0,0,0.65)]">{ep.updateAt.split(' ')[0]}</div>
                      <div className="text-xs text-[rgba(0,0,0,0.45)]">{ep.operator}</div>
                    </td>
                    <td className="px-3 py-3 text-center w-[100px]">
                      <div className="relative inline-flex items-center gap-2">
                        <button className="text-xs text-[#1890ff] hover:text-[#40a9ff] transition-colors" onClick={() => openDetail(ep.eventPoint)}>编辑</button>
                        <button className="text-xs text-[#ff4d4f] hover:text-[#ff7875] transition-colors" onClick={() => setDeleteConfirmId(ep.id)}>删除</button>
                        <ConfirmPopover
                          visible={deleteConfirmId === ep.id}
                          onConfirm={() => handleDelete(ep.id)}
                          onCancel={() => setDeleteConfirmId(null)}
                          message="确认删除该接入点？"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="px-3 py-8 text-center text-sm text-[rgba(0,0,0,0.25)]">暂无数据</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    ReactDOM.render(<EntryPointList />, document.getElementById('root'));
  </script>
</body>
</html>
```

- [ ] **Step 2: 确认页面独立可运行**

双击 `pages/entry-points.html`，确认表格正常显示 5 个接入点。

- [ ] **Step 3: 确认在 shell 中正常加载**

双击 `shell.html`，点击"接入点管理"菜单，确认 iframe 中正常显示列表页。

- [ ] **Step 4: Commit**

```bash
git add pages/entry-points.html
git commit -m "feat: 接入点列表页静态HTML（从app.js迁移）"
```

---

### Task 3: 迁移接入点编辑/详情页

**Files:**
- Create: `pages/entry-point-edit.html`（基于现有 ep-detail-demo.html，增加基础信息可编辑表单）

- [ ] **Step 1: 复制 ep-detail-demo.html 到 pages/ 并改造**

将现有的 `ep-detail-demo.html` 复制为 `pages/entry-point-edit.html`，做以下修改：
1. CDN 路径加 `../` 前缀（`../tailwind-cdn.js`、`../index.css`）
2. "基础信息" Tab 改为可编辑表单（输入框替代只读展示）
3. 增加"返回列表"按钮，点击调用 `parent.navigateTo('event-points')`
4. 增加"保存"按钮
5. EP 切换按钮改为从 URL 参数读取 EP，不显示切换按钮

- [ ] **Step 2: 确认接入点列表页点击"编辑"能跳转到编辑页**

在 shell.html 中：接入点管理 → 点击编辑 → iframe 加载 entry-point-edit.html?ep=EP00010001

- [ ] **Step 3: Commit**

```bash
git add pages/entry-point-edit.html
git commit -m "feat: 接入点编辑页静态HTML（基础信息+属性提取+场景编排+变更集）"
```

---

### Task 4: 迁移标准属性字典页

**Files:**
- Create: `pages/property-dictionary.html`（基于现有 property-dictionary-demo.html）

- [ ] **Step 1: 复制 property-dictionary-demo.html 到 pages/ 并调整路径**

将 `property-dictionary-demo.html` 复制为 `pages/property-dictionary.html`，修改：
1. CDN 路径加 `../` 前缀
2. React 19 改为 React 18（同 ep-detail-demo.html 的修复）
3. `ReactDOM.createRoot` 改为 `ReactDOM.render`

- [ ] **Step 2: 确认在 shell 中正常加载**

- [ ] **Step 3: Commit**

```bash
git add pages/property-dictionary.html
git commit -m "feat: 标准属性字典页静态HTML（从demo迁移到pages/）"
```

---

### Task 5: 创建旧版兼容页面

**Files:**
- Create: `legacy.html`（加载 app.js，但只显示指定页面的内容区，不显示菜单）

未迁移的页面（特征管理、策略、规则、发布单等）暂时通过 legacy.html 加载旧的 app.js 渲染。

- [ ] **Step 1: 创建 legacy.html**

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
    body { background: #f0f2f5; color: #0f172a; font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif; }
    .expand-section { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.3s ease; }
    .expand-section.open { grid-template-rows: 1fr; }
    .expand-inner { overflow: hidden; }
    .confirm-popover {
      position: absolute; right: 0; top: 100%; z-index: 10; margin-top: 4px;
      background: white; border-radius: 8px; padding: 12px 16px; white-space: nowrap;
      box-shadow: 0 6px 16px rgba(0,0,0,0.08), 0 3px 6px -4px rgba(0,0,0,0.12), 0 9px 28px 8px rgba(0,0,0,0.05);
    }
    .editing-row { background: #fffbe6 !important; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    // 从 URL 参数获取要显示的页面
    const params = new URLSearchParams(window.location.search);
    const targetPage = params.get('page') || 'dashboard';
    // 通知 app.js 只渲染指定页面（不显示侧边栏）
    window.__LEGACY_MODE__ = true;
    window.__LEGACY_PAGE__ = targetPage;
  </script>
  <script src="./app.js"></script>
</body>
</html>
```

注意：这需要在 app.js 中做一个微小修改——检测 `window.__LEGACY_MODE__`，如果为 true 则隐藏侧边栏并直接显示指定页面。这是 app.js 最后一次需要改动的地方。

- [ ] **Step 2: 修改 app.js — 支持 legacy 模式**

在 app.js 的渲染逻辑中，找到侧边栏渲染的位置，加一个条件：如果 `window.__LEGACY_MODE__` 为 true，隐藏侧边栏并自动导航到 `window.__LEGACY_PAGE__` 对应的页面。

具体改法：找到 app.js 中 `let[e,j]=(0,ln.useState)("dashboard")` 或类似的默认页面设置，改为：
```javascript
let[e,j]=(0,ln.useState)(window.__LEGACY_PAGE__||"dashboard")
```

以及找到侧边栏的容器 div，加上条件隐藏：
```javascript
style={window.__LEGACY_MODE__?{display:"none"}:{}}
```

这两处都是极小的改动，不涉及新增组件，只是加条件判断。

- [ ] **Step 3: 确认 legacy 页面可用**

在 shell.html 中点击"特征管理"等未迁移的菜单项，确认通过 legacy.html 正常显示旧页面内容。

- [ ] **Step 4: Commit**

```bash
git add legacy.html app.js
git commit -m "feat: legacy兼容页面（未迁移页面过渡方案）"
```

---

### Task 6: 清理和验证

**Files:**
- Modify: `shell.html`（调整默认页面）

- [ ] **Step 1: 全流程验证**

双击 `shell.html`，依次验证：
1. 默认加载接入点管理列表
2. 点击"编辑" → 跳转到接入点编辑页（基础信息+属性提取+场景编排+变更集四个Tab）
3. 编辑页点"返回列表" → 回到接入点列表
4. 点击"标准属性字典" → 正常显示
5. 点击"特征管理"/"策略管理"等 → 通过 legacy.html 正常显示旧页面
6. 每个页面双击独立打开也能正常工作

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: 平台静态HTML拆分完成（shell外壳+pages子页面+legacy兼容）"
```

---

## 后续迁移（不在本次计划范围内）

每个旧页面按需迁移，步骤统一：
1. 从 app.js 中提取对应组件的逻辑
2. 写成 `pages/xxx.html`（React 18 + Babel standalone + JSX 源码）
3. 更新 shell.html 菜单指向新页面（去掉 `legacy.html?page=`）
4. 测试 + 提交

迁移优先级建议：
- P1：特征管理、策略管理、规则管理、发布管理（核心业务）
- P2：仪表盘、熔断/护栏、手动干预、用户/角色管理
