# Risk Config Prototype

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
