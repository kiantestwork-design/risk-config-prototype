# 场景编排 + 属性管理 前端原型设计文档

## 一、设计目标

在风控配置平台原型中新增三个核心页面模块，共同支撑"指挥权与执行权分离"的架构：

1. **标准属性字典**（全局独立页面）：集中声明全系统的标准属性——名称、类型、校验规则
2. **属性提取配置**（接入点详情 Tab）：配置每个接入点如何从原始 JSON 报文中提取标准属性
3. **场景编排**（接入点详情 Tab）：管理接入点下的场景，配置每个场景下的特征挂载（读/写/删）

**数据流全景：**

```
标准属性字典（全局声明）
  定义：user_id 是 STRING 类型，需要字符串校验
  定义：trade_amount 是 DOUBLE 类型，需要数字校验
        ↓ 被各接入点引用
接入点 EP00000005 — 属性提取配置
  user_id ← properties.fromUserId
  trade_amount ← properties.amount
        ↓ 提取后生成标准上下文
接入点 EP00000005 — 场景编排
  PRE 场景 → 特征 withdraw_history 做 WRITE，用 user_id
  PROCESS 场景 → 特征 withdraw_history 做 READ，用 user_id
```

---

## 二、菜单结构

```
一级菜单：全局配置
  ├── 标准属性字典          ← 新增（第三章）
  └── 特征管理              ← 已有

一级菜单：事件与策略编排
  └── 接入点管理            ← 已有
        └── EP 详情页
              ├── Tab 1: 属性提取配置   ← 新增（第四章）
              └── Tab 2: 场景编排       ← 新增（第五章）

一级菜单：决策配置          ← 已有（策略/规则/动作）
一级菜单：发布管理          ← 已有
```

---

## 三、标准属性字典（全局独立页面）

### 3.1 业务定位

**全系统唯一的属性声明中心。** 在这里定义"风控系统认识哪些标准属性"，包括属性名、类型、校验规则。各接入点的"属性提取配置"从这里引用属性，而不是各自重复定义。

类比：标准属性字典 = 数据库的 Schema 定义，属性提取配置 = ETL 的字段映射。

### 3.2 页面布局

#### 顶部

- 标题：`标准属性字典`
- 副标题：`定义风控系统的标准属性，各接入点引用这些属性并配置提取路径`
- 右上角：`+ 新增标准属性` 按钮

#### 主体：属性列表表格

| 列 | 说明 | 宽度 |
|---|---|---|
| 属性信息 | 上面蓝色 `user_id`（monospace），下面灰色"用户ID" | 自适应 |
| 字段类型 | 彩色标签：STRING(蓝) / INTEGER(紫) / DOUBLE(橙) / BOOLEAN(绿) / LIST(青) / JSON(粉) | 80px |
| 校验规则 | 灰底标签 + 参数。如 `长度校验` `42`。无校验显示 `-` | 150px |
| 引用数 | 显示被多少个接入点引用，如 `3 个接入点`（灰色小字） | 100px |
| 状态 | Toggle Switch 启用/禁用 | 60px |
| 操作 | 编辑 \| 删除（Popover 二次确认，被引用时提示"正在被 X 个接入点使用"） | 90px |

#### 筛选区

- 搜索框：按属性名或描述模糊搜索
- 类型筛选：多选下拉（STRING / INTEGER / DOUBLE / ...）

#### 底部：内联新增/编辑表单

点击 `+ 新增标准属性` 或表格行的"编辑"，在对应位置内联展开表单：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| 标准属性名 | Input (monospace) | 是 | 小写字母+下划线+数字，字母开头。如 `user_id` |
| 中文描述 | Input | 是 | 如"用户ID" |
| 字段类型 | Select | 是 | STRING / INTEGER / LONG / DOUBLE / BOOLEAN / LIST / JSON |
| 校验类型 | Select | 否 | 见 3.3 校验规则详情 |
| 校验参数 | Input | 条件 | 仅 LENGTH / REGEX 需要填写 |

**不包含**提取路径——提取路径是接入点级别的配置，不在全局字典中。

### 3.3 校验规则详情

对应后端 `ValidateServiceImpl` 的校验逻辑：

