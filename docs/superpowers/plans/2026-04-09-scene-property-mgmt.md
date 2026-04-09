# 场景编排 + 属性管理 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为风控配置平台原型实现三个新模块——标准属性字典、属性提取配置、场景编排，均为可直接浏览器打开的独立 HTML 页面。

**Architecture:** 每个 HTML 页面内嵌 React 19 + Babel standalone + Tailwind CDN，组件以 JSX 直接写在 `<script type="text/babel">` 中。三个页面共享一套通用子组件（SearchSelect、ConfirmPopover、StatusToggle 等），通过 copy 而非 import 复用（原型无构建系统）。页面之间通过 Mock 数据模拟联动关系。

**Tech Stack:** React 19 (CDN), Babel standalone (CDN), Tailwind CSS (CDN), 纯静态 HTML

**设计文档:** `docs/superpowers/specs/2026-04-09-scene-property-mgmt-design.md`

**CLAUDE.md 视觉规范:** 按钮 32px/6px圆角, 主色 `#1890ff`, 表格头 `#fafafa`, 展开动画 `grid-template-rows`, 禁止 Modal, 名称+描述合并列

---

## 文件结构

| 文件 | 职责 | 操作 |
|---|---|---|
| `property-dictionary-demo.html` | 标准属性字典（全局独立页面） | 新建 |
| `ep-detail-demo.html` | 接入点详情页（Tab 1 属性提取 + Tab 2 场景编排） | 新建 |
| `scene-card-demo.html` | 已有的 SceneCard 独立 demo | 保留不动 |
| `property-mgmt-demo.html` | 已有的早期原型（已被新设计取代） | 保留不动 |

> 三个页面中的通用子组件（SearchSelect、ConfirmPopover、StatusToggle、FieldTypeTag、expand-section CSS）以内联形式复制到每个 HTML 中。原型阶段不做抽取复用。

---

### Task 1: 标准属性字典页面 — 数据层和通用组件

**Files:**
- Create: `property-dictionary-demo.html`

**说明:** 先搭建页面骨架、Mock 数据、通用子组件，还不包含业务表格和表单。

- [ ] **Step 1: 创建 HTML 骨架和 Mock 数据**

创建 `property-dictionary-demo.html`，包含：
- HTML 头（React 19 CDN + Babel standalone + Tailwind CDN + index.css）
- CSS：expand-section / confirm-popover / editing-row 动画样式
- Mock 数据：`MOCK_STANDARD_PROPERTIES` 数组（8 条属性：user_id, trade_amount, target_address, asset_type, client_ip, device_id, platform, request_id），包含 refCount 字段
- 常量：`FIELD_TYPES`（7 种）、`VALIDATE_TYPES`（11 种含空）

```javascript
const MOCK_STANDARD_PROPERTIES = [
  { id: '1', name: 'user_id', description: '用户ID', fieldType: 'STRING', validateType: 'STRING', validateArgs: '', status: 1, refCount: 3 },
  { id: '2', name: 'trade_amount', description: '交易金额', fieldType: 'DOUBLE', validateType: 'DOUBLE', validateArgs: '', status: 1, refCount: 2 },
  // ... 6 more
];
```

- [ ] **Step 2: 实现通用子组件**

在同一文件中实现以下组件（后续 Task 复用）：
- `SearchSelect` — 搜索下拉单选，props: value/onChange/options/placeholder/renderOption/disabled
- `ConfirmPopover` — 内联确认气泡，props: visible/onConfirm/onCancel/message
- `StatusToggle` — 启用/禁用开关，props: enabled/onChange
- `FieldTypeTag` — 类型彩色标签，props: type（STRING=蓝/INTEGER=紫/DOUBLE=橙/BOOLEAN=绿/LIST=青/JSON=粉）
- `ValidateTag` — 校验规则标签，props: type/args

- [ ] **Step 3: 实现空壳 App 组件**

App 组件包含：
- 面包屑：`全局配置 > 标准属性字典`
- 页面标题 + 副标题
- 右上角 `+ 新增标准属性` 按钮（暂无功能）
- 空的 `<div id="property-list">` 占位

- [ ] **Step 4: 浏览器验证骨架**

Run: 浏览器打开 `property-dictionary-demo.html`
Expected: 看到面包屑、标题、按钮，无报错

- [ ] **Step 5: Commit**

```bash
git add property-dictionary-demo.html
git commit -m "feat: 标准属性字典页面骨架和通用组件"
```

---

### Task 2: 标准属性字典页面 — 表格 + 筛选 + 状态切换

**Files:**
- Modify: `property-dictionary-demo.html`

