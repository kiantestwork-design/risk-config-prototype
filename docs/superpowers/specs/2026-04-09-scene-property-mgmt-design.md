# 场景编排 + 属性管理 前端原型设计文档

## 一、设计目标

在风控配置平台原型中新增两个核心页面：

1. **属性管理（变量映射）**：将上游业务方的原始字段（方言）翻译为风控系统的标准属性（普通话），同时配置入参校验规则
2. **场景编排**：在接入点下管理场景（Scene），并配置每个场景下的特征挂载（读/写/删）

两者共同支撑"指挥权与执行权分离"的架构：属性层做字段归一化 + 校验 → 场景层做特征编排 → 特征层只管存取。

---

## 二、核心交互约束

**全局约束：禁止使用 Modal / Dialog / Drawer / 全屏遮罩。**

原因：运营人员在配置风控规则时需要频繁参考上下文（原始报文结构、其他属性配置、场景动作列表），所有编辑操作必须在当前卡片内部通过**内联展开（Inline Expansion）** 完成。

---

## 三、属性管理页面

### 3.1 业务背景

对应后端 `risk_property` 表 + `ValidateServiceImpl` 校验链。

**数据流三层模型：**

```
第 1 层：原始报文（上游方言）
  { "properties": { "fromUserId": "123", "amount": 1000 } }
                    ↓ PropertyPO 映射
第 2 层：标准属性上下文（风控普通话）
  { "user_id": "123", "trade_amount": 1000 }
                    ↓ 特征/规则消费
第 3 层：特征读取 / 规则判断
  特征只认 user_id，不知道上游传的是 fromUserId 还是 fromUid
```

### 3.2 页面层级与入口

属性管理位于**接入点详情页**内部（与场景编排平级的 Tab）：

```
数据配置 > 接入点管理 > EP00010001 登录风控
  ├── Tab: 属性管理（本节设计）
  └── Tab: 场景编排（下节设计）
```

### 3.3 PropertyCard 组件结构

页面核心是一个 `PropertyCard` 组件，包含以下垂直区域：

#### 区域 0：数据流预览（可折叠）

- 默认收起，点击展开
- 三栏并排：原始报文 JSON → 映射规则列表 → 标准上下文 JSON
- 用箭头动画串联三栏，直观展示"方言 → 普通话"的翻译过程
- 映射规则栏中，匹配到值的显示绿色 ✓，未匹配的显示红色删除线
- **目的**：让运营直观理解属性映射在做什么，降低认知门槛

#### 区域 1：已配置属性列表（表格）

| 列 | 说明 | 宽度 |
|---|---|---|
| 属性信息 | 上面蓝色 `user_id`（可点击），下面灰色"用户ID" | 自适应 |
| 提取路径 | `properties.fromUserId`，monospace 灰底 | 自适应 |
| 类型 | 彩色标签：STRING(蓝) / INTEGER(紫) / DOUBLE(橙) / BOOLEAN(绿) | 80px |
| 校验规则 | 灰底标签 + 参数。如 `长度校验` `42`。无校验显示 `-` | 130px |
| 状态 | Toggle Switch 开关（启用/禁用） | 60px |
| 操作 | 编辑 \| 删除（删除有 Popover 二次确认） | 90px |

**表格规范**（遵循 CLAUDE.md）：
- `table-layout: auto` + `w-full`
- 单元格 `px-2 py-2`（属性表更紧凑）
- 名称+描述合并列
- 操作列居中

#### 区域 2：添加按钮

- 虚线框：`+ 添加标准属性`
- 点击展开底部编辑区，按钮隐藏

#### 区域 3：内联编辑表单