| 校验类型 | 中文标签 | 是否需要 validateArgs | 校验说明 |
|---|---|---|---|
| （空） | 不校验 | 否 | 不执行任何校验 |
| STRING | 字符串 | 否 | 检查值是否为字符串类型 |
| INTEGER | 整数 | 否 | 检查值是否可解析为整数 |
| LONG | 长整数 | 否 | 检查值是否可解析为长整数 |
| DOUBLE | 数字 | 否 | 检查值是否可解析为数字 |
| BOOLEAN | 布尔 | 否 | 检查值是否为 true/false |
| LENGTH | 长度校验 | 是（目标长度） | 检查字符串长度是否等于 validateArgs |
| MOBILE | 手机号 | 否 | 检查是否为合法手机号格式 |
| EMAIL | 邮箱 | 否 | 检查是否为合法邮箱格式 |
| IP | IP 地址 | 否 | 检查是否为合法 IPv4/IPv6 地址 |
| REGEX | 正则表达式 | 是（正则模式） | 用 validateArgs 作为正则，校验值是否匹配 |

**前端交互细节**：
- 校验类型选择 LENGTH 或 REGEX 时，校验参数输入框变为必填，placeholder 分别为"请输入目标长度"和"请输入正则表达式"
- 选择其他校验类型时，校验参数输入框变为禁用状态并清空
- 选择"不校验"时隐藏校验参数

### 3.4 前端校验（保存前）

| 校验项 | 规则 |
|---|---|
| 标准属性名 | 非空，`/^[a-z][a-z0-9_]*$/` 格式，全局唯一 |
| 中文描述 | 非空 |
| 校验参数 | LENGTH 类型时需为正整数；REGEX 类型时需为合法正则 |

---

## 四、属性提取配置（接入点详情 Tab 1）

### 4.1 业务定位

**接入点级别的"方言翻译器"。** 配置当前接入点收到的原始 JSON 报文中，哪些字段映射到哪些标准属性。

核心关系：`标准属性（来自字典）` + `提取路径（本页配置）` = 一条属性提取规则。

### 4.2 页面层级

```
事件与策略编排 > 接入点管理 > EP00010001 登录风控
  ├── Tab 1: 属性提取配置（本节设计）
  └── Tab 2: 场景编排
```

### 4.3 ExtractionCard 组件结构

#### 区域 0：数据流预览（可折叠）

- 默认收起，点击展开
- 三栏并排：原始报文 JSON → 映射规则列表 → 标准上下文 JSON
- 用箭头动画串联三栏，直观展示"方言 → 普通话"的翻译过程
- 映射规则栏中，匹配到值的显示绿色 ✓，未匹配的显示红色删除线
- **目的**：让运营直观理解属性提取在做什么，降低认知门槛

#### 区域 1：已配置提取规则列表（表格）

| 列 | 说明 | 宽度 |
|---|---|---|
| 标准属性 | 上面蓝色 `user_id`（来自字典），下面灰色"用户ID" | 自适应 |
| 提取路径 | `properties.fromUserId`，monospace 灰底 | 自适应 |
| 类型 | 彩色标签（只读，继承自字典定义） | 80px |
| 校验规则 | 灰底标签（只读，继承自字典定义） | 130px |
| 状态 | Toggle Switch 启用/禁用 | 60px |
| 操作 | 编辑 \| 删除（Popover 二次确认） | 90px |

> **注意**：类型和校验规则列是**只读的**，数据来自标准属性字典。本页只配置"提取路径"和"启用/禁用"。

#### 区域 2：添加按钮

- 虚线框：`+ 添加属性提取规则`

#### 区域 3：内联编辑表单

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| 标准属性 | 搜索下拉单选 | 是 | 从标准属性字典中选择，显示"描述（属性名）"，已绑定的灰显 |
| 字段提取路径 | Input (monospace) | 是 | 如 `properties.fromUserId`、`eventInfo.clientIp` |

只有两个字段，非常轻量。类型和校验规则自动从字典继承，不需要重复配置。

### 4.4 不同接入点的同名属性

标准属性 `user_id` 在字典中只定义一次，但不同接入点的提取路径不同：

| 接入点 | 标准属性 | 提取路径 |
|---|---|---|
| EP00000005（提现） | `user_id` | `properties.fromUserId` |
| EP00000003（注册） | `user_id` | `properties.fromUid` |
| EP00010001（登录） | `user_id` | `properties.userId` |

这就是拆分两层的核心价值——定义一次，到处映射。

### 4.5 前端校验（保存前）

| 校验项 | 规则 |
|---|---|
| 标准属性 | 必选，同一接入点内不能重复绑定同一标准属性 |
| 字段提取路径 | 非空，建议 `properties.xxx` 或 `eventInfo.xxx` 格式 |

---

## 五、场景编排（接入点详情 Tab 2）

