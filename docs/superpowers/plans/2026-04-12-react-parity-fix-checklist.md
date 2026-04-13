# React Parity 修复清单

日期：2026-04-12  
范围：`EntityEditorShell`、版本历史、表达式编辑器、规则/特征编辑页 parity

## 结论

当前版本 `npm run build` 已通过，但和旧 `app.js` 版本相比，下面 6 个问题仍然存在：

1. 右侧历史列表并没有稳定恢复
2. 规则历史数据仍然不完整且内容不一致
3. 条件表达式编辑器仍然会丢嵌套子组
4. 历史版本内容字段过薄，无法还原旧版完整编辑态
5. 编辑页整体样式仍然是通用壳，不是旧 `app.js` 的页面级布局
6. 条件表达式编辑器本身也不是 `1c6fa79 / app.js` 那一版的结构和样式

## 问题清单

### 1. 特征右侧历史列表仍会消失

**现象**

- 特征编辑页右侧历史列表不是每条特征都有
- 点到部分特征时，右边仍然为空

**直接原因**

- 右侧历史栏只有在 `versions.length > 0 && !isNew` 时才显示  
  代码位置：[src/components/EntityEditorShell.jsx](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/components/EntityEditorShell.jsx:236)
- 当前真实特征 ID 是 `1 / 101 / 102`  
  数据位置：[src/config/mock/features.js](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/config/mock/features.js:4) [src/config/mock/features.js](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/config/mock/features.js:22) [src/config/mock/features.js](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/config/mock/features.js:40)
- 但特征版本历史仍写成 `featureId: 1 / 2 / 3`  
  数据位置：[src/config/mock/versions.js](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/config/mock/versions.js:24)

**差异**

- 旧 `app.js` 的感觉是“进入已有实体就能看到右侧历史版本”
- 现在 React 版只有少数 ID 正好命中的实体才有历史栏

**修复要求**

- 重新对齐 `MOCK_FEATURE_VERSIONS` 和 `MOCK_FEATURES`
- 让历史记录覆盖当前实际存在的特征 ID，至少覆盖 `1 / 101 / 102`
- 不允许再出现“列表里有实体，但点进去没历史版本”的断档体验

### 2. 规则历史数据仍不完整，且名称与当前实体不一致

**现象**

- 部分规则没有右侧历史栏
- 部分规则即使有历史，切换后显示的名称和当前规则名称不一致

**直接原因**

- 当前规则实体是 `1~5`  
  数据位置：[src/config/mock/rules.js](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/config/mock/rules.js:3)
- 规则历史只覆盖了 `1 / 2 / 5`  
  数据位置：[src/config/mock/versions.js](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/config/mock/versions.js:33)
- 历史里的名称仍然是 `rule_high_amount_txn / rule_high_freq_txn`
- 当前实体名称是 `rule_high_amount / rule_freq_check`  
  数据位置：[src/config/mock/rules.js](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/config/mock/rules.js:5) [src/config/mock/rules.js](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/config/mock/rules.js:22)

**差异**

- 旧 `app.js` 不会出现“切换历史版本后标题像另一个规则”的感觉
- 现在规则历史数据和当前实体模型并不是同一套

**修复要求**

- 补齐 `ruleId: 3 / 4` 的历史版本
- 将已有历史记录中的规则名、描述与当前规则实体统一
- 保证切换历史版本后，标题、描述、状态、表达式、评分配置都属于同一条规则

### 3. 条件表达式编辑器仍会丢嵌套子组

**现象**

- 表达式现在能显示，但复杂嵌套结构保存后仍可能被截断

**直接原因**

- `groupToLegacy()` 在遇到嵌套子组时，没有继续递归写回 `groups`
- 当前只会回写当前层的 `conditions`
- 代码位置：[src/components/ConditionExpressionEditor.jsx](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/components/ConditionExpressionEditor.jsx:90)

**差异**

- 旧 `app.js` 的表达式编辑器至少不会把已有嵌套结构保存坏
- 现在这版仍然属于“能看但不稳”的状态

**修复要求**

