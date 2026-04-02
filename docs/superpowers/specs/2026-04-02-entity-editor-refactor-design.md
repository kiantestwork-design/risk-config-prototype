# EntityEditor 容器组件重构设计

## 背景

接入点管理页面(gz)实现了完善的编辑体验：查看/编辑模式合一、脏检测、版本切换保护、版本说明、确认弹窗。其他四个页面（特征、策略、规则、动作）将详情和编辑拆分为独立组件，缺少脏检测和版本保护。本次重构将 gz 的模式抽取为公共容器组件 `EntityEditor`，统一所有页面的编辑体验。

## 目标

- 将 gz 的核心逻辑抽取为 `EntityEditor` 容器组件
- 所有 5 个实体页面统一使用 EntityEditor
- 所有页面支持双按钮（保存草稿 / 提交待发布）
- 所有页面支持版本说明字段
- 废弃 8 个独立的详情/编辑组件，合并为 5 个 renderForm 函数

## 架构

### EntityEditor 容器组件

#### Props

```
EntityEditor({
  // 数据
  item,                    // 实体数据对象（null = 新建模式）
  initialMode,             // 'view' | 'edit'
  versions,                // 历史版本数组 [{id, version, content, commitMessage, editor, createAt}]

  // 回调
  onSave,                  // (data) => savedData  保存回调，返回保存后的数据
  onBack,                  // () => void  返回列表回调
  onAddToDrafts,           // (draftEntry) => void  加入发布清单回调

  // 发布清单元数据
  entityType,              // 'EVENT_POINT' | 'FEATURE' | 'ACTIVATION' | 'RULE' | 'ACTION'
  getTargetName,           // (form) => string  从表单数据提取展示名
  getRelatedKeys,          // (form) => string  从表单数据提取关联键

  // 自定义渲染
  renderForm,              // (form, onChange, mode) => JSX  各页面自定义表单内容
  validate,                // (form) => string|null  校验函数，返回错误信息或 null

  // 可选
  title,                   // (form) => string  标题显示文本（如接入点返回 form.eventPoint，特征返回 form.name）
  renderStatus,            // (item) => JSX  生命周期+运行状态徽章渲染（各页面共用同一套徽章样式）
})
```

#### 内部状态

| 状态 | 类型 | 用途 |
|------|------|------|
| `mode` | 'view' \| 'edit' | 当前模式 |
| `viewData` | object | 查看模式展示的数据 |
| `form` | object | 编辑模式的表单数据 |
| `snapshotRef` | useRef(string) | 进入编辑/加载版本时的 JSON 快照 |
| `commitMessage` | string | 版本说明输入 |
| `selectedVersionId` | string \| null | 当前选中的历史版本 ID |
| `confirmAction` | function \| null | 脏检测确认弹窗的待执行动作 |
| `showSaveSuccess` | boolean | 保存成功弹窗显示状态 |

#### 核心流程

```
进入编辑 → snapshot = JSON.stringify(form)
编辑字段 → form 变化，snapshot 不变
切换版本 → guardDirty检查 → form = version.content, snapshot = JSON.stringify(form), commitMessage = ''
取消/返回 → guardDirty检查 → 有修改则弹确认框
保存草稿 → validate() → onSave({...form, lifecycleState:'DRAFT', updateAt:now})
提交待发布 → validate() → onSave({...form, lifecycleState:'READY', updateAt:now})
               + onAddToDrafts({type, targetId, targetName, version, changeSummary, ...})
保存成功 → 弹窗: 继续编辑(→view模式) / 返回列表(→onBack)
```

#### 脏检测逻辑

```javascript
isDirty = () => JSON.stringify(form) !== snapshotRef.current

guardDirty = (action) => {
  if (isDirty()) {
    setConfirmAction(() => action)  // 弹出确认框
  } else {
    action()  // 直接执行
  }
}
```

触发 guardDirty 的场景：
- 编辑态点击历史版本
- 编辑态点击取消
- 编辑态点击返回

#### 双按钮保存逻辑

**保存草稿：**
1. 调用 `validate(form)`，失败则 alert 错误信息并中止
2. 构造数据 `{...form, lifecycleState: 'DRAFT', updateAt: now}`
3. 调用 `onSave(data)` 回写列表
4. 显示保存成功弹窗

**提交待发布：**
1. 调用 `validate(form)`，失败则 alert 错误信息并中止
2. 构造数据 `{...form, id: form.id || Date.now(), lifecycleState: 'READY', updateAt: now}`
3. 调用 `onSave(data)` 回写列表
4. 构造 draft 条目并调用 `onAddToDrafts`：
   ```javascript
   {
     id: `DFT-${Date.now()}-${data.id}`,
     type: entityType,
     targetId: data.id,
     targetName: getTargetName(data),
     version: 'vNext',
     relatedKeys: getRelatedKeys(data),
     updatedAt: data.updateAt,
     editor: 'current_user',
     changeSummary: commitMessage || (isNew ? '初始创建' : '更新配置')
   }
   ```