### 5.1 业务背景

对应后端 `risk_event_point_scene` 表 + `risk_scene_feature_action` 映射表。

**核心理念**：指挥权与执行权分离。

```
场景编排层（指挥官）
  决定：什么场景 → 对什么特征 → 做什么操作
        ↓ 下达指令
特征平台（执行者）
  只管：怎么读 / 怎么写 / 怎么删
```

### 5.2 页面层级

```
事件与策略编排 > 接入点管理 > EP00010001 登录风控
  ├── Tab 1: 属性提取配置
  └── Tab 2: 场景编排（本节设计）
        ├── SceneCard: PRE（事前）
        ├── SceneCard: PROCESS（事中）
        └── SceneCard: POST（事后）
```

### 5.3 场景编排顶部

- 标题：`场景编排`
- 右侧按钮：`+ 新增场景`（点击后在底部新增一张空白 SceneCard）
- 场景卡片按照优先级排列

### 5.4 SceneCard 组件结构

每个场景一张卡片，纵向三个区域：

#### 卡片头

- 场景标签：彩色标签 `PRE`（蓝）/ `PROCESS`（橙）/ `POST`（红）
- 场景名称：如"登录-事前"
- 特征计数：`(3 个特征)`
- 右侧操作：编辑场景名称 | 删除场景

#### 区域 1：已绑定特征列表

| 列 | 说明 | 宽度 |
|---|---|---|
| 特征信息 | 上面蓝色 `login_pre_snapshot`（可点击跳转详情），下面灰色"登录前快照" | 自适应 |
| 动作 | 彩色标签：READ(蓝) / WRITE(绿) / DELETE(红) | 80px |
| 提取属性 | `user_id`，灰底 monospace（来自 Tab 1 属性提取配置的标准属性） | 100px |
| 准入条件 | `fact.user_id != nil`，紫色 monospace。无条件显示 `-` | 自适应 |
| 操作 | 删除（Popover 二次确认） | 60px |

#### 区域 2：添加按钮

- 虚线框：`+ 添加特征配置`
- 编辑区展开时隐藏

#### 区域 3：内联编辑表单

- 背景：微灰色 + 内阴影
- **2 列 Grid 布局**：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| 特征 | 搜索下拉单选 | 是 | 显示"中文描述（英文名）"，支持模糊搜索 |
| 动作 | 下拉单选 | 是 | READ 读取 / WRITE 写入 / DELETE 删除 |
| 提取属性 | 下拉单选 | 是 | 选项来自 Tab 1 已配置的标准属性，显示"描述（属性名）" |
| 准入条件 | Input | 否 | Aviator 表达式，如 `fact.user_id != nil`（使用标准属性名） |

- 右下角：`[取消]` + `[保存]`

### 5.5 展开/收起动画

使用 CSS `grid-template-rows: 0fr → 1fr` + `transition 0.3s ease` 实现平滑展开。

```css
.expand-section { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.3s ease; }
.expand-section.open { grid-template-rows: 1fr; }
.expand-inner { overflow: hidden; }
```

不使用 `max-height` hack（估值不准会跳闪）。

### 5.6 下拉框中文规范

遵循 CLAUDE.md 要求：

- 特征下拉：`用户登录设备历史（user_login_device_history）`
- 属性下拉：`用户ID（user_id）`
- 动作下拉：`READ 读取` / `WRITE 写入` / `DELETE 删除`

---

## 六、三个模块的联动关系

```
标准属性字典（全局）
  声明：user_id (STRING, 字符串校验)
  声明：trade_amount (DOUBLE, 数字校验)
        ↓ 被接入点引用
接入点详情 — Tab 1: 属性提取配置
  绑定：user_id ← properties.fromUserId
  绑定：trade_amount ← properties.amount
        ↓ 标准属性列表传递
接入点详情 — Tab 2: 场景编排
  SceneCard PRE:
    特征 withdraw_history → WRITE → 提取属性: user_id → 条件: fact.user_id != nil
```

**关键联动点**：

| 联动 | 说明 |
|---|---|
| 字典 → 提取配置 | 提取配置的"标准属性"下拉选项来自字典 |
| 提取配置 → 场景编排 | 场景编排的"提取属性"下拉选项来自 Tab 1 已绑定的标准属性 |
| 字典 → 准入条件 | 准入条件表达式使用标准属性名（`fact.user_id`），不用原始字段名 |
| 字典删除保护 | 标准属性被接入点引用时，删除需提示"正在被 X 个接入点使用" |
| 提取配置删除保护 | 提取规则被场景-特征引用时，删除需提示"正在被 X 个特征使用" |