- 背景：微灰色 `#fafafa` + 内阴影，与列表区视觉分层
- **3 列 Grid 布局**，字段如下：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| 标准属性名 | Input (monospace) | 是 | 小写字母+下划线+数字，字母开头。如 `user_id` |
| 中文描述 | Input | 是 | 如"用户ID" |
| 字段提取路径 | Input (monospace) | 是 | 如 `properties.fromUserId`、`eventInfo.clientIp` |
| 字段类型 | Select | 是 | STRING / INTEGER / LONG / DOUBLE / BOOLEAN / LIST / JSON |
| 校验类型 | Select | 否 | 见 3.4 校验规则详情 |
| 校验参数 | Input | 条件 | 仅 LENGTH / REGEX 需要填写 |

- 右下角：`[取消]` + `[保存]`

**编辑模式**：点击表格行的"编辑"按钮时，该行下方原位展开编辑表单（同一个 renderForm），行背景高亮为浅黄色 `#fffbe6`。

### 3.4 校验规则详情

对应后端 `ValidateServiceImpl` 的校验逻辑，前端需要在下拉框中提供以下校验类型：

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

### 3.5 前端校验（保存前）

| 校验项 | 规则 |
|---|---|
| 标准属性名 | 非空，`/^[a-z][a-z0-9_]*$/` 格式，同一接入点内唯一 |
| 中文描述 | 非空 |
| 字段提取路径 | 非空，建议 `properties.xxx` 或 `eventInfo.xxx` 格式 |
| 校验参数 | LENGTH 类型时需为正整数；REGEX 类型时需为合法正则 |

### 3.6 不同接入点的同名属性

同一个标准属性名（如 `user_id`）在不同接入点可以映射到不同的原始字段：

| 接入点 | 标准属性名 | 提取路径 |
|---|---|---|
| EP00000005（提现） | `user_id` | `properties.fromUserId` |
| EP00000003（注册） | `user_id` | `properties.fromUid` |
| EP00010001（登录） | `user_id` | `properties.userId` |

这就是 PropertyPO + CompositeKeyConfig 联合解决"同一概念不同方言"的核心价值。

---

## 四、场景编排页面

### 4.1 业务背景

对应后端 `risk_event_point_scene` 表 + `risk_scene_feature_action` 映射表。

**核心理念**：指挥权与执行权分离。

```
场景编排层（指挥官）
  决定：什么场景 → 对什么特征 → 做什么操作
        ↓ 下达指令
特征平台（执行者）
  只管：怎么读 / 怎么写 / 怎么删
```

### 4.2 页面层级

```
数据配置 > 接入点管理 > EP00010001 登录风控
  ├── Tab: 属性管理
  └── Tab: 场景编排（本节设计）
        ├── SceneCard: PRE（事前）
        ├── SceneCard: PROCESS（事中）
        └── SceneCard: POST（事后）
```

### 4.3 场景编排顶部

- 标题：`场景编排`
- 右侧按钮：`+ 新增场景`（点击后在底部新增一张空白 SceneCard）
- 场景卡片按照优先级排列

### 4.4 SceneCard 组件结构

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
| 提取属性 | `userId`，灰底 monospace | 100px |
| 准入条件 | `fact.userId != nil`，紫色 monospace。无条件显示 `-` | 自适应 |
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
| 提取属性 | 下拉单选 | 是 | 绑定当前接入点的 PropertyPO 列表，显示"描述（属性名）" |
| 准入条件 | Input | 否 | Aviator 表达式，如 `fact.userId != nil` |

- 右下角：`[取消]` + `[保存]`

### 4.5 展开/收起动画

使用 CSS `grid-template-rows: 0fr → 1fr` + `transition 0.3s ease` 实现平滑展开。

```css
.expand-section { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.3s ease; }
.expand-section.open { grid-template-rows: 1fr; }
.expand-inner { overflow: hidden; }
```

不使用 `max-height` hack（估值不准会跳闪）。

### 4.6 下拉框中文规范

遵循 CLAUDE.md 要求：

- 特征下拉：`用户登录设备历史（user_login_device_history）`
- 属性下拉：`用户ID（user_id）`
- 动作下拉：`READ 读取` / `WRITE 写入` / `DELETE 删除`