- [ ] **Step 1: 实现 PropertyDictionary 组件的表格区**

表格列按设计文档：
- 属性信息（名称+描述合并列，名称蓝色 monospace，描述灰色小字）
- 字段类型（FieldTypeTag 标签）
- 校验规则（ValidateTag 标签）
- 引用数（灰色小字 `X 个接入点`）
- 状态（StatusToggle 开关）
- 操作（编辑 | 删除）

表格规范：`table-layout: auto`, `w-full`, 单元格 `px-3 py-3`, 头部 `#fafafa`, 行分割线 `#f0f0f0`, hover `#fafafa`

- [ ] **Step 2: 实现筛选区**

表格上方：
- 搜索框：按属性名或描述模糊搜索，实时过滤
- 类型筛选：多选下拉（用 checkbox 下拉实现，选中后以蓝色标签显示，可×移除）

state: `searchText`, `selectedTypes` 数组

过滤逻辑：
```javascript
const filtered = properties.filter(p =>
  (p.name.includes(searchText) || p.description.includes(searchText)) &&
  (selectedTypes.length === 0 || selectedTypes.includes(p.fieldType))
);
```

- [ ] **Step 3: 实现删除（Popover 二次确认）**

- 点击"删除"显示 ConfirmPopover
- `refCount > 0` 时 message 为 `该属性正在被 ${refCount} 个接入点使用，确认删除？`
- `refCount === 0` 时 message 为 `确认删除该属性？`
- 确认后从列表移除

- [ ] **Step 4: 浏览器验证**

Run: 浏览器打开 `property-dictionary-demo.html`
Expected: 8 行属性数据显示正确，搜索和类型筛选正常工作，删除有二次确认，Toggle 可切换状态

- [ ] **Step 5: Commit**

```bash
git add property-dictionary-demo.html
git commit -m "feat: 标准属性字典 — 表格、筛选、状态切换、删除"
```

---

### Task 3: 标准属性字典页面 — 内联新增/编辑表单

**Files:**
- Modify: `property-dictionary-demo.html`

- [ ] **Step 1: 实现内联表单组件**

表单区域（renderPropertyForm 函数，新增和编辑复用）：
- 背景 `#fafafa` + 内阴影 `inset 0 2px 4px rgba(0,0,0,0.04)`
- 3 列 Grid 布局
- 5 个字段：标准属性名（Input monospace）、中文描述（Input）、字段类型（SearchSelect）、校验类型（SearchSelect）、校验参数（Input，条件启禁用）
- 右下角：取消 + 保存

校验参数交互：
- 校验类型为 LENGTH → 参数输入框启用，placeholder "请输入目标长度"
- 校验类型为 REGEX → 参数输入框启用，placeholder "请输入正则表达式"
- 其他类型 → 参数输入框禁用并清空
- 不校验 → 参数输入框隐藏

- [ ] **Step 2: 新增模式**

- 点击 `+ 新增标准属性` → 表格底部展开表单（expand-section 动画）
- 按钮切换为禁用状态
- 保存前校验：属性名非空 + `/^[a-z][a-z0-9_]*$/` + 全局唯一；描述非空；LENGTH 参数需正整数；REGEX 参数需合法正则
- 保存成功 → 追加到列表 + 收起表单 + 按钮恢复

- [ ] **Step 3: 编辑模式**

- 点击表格行的"编辑" → 该行下方展开表单（同一个 renderPropertyForm）
- 该行背景高亮黄色 `#fffbe6`
- 属性名字段在编辑模式下**只读**（灰色背景，不可修改）
- 保存 → 更新列表中对应项 + 收起
- 取消 → 恢复原值 + 收起

- [ ] **Step 4: 浏览器验证**

Run: 浏览器打开 `property-dictionary-demo.html`
Expected:
- 新增：展开表单，填写后保存，新行出现在表格中
- 编辑：点编辑高亮行，展开表单预填数据，修改后保存，行数据更新
- 校验：空属性名提示错误，重复名提示错误，LENGTH 非正整数提示错误
- 校验参数联动：选 LENGTH 启用输入框，选 STRING 禁用输入框

- [ ] **Step 5: Commit**

```bash
git add property-dictionary-demo.html
git commit -m "feat: 标准属性字典 — 内联新增/编辑表单，含校验和动画"
```

---

### Task 4: 接入点详情页 — 骨架和 Tab 切换

**Files:**
- Create: `ep-detail-demo.html`

**说明:** 接入点详情页整合 Tab 1（属性提取配置）和 Tab 2（场景编排），本 Task 先搭骨架和 Tab 切换。

- [ ] **Step 1: 创建 HTML 骨架**