---

## 七、核心交互约束

**全局约束：禁止使用 Modal / Dialog / Drawer / 全屏遮罩。**

原因：运营人员在配置风控规则时需要频繁参考上下文（原始报文结构、其他属性配置、场景动作列表），所有编辑操作必须在当前卡片内部通过**内联展开（Inline Expansion）** 完成。

---

## 八、组件 Props 接口设计

### 8.1 PropertyDictionary（标准属性字典页面）

```typescript
interface StandardProperty {
  id: string;
  name: string;                // 标准属性名（全局唯一）
  description: string;         // 中文描述
  fieldType: FieldType;        // STRING | INTEGER | LONG | DOUBLE | BOOLEAN | LIST | JSON
  validateType: ValidateType;  // '' | STRING | INTEGER | ... | REGEX
  validateArgs: string;        // 校验参数
  status: 0 | 1;              // 0=禁用, 1=启用
  refCount: number;            // 被引用的接入点数量（只读）
}
```

### 8.2 ExtractionCard（属性提取配置）

```typescript
interface ExtractionCardProps {
  eventPointCode: string;
  eventPointName: string;
  initialExtractions: ExtractionItem[];
  standardProperties: StandardProperty[];  // 来自字典的标准属性列表
  samplePayload?: object;                  // 示例报文（用于数据流预览）
  onAdd: (item: ExtractionItem) => void;
  onUpdate: (item: ExtractionItem) => void;
  onRemove: (id: string) => void;
}

interface ExtractionItem {
  id: string;
  propertyId: string;          // 关联的标准属性 ID
  propertyName: string;        // 标准属性名（冗余，展示用）
  propertyDesc: string;        // 标准属性描述（冗余，展示用）
  fieldName: string;           // 字段提取路径（本接入点特有）
  status: 0 | 1;
}
```

### 8.3 SceneCard（场景编排）

```typescript
interface SceneCardProps {
  sceneName: string;
  sceneCode: string;
  sceneColor: string;
  initialFeatures: SceneFeatureItem[];
  availableFeatures: FeatureOption[];
  availableProperties: ExtractionItem[];  // 来自 Tab 1 的已绑定标准属性
  onAddFeature: (feature: SceneFeatureItem) => void;
  onRemoveFeature: (id: string) => void;
}

interface SceneFeatureItem {
  id: string;
  featureId: string;
  featureName: string;
  featureDesc: string;
  action: 'READ' | 'WRITE' | 'DELETE';
  propertyMapping: string;           // 绑定的标准属性名
  conditionExpression: string | null;// Aviator 准入条件（使用标准属性名）
}
```

---

## 九、状态管理

三个模块均采用**组件内部状态 + 回调上报**模式：

- 组件内部维护 `items` 列表、`isEditing` 状态、`formData` 临时表单
- 增删改操作先更新内部状态（乐观更新），再通过回调通知父组件
- 父组件负责持久化（API 调用）
- 不引入全局状态管理（原型阶段不需要）

Tab 1 和 Tab 2 之间的数据传递由 EP 详情页的父组件负责：Tab 1 的已绑定属性列表作为 props 传给 Tab 2 的 SceneCard。

---

## 十、视觉规范（遵循 CLAUDE.md）

| 元素 | 规范 |
|---|---|
| 按钮 | 高度 32px，圆角 6px，Primary 蓝底白字，Default 白底灰边框 |
| 表格 | 头部 `#fafafa`，行分割线 `#f0f0f0`，hover `#fafafa`，`table-layout: auto` |
| 输入框 | 高度 32px，圆角 6px，focus 蓝色边框 + 蓝色外发光 |
| 标签 | 彩色背景 + 同色文字，圆角 4px，单个不换行，多个可换行 |
| 颜色体系 | 主色 `#1890ff`，成功 `#52c41a`，警告 `#faad14`，错误 `#ff4d4f` |
| 文字 | 标题 `rgba(0,0,0,0.88)`，正文 `rgba(0,0,0,0.65)`，辅助 `rgba(0,0,0,0.45)` |
| 状态开关 | Toggle Switch（不用 Radio） |
| 删除确认 | 内联 Popover（不用 Modal） |
| 展开动画 | `grid-template-rows` 0fr→1fr，300ms ease |
| 下拉框 | 显示中文描述，支持搜索 |
| 名称+描述 | 合并为一列，上面蓝色可点击名称，下面灰色小字描述 |