- 修正 `groupToLegacy()` 的递归序列化逻辑
- 目标输出结构必须稳定保持 legacy 形状：
  - 顶层：`{ logic, groups: [...] }`
  - 组节点：`{ logic, conditions?, groups? }`
- 必须覆盖 3 类 case：
  - 只有条件
  - 条件 + 子组混合
  - 多层嵌套子组

### 4. 历史版本内容字段仍然过薄

**现象**

- 右侧历史版本即使能点，切换后也还原不出旧版完整编辑信息

**直接原因**

- 特征当前真实字段包括：
  - `conditionExpression`
  - `compositeKeyJsonPaths`
  - `calculationConfig`
  - `includeCurrentEvent`
  数据位置：[src/config/mock/features.js](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/config/mock/features.js:14)
- 但 `MOCK_FEATURE_VERSIONS` 的 `content` 只保留了基础字段  
  数据位置：[src/config/mock/versions.js](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/config/mock/versions.js:25)
- 规则历史也是同样问题，当前规则有 `conditionExpression / initScore / baseNum / operator / valueField / max / rate / actions`  
  数据位置：[src/config/mock/rules.js](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/config/mock/rules.js:7)
- 但历史 `content` 没有同步这些字段  
  数据位置：[src/config/mock/versions.js](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/config/mock/versions.js:34)

**差异**

- 旧 `app.js` 切版本后，右侧历史和主编辑区是同一套完整业务数据
- 现在 React 版只是“基础字段切换”，核心编辑内容没跟着切

**修复要求**

- 为特征历史补齐完整内容字段
- 为规则历史补齐完整内容字段
- 策略历史至少补齐：
  - `eventPoint`
  - `priority`
  - `scenes`
  - `thresholds`
  - `ruleIds`
- 接入点历史至少保证基础字段完整一致

### 5. 编辑页样式仍然不是 old app.js 的页面级布局

**现象**

- 现在编辑页仍然明显是统一的 React 壳
- 和旧 `app.js` 的业务编辑器观感不一致

**直接原因**

- 当前四类编辑页都走同一个通用壳  
  代码位置：[src/components/EntityEditorShell.jsx](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/components/EntityEditorShell.jsx:187)
- 布局模式仍是：
  - 顶部统一头部
  - 左侧主表单
  - 右侧条件显示历史面板
- 这更像“统一后台框架”，不是旧版页面级编辑器的密度和结构

**差异**

- 旧 `app.js` 的接入点 / 特征 / 规则 / 策略编辑页虽然复用壳层思想，但页面组织更业务化
- 当前 React 版仍然有很强的统一模板感

**修复要求**

- 不一定要彻底废弃 `EntityEditorShell`
- 但必须把最终编辑页调整到更接近 old `app.js` 的视觉结构：
  - 标题区层级
  - 按钮样式
  - 分区边界
  - 卡片密度
  - 右栏比例
  - 历史列表视觉状态
- 目标不是“更现代”，而是“更像 app.js”

### 6. 条件表达式编辑器需要回到 `1c6fa79 / app.js` 那一版

**现象**

- 现在的条件表达式编辑器虽然能编辑树结构，但观感、布局和旧版明显不同
- 你已经明确确认：希望它改回以前 `app.js` 那一版

**直接原因**

- `1c6fa79` 时，旧版条件表达式编辑器仍然是 `app.js` 中的原始实现，文档里对应旧组件 `Lz`
- 当前 React 版使用的是后写的通用组件  
  代码位置：[src/components/ConditionExpressionEditor.jsx](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/components/ConditionExpressionEditor.jsx:1)
- 这不是“从 app.js 原样抽取”，而是“按理解重写了一版”

**差异**

- 旧版是 `app.js` / `Lz` 那套组件结构
- 当前版是彩色分组卡片、统一按钮、统一输入框的通用树编辑器风格
- 所以即使数据结构修好，视觉和交互也仍然不像旧版

**修复要求**

- 以 `1c6fa79` 对应的 `app.js` 中表达式编辑器为准进行还原
- 优先保证下面几件事一致：
  - 分组布局
  - AND/OR 切换样式
  - 条件行布局
  - 添加条件 / 添加子组 / 删除的交互位置
  - 只读态样式