创建 `ep-detail-demo.html`，包含：
- HTML 头（同 Task 1 结构）
- CSS 动画样式（同 Task 1）
- 通用子组件（从 Task 1 复制：SearchSelect、ConfirmPopover、StatusToggle、FieldTypeTag、ValidateTag）
- Mock 数据：
  - `MOCK_STANDARD_PROPERTIES`（全局标准属性字典，8 条）
  - `MOCK_EXTRACTIONS_LOGIN`（EP00010001 登录的提取配置，7 条）
  - `MOCK_EXTRACTIONS_WITHDRAW`（EP00000005 提现的提取配置，6 条）
  - `MOCK_FEATURES`（可选特征列表，6 条）
  - `MOCK_SCENE_FEATURES_PRE/PROCESS/POST`（三个场景的已绑定特征）
  - `SAMPLE_PAYLOAD_LOGIN` / `SAMPLE_PAYLOAD_WITHDRAW`（示例 JSON 报文）

- [ ] **Step 2: 实现 EP 详情页骨架 + Tab 切换**

App 组件：
- 面包屑：`事件与策略编排 > 接入点管理 > EP00010001 登录风控`
- 接入点信息卡片（编码、名称、描述、运行状态标签）
- Tab 切换组件（复用已有的 TabSwitch）：`属性提取配置` | `场景编排`
- 可选：顶部增加一个接入点切换下拉（EP00010001 登录 / EP00000005 提现）

state: `activeTab`（'extraction' | 'scene'）, `activeEP`

- [ ] **Step 3: 浏览器验证**

Run: 浏览器打开 `ep-detail-demo.html`
Expected: 看到面包屑、EP 信息卡片、两个 Tab 可点击切换（内容暂为占位文字）

- [ ] **Step 4: Commit**

```bash
git add ep-detail-demo.html
git commit -m "feat: 接入点详情页骨架和 Tab 切换"
```

---

### Task 5: 接入点详情页 — Tab 1 属性提取配置

**Files:**
- Modify: `ep-detail-demo.html`

- [ ] **Step 1: 实现 DataFlowVisualization 组件**

可折叠的数据流预览：
- 默认收起，点击 header 展开
- 三栏并排：原始报文 JSON（灰底 pre）→ 映射规则列表（蓝底卡片）→ 标准上下文 JSON（绿底 pre）
- 映射规则栏：遍历 extractions，用 `fieldName.split('.')` 从 samplePayload 中取值
  - 取到值 → 绿色 ✓
  - 取不到 → 红色删除线 + `(未匹配)`
- 两个箭头用 `flow-arrow` 脉冲动画（opacity 0.4 ↔ 1，2s infinite）

- [ ] **Step 2: 实现 ExtractionCard 表格区**

表格列：
- 标准属性（名称蓝色+描述灰色，合并列）
- 提取路径（monospace 灰底）
- 类型（FieldTypeTag，只读，从 standardProperties 中 lookup）
- 校验规则（ValidateTag，只读，从 standardProperties 中 lookup）
- 状态（StatusToggle）
- 操作（编辑 | 删除 + Popover）

- [ ] **Step 3: 实现 ExtractionCard 内联新增/编辑表单**

内联表单只有 2 个字段（非常轻量）：
- 标准属性：SearchSelect，选项从 `standardProperties` 加载，renderOption 显示 `描述（属性名）`，已绑定的属性在下拉中灰显或隐藏
- 字段提取路径：Input monospace，placeholder `如 properties.fromUserId`

校验：
- 标准属性必选，不能重复绑定
- 提取路径非空

编辑模式：点击行"编辑" → 行下方展开表单（属性下拉只读，只能改路径）

- [ ] **Step 4: 浏览器验证**

Run: 浏览器打开 `ep-detail-demo.html`，切到 Tab 1
Expected:
- 数据流预览可展开/收起，三栏联动正确
- 表格显示 7 条提取规则，类型和校验继承自字典（只读标签）
- 新增：选标准属性 + 填路径 → 保存 → 新行出现
- 编辑：改路径 → 保存 → 行数据更新
- 删除：Popover 确认后移除

- [ ] **Step 5: Commit**

```bash
git add ep-detail-demo.html
git commit -m "feat: 接入点详情 Tab 1 — 属性提取配置（含数据流预览）"
```

---

### Task 6: 接入点详情页 — Tab 2 场景编排

**Files:**
- Modify: `ep-detail-demo.html`

- [ ] **Step 1: 实现 SceneCard 组件**