5. 显示保存成功弹窗

#### 容器统一渲染的 UI

- **顶部操作栏：** 返回按钮、标题、状态徽章、编辑中标签、操作按钮（编辑/取消/保存草稿/提交待发布）
- **主体区域：** `renderForm(form, onChange, mode)` 渲染的自定义表单
- **版本说明输入框：** 编辑模式下显示，textarea
- **右侧面板：** VersionHistoryPanel
- **弹窗层：** ConfirmDialog、SaveSuccessDialog

### VersionHistoryPanel 公共组件

```
VersionHistoryPanel({
  versions,              // 版本数组
  selectedVersionId,     // 当前选中版本 ID
  onSelectVersion,       // (version) => void 选中回调
})
```

渲染内容：
- 标题"版本历史"
- 版本列表：版本号、编辑人、时间、commitMessage
- 选中态高亮样式
- 空态提示（新建实体无历史版本时显示"暂无历史版本"）

### ConfirmDialog 公共组件

EntityEditor 内部渲染，展示"有未保存的修改，确定要放弃吗？"，取消/确定按钮。

### SaveSuccessDialog 公共组件

EntityEditor 内部渲染，展示"保存成功"，继续编辑/返回列表按钮。

## 各页面 renderForm 职责

### 接入点 renderForm

表单字段：
- eventPoint 编码（编辑已有时 disabled）
- 描述 textarea
- 运行状态开关（启用/禁用 toggle）

关联信息面板（查看模式下显示）：
- 关联的策略列表（从 gr 筛选）
- 关联的特征列表（从 eo 筛选）

validate: eventPoint 编码不能为空

### 特征 renderForm

表单字段：
- name（创建后 disabled）
- 描述 textarea
- type 下拉（DirectStorage / HistoryStorage / Aggregation / OfflineStorage）
- eventPoints 输入（逗号分隔）
- compositeKeyJsonPaths 数组编辑（type 相关）
- calculationConfig JSON 编辑（type 为 Aggregation 时显示）

查看模式下的关联信息面板：
- 关联的历史版本列表（从 hd 筛选）

validate: name 不能为空

### 策略 renderForm

表单字段：
- name
- 描述 textarea
- eventPoint 下拉选择
- priority 数字输入
- thresholds 动态表格（增删行，每行有 name + score）

查看模式下的关联信息面板：
- 关联的规则列表（从 Or 筛选）
- 所属接入点信息（从 rn 查找）

validate: name 不能为空，eventPoint 不能为空

### 规则 renderForm

表单字段：
- name
- 描述 textarea
- initScore / max 数字输入
- 条件表达式树编辑器（复用现有 Lz 组件）
- actions 列表（关联动作的多选/配置）

validate: name 不能为空

### 动作 renderForm

表单字段：
- name
- 描述 textarea
- type 下拉
- configSchema JSON 编辑器

validate: name 不能为空

## 列表页改造

所有列表页统一为 xz 的两态模式：

```
LIST 态 → 列表页（筛选、批量操作、表格）不变
VIEW 态 → 渲染 EntityEditor
         ├── 点击"查看" → initialMode='view'
         ├── 点击"编辑" → initialMode='edit'
         └── 点击"新建" → item=null, initialMode='edit'
```

变化：
- hz（特征列表）：删除 DETAIL/EDIT 两态，统一为 LIST/VIEW，不再引用 mz 和 pz
- bz（策略列表）：同理，不再引用 vz 和 yz
- Nz（规则列表）：同理，不再引用 Sz 和 Az
- Tz（动作列表）：同理，不再引用 Ez 和 kz
- xz（接入点列表）：不再引用 gz，改为引用 EntityEditor + 接入点 renderForm

列表页自身的逻辑（筛选条件、批量操作、表格列定义）保持不变。

## 废弃组件清单

| 废弃组件 | 原用途 | 替代方案 |
|---------|--------|---------|
| gz | 接入点详情/编辑 | EntityEditor + 接入点 renderForm |
| mz | 特征详情（只读） | EntityEditor view 模式 + 特征 renderForm |
| pz | 特征编辑 | EntityEditor edit 模式 + 特征 renderForm |
| vz | 策略详情（只读） | EntityEditor view 模式 + 策略 renderForm |
| yz | 策略编辑 | EntityEditor edit 模式 + 策略 renderForm |
| Sz | 规则详情（只读） | EntityEditor view 模式 + 规则 renderForm |
| Az | 规则编辑 | EntityEditor edit 模式 + 规则 renderForm |
| Ez | 动作详情（只读） | EntityEditor view 模式 + 动作 renderForm |
| kz | 动作编辑 | EntityEditor edit 模式 + 动作 renderForm |

注：Lz（条件表达式树编辑器）保留，作为规则 renderForm 内部引用的子组件。