---

## 五、两个页面的联动关系

```
接入点详情页
  ├── Tab: 属性管理
  │     定义：user_id ← properties.fromUserId (STRING, 字符串校验)
  │     定义：trade_amount ← properties.amount (DOUBLE, 数字校验)
  │
  └── Tab: 场景编排
        └── SceneCard: PRE
              └── 特征: withdraw_history_user_24h
                    动作: WRITE
                    提取属性: user_id  ← 来自属性管理的下拉选项
                    准入条件: fact.user_id != nil  ← 用标准属性名写条件
```

**关键联动点**：
1. 场景编排中"提取属性"下拉框的选项，来自属性管理中已配置的标准属性列表
2. 准入条件表达式中使用的字段名，是标准属性名（`user_id`），不是原始字段名（`fromUserId`）
3. 属性被某个场景-特征引用时，删除需要提示"该属性正在被 X 个特征使用"

---

## 六、组件 Props 接口设计

### 6.1 PropertyCard

```typescript
interface PropertyCardProps {
  eventPointCode: string;           // 接入点编码
  eventPointName: string;           // 接入点名称
  initialProperties: PropertyItem[];// 初始属性列表
  samplePayload?: object;           // 示例原始报文（用于数据流预览）
  onAddProperty: (prop: PropertyItem) => void;
  onUpdateProperty: (prop: PropertyItem) => void;
  onRemoveProperty: (id: string) => void;
}

interface PropertyItem {
  id: string;
  name: string;                // 标准属性名
  description: string;         // 中文描述
  fieldName: string;           // 字段提取路径
  fieldType: FieldType;        // STRING | INTEGER | LONG | DOUBLE | BOOLEAN | LIST | JSON
  validateType: ValidateType;  // '' | STRING | INTEGER | ... | REGEX
  validateArgs: string;        // 校验参数
  status: 0 | 1;              // 0=禁用, 1=启用
}
```

### 6.2 SceneCard

```typescript
interface SceneCardProps {
  sceneName: string;                // 场景名称
  sceneCode: string;                // 场景编码（PRE/PROCESS/POST）
  sceneColor: string;               // 主题色
  initialFeatures: SceneFeatureItem[];
  availableFeatures: FeatureOption[];    // 可选特征列表
  availableProperties: PropertyOption[]; // 可选属性列表（来自属性管理）
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
  conditionExpression: string | null;// Aviator 准入条件
}
```

---

## 七、状态管理

两个组件均采用**组件内部状态 + 回调上报**模式：

- 组件内部维护 `items` 列表、`isEditing` 状态、`formData` 临时表单
- 增删改操作先更新内部状态（乐观更新），再通过 `onAdd/onUpdate/onRemove` 回调通知父组件
- 父组件负责持久化（API 调用）
- 不引入全局状态管理（原型阶段不需要）

---

## 八、视觉规范（遵循 CLAUDE.md）

| 元素 | 规范 |
|---|---|
| 按钮 | 高度 32px，圆角 6px，Primary 蓝底白字，Default 白底灰边框 |
| 表格 | 头部 `#fafafa`，行分割线 `#f0f0f0`，hover `#fafafa` |
| 输入框 | 高度 32px，圆角 6px，focus 蓝色边框 + 蓝色外发光 |
| 标签 | 彩色背景 + 同色文字，圆角 4px |
| 颜色体系 | 主色 `#1890ff`，成功 `#52c41a`，警告 `#faad14`，错误 `#ff4d4f` |
| 文字 | 标题 `rgba(0,0,0,0.88)`，正文 `rgba(0,0,0,0.65)`，辅助 `rgba(0,0,0,0.45)` |
| 状态开关 | Toggle Switch（不用 Radio） |
| 删除确认 | 内联 Popover（不用 Modal） |
| 展开动画 | `grid-template-rows` 0fr→1fr，300ms ease |