按设计文档 5.4 节：
- 卡片头：彩色场景标签（PRE蓝/PROCESS橙/POST红）+ 场景名 + 特征计数 + 右侧编辑/删除
- 区域 1 表格：特征信息（名称蓝色+描述灰色）| 动作（ActionTag: READ蓝/WRITE绿/DELETE红）| 提取属性（monospace 灰底）| 准入条件（紫色 monospace，无条件显示 `-`）| 操作（删除 + Popover）
- 区域 2：虚线框添加按钮
- 区域 3：内联表单（2列 Grid）
  - 特征：SearchSelect，renderOption 显示 `描述（英文名）`
  - 动作：SearchSelect，选项 READ 读取 / WRITE 写入 / DELETE 删除
  - 提取属性：SearchSelect，选项来自 Tab 1 的 extractions 列表（标准属性名），renderOption 显示 `描述（属性名）`
  - 准入条件：Input，placeholder `如 fact.user_id != nil`

- [ ] **Step 2: 实现场景编排顶部 + 新增场景**

Tab 2 内容区：
- 标题 `场景编排` + 右侧 `+ 新增场景` 按钮
- 点击新增 → 底部出现一个新的内联表单（输入场景编码和名称）→ 保存后生成空白 SceneCard
- 三张 SceneCard 纵向排列，间距 `space-y-4`

- [ ] **Step 3: Tab 1 → Tab 2 数据联动**

关键联动：Tab 1 的已绑定属性列表作为 Tab 2 SceneCard 的 `availableProperties` prop。

实现方式：
- EP 详情页的 App 组件维护 `extractions` state
- Tab 1 的 ExtractionCard 增删改更新 `extractions`
- Tab 2 的 SceneCard 接收 `extractions` 作为下拉选项
- 切换 Tab 时 state 保持（两个 Tab 同时渲染，用 `display: none` 切换）

- [ ] **Step 4: 浏览器验证**

Run: 浏览器打开 `ep-detail-demo.html`，切到 Tab 2
Expected:
- 三张 SceneCard（PRE/PROCESS/POST）各显示预填的特征列表
- 点"添加特征配置"展开表单，"提取属性"下拉显示 Tab 1 中已绑定的标准属性
- 保存后新行出现在列表顶部
- 删除有 Popover 确认
- 切回 Tab 1 新增一个提取规则，切回 Tab 2 下拉选项同步更新

- [ ] **Step 5: Commit**

```bash
git add ep-detail-demo.html
git commit -m "feat: 接入点详情 Tab 2 — 场景编排（SceneCard + Tab 联动）"
```

---

### Task 7: 接入点切换 + 最终验收

**Files:**
- Modify: `ep-detail-demo.html`

- [ ] **Step 1: 实现接入点切换**

页面顶部加一个 EP 切换组件（Tab 或下拉），可在两个接入点之间切换：
- EP00010001 登录风控（7 个提取规则，3 个场景）
- EP00000005 App 提现（6 个提取规则，2 个场景 PRE + PROCESS）

切换时：
- Tab 1 和 Tab 2 的数据同步切换
- 数据流预览的示例报文切换
- 场景编排的 SceneCard 数量和内容切换

- [ ] **Step 2: 全链路验收**

完整走通数据流：
1. 打开 `property-dictionary-demo.html` — 看到全局标准属性字典
2. 打开 `ep-detail-demo.html` — Tab 1 属性提取配置引用字典中的属性
3. Tab 2 场景编排的"提取属性"下拉选项来自 Tab 1

验证项：
- [ ] 标准属性字典：CRUD 全流程，筛选正常，校验参数联动正确
- [ ] 属性提取配置：数据流预览三栏联动，只读列正确继承字典
- [ ] 场景编排：三张 SceneCard 内联展开/收起，Tab 联动正确
- [ ] 全局视觉：无 Modal 弹窗，展开动画流畅，颜色体系一致
- [ ] 切换接入点时数据正确切换

- [ ] **Step 3: Commit**

```bash
git add ep-detail-demo.html
git commit -m "feat: 接入点切换 + 全链路验收"
```

---

## 总计

| Task | 产出 | 预计步骤 |
|---|---|---|
| Task 1 | 属性字典骨架 + 通用组件 | 5 步 |
| Task 2 | 属性字典表格 + 筛选 + 删除 | 5 步 |
| Task 3 | 属性字典内联表单 | 5 步 |
| Task 4 | EP 详情页骨架 + Tab | 4 步 |
| Task 5 | Tab 1 属性提取配置 | 5 步 |
| Task 6 | Tab 2 场景编排 | 5 步 |
| Task 7 | EP 切换 + 验收 | 3 步 |
| **Total** | **2 个 HTML 页面，7 次 commit** | **32 步** |
