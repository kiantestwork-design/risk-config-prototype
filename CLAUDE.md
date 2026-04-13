# Risk Config Prototype

## 基准版本

本项目代码是从 commit `1c6fa79`（2026-04-11，编译过的单文件 app.js）反编译还原而来。`1c6fa79` 是标准版本，当前代码在功能和行为上必须与该版本保持一致。

## 前端风格规范

本项目前端 UI 风格参考 **Ant Design**，请在所有前端界面实现中保持以下风格一致性：

### 组件风格
- **Modal / 弹框**：白色卡片，圆角 8px，三层阴影（`0 6px 16px rgba(0,0,0,0.08), 0 3px 6px -4px rgba(0,0,0,0.12), 0 9px 28px 8px rgba(0,0,0,0.05)`），遮罩 `rgba(0,0,0,0.45)`，Header/Footer 用 `rgba(5,5,5,0.06)` 分割线
- **按钮**：高度 32px，圆角 6px，padding `0 15px`
  - Default：白底，`#d9d9d9` 边框，`rgba(0,0,0,0.88)` 文字，hover 变蓝边框
  - Primary：`#1890ff` 蓝底白字，hover `#40a9ff`
  - Danger：`#ff4d4f` 红色
- **颜色体系**：主色 `#1890ff`，成功 `#52c41a`，警告 `#faad14`，错误 `#ff4d4f`
- **文字颜色**：标题 `rgba(0,0,0,0.88)`，正文 `rgba(0,0,0,0.65)`，辅助 `rgba(0,0,0,0.45)`
- **表格**：头部背景 `#fafafa`，行分割线 `#f0f0f0`，hover `#fafafa`
- **边框**：`1px solid #d9d9d9`（普通）/ `1px solid #f0f0f0`（内部分割）

### 交互动效
- Modal 出现：`animate-in fade-in zoom-in-95 duration-200`
- 遮罩：`animate-in fade-in duration-150`
- 按钮/控件：`transition-all` 平滑过渡

### 布局
- 内容区最大宽度 `1600px`，内边距 `p-6`
- 卡片用 `bg-white rounded-lg border border-slate-200 shadow-sm`

### 用户前端偏好（必须遵守）

#### 表格规范
- **一页展示**：表格必须在一页内完整展示，禁止出现横向滚动条
- **布局**：使用 `table-layout: auto` + `w-full`，不要用 `table-fixed`（会导致列错位）
- **padding**：表格单元格使用 `px-3 py-3`，不要用 `px-6 py-4`（太宽会导致溢出）
- **列精简**：只展示核心字段，次要信息（如优先级、评分配置、风险阈值）放到详情页查看
- **操作列**：所有列表页的操作列必须居中对齐，固定宽度 `w-[100px]`
- **运行状态列**：固定宽度 `w-[90px]`
- **名称+描述合并**：所有列表页的名称和描述合并为一列（表头叫"XX信息"），上面蓝色可点击名称，下面灰色小字描述

#### 标签（Tag）换行规则
- **单个 tag 不换行**：每个 tag 内部文字必须在一行内，用 `whitespace-nowrap` + `flex-shrink: 0`
- **多个 tag 可换行**：tag 容器使用 `flex flex-wrap gap-1`，多个 tag 超出列宽时自动换行到下一行
- **禁止**：`flex-nowrap`（会导致标签挤在一行太长）、`overflow-hidden`（会截断内容）

#### 下拉选择器
- **列表页筛选**：使用多选下拉框（`msFilter` 组件），不用单选 `<select>`
- **表单页选择器**：支持搜索的多选下拉框，已选项以蓝色标签显示在输入框内，每个标签可单独×移除
- **下拉框内容**：必须显示中文描述，不要只显示英文名

#### 状态展示
- **列表页**：统一使用「运行状态」（不叫「发布状态」），三态：运行中（绿）、已停用（灰）、未发布（橙）
- **编辑页**：启用状态统一使用 toggle switch 开关（不用 radio button）

#### 数字输入框
- 数字输入框必须支持完全清空后重新输入，onChange 中不要用 `parseInt()||默认值`，用 `v===""?null:parseInt(v)` 模式

#### 弹框
- 弹框内的列表使用标准 table + 分页 + 搜索，不要用简单的 list 滚动
- 表头支持全选/反选（indeterminate 半选状态）
- 底部显示总数和已选数