- 不接受继续在当前通用组件上做“风格接近”的小修小补
- 目标是“按旧版组件结构重做或高保真还原”，不是“保留现版大框架再微调颜色”

## 执行计划

### Task 1. 修正版本历史 ID 对齐

修改文件：

- [src/config/mock/versions.js](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/config/mock/versions.js:1)

执行内容：

- 特征历史改为覆盖 `1 / 101 / 102`
- 规则历史改为覆盖 `1 / 2 / 3 / 4 / 5`
- 校准每条历史记录的名称、描述与当前实体一致

### Task 2. 补齐历史版本完整内容

修改文件：

- [src/config/mock/versions.js](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/config/mock/versions.js:1)

执行内容：

- 以当前实体 mock 为基线，给历史版本补全业务字段
- 保证切换历史版本后，主编辑区所有关键字段都能同步变化

### Task 3. 修复表达式递归保存

修改文件：

- [src/components/ConditionExpressionEditor.jsx](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/components/ConditionExpressionEditor.jsx:1)

执行内容：

- 修复 `groupToLegacy()` 的递归序列化
- 保证嵌套组不会在保存时被丢掉

### Task 4. 将表达式编辑器还原到 `1c6fa79 / app.js` 风格

修改文件：

- [src/components/ConditionExpressionEditor.jsx](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/components/ConditionExpressionEditor.jsx:1)
- 如有必要，拆分新的子组件文件也可以，但目标必须是还原旧版，而不是继续抽象通用树编辑器

执行内容：

- 对照 `1c6fa79` 对应的 `app.js` / `Lz` 实现重做布局和交互
- 将当前彩色卡片式表达式编辑器替换为更接近旧版的结构
- 保持数据结构兼容 legacy，同时视觉和交互贴近旧版

### Task 5. 调整右侧历史面板体验

修改文件：

- [src/components/EntityEditorShell.jsx](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/components/EntityEditorShell.jsx:1)

执行内容：

- 保持右栏渲染逻辑和视觉风格与旧版一致
- 若某实体确实无历史记录，也要明确展示“暂无历史版本”，不要让页面结构突然塌掉

### Task 6. 微调编辑页样式到旧版方向

修改文件：

- [src/components/EntityEditorShell.jsx](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/components/EntityEditorShell.jsx:1)
- 相关页面：
  - [src/pages/EntryPointList.jsx](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/pages/EntryPointList.jsx:1)
  - [src/pages/FeatureList.jsx](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/pages/FeatureList.jsx:1)
  - [src/pages/ActivationList.jsx](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/pages/ActivationList.jsx:1)
  - [src/pages/RuleList.jsx](/Users/zion/work/Projects/new-risk-control/risk-config-prototype/src/pages/RuleList.jsx:1)

执行内容：

- 优先修旧版风格差异最大的区域：
  - 编辑页头部
  - 分区间距
  - 卡片边框/阴影/圆角
  - 按钮样式
  - 右栏宽度与分隔方式

## 验收标准

### 历史版本

- 打开 3 条特征时，右侧都能看到历史版本
- 打开 5 条规则时，右侧都能看到历史版本
- 切换版本后，标题、描述、状态、表达式、业务字段同步变化

### 表达式

- 能正确显示 legacy `groups[].conditions[]`
- 保存后仍保持 legacy 结构
- 多层嵌套组不会丢失
- 表达式编辑器的布局和交互风格接近 `1c6fa79 / app.js` 那一版
- 不再保留当前这套明显“重写版”的彩色树编辑器观感

### 样式

- 编辑页整体观感接近 old `app.js`
- 不再有明显“统一 Tailwind 后台壳”的模板感
- 右侧历史栏稳定存在，不再时有时无

### 构建

- `npm run build` 通过

## 建议提交拆分

1. `fix: align version history with current entities`
2. `fix: preserve nested legacy condition groups on save`
3. `refactor: restore condition expression editor closer to app.js Lz`
4. `style: restore editor shell and history panel closer to app.js`
