# 属性提取增强 + 变更集发布流程设计

> 日期: 2026-04-11
> 状态: 已确认

## 1. 背景与目标

### 现状问题
- 属性提取配置修改即时生效，无发布管控，变更不可追溯
- 属性提取仅支持路径映射，不支持类型转换和简单计算
- 不同接入点对同一属性的原始数据格式不同（如 Long 分 vs Double 元），无法适配
- 属性变更与特征变更无法原子性上线，存在关联配置不一致的风险

### 设计目标
1. 属性提取配置纳入接入点发布单，与特征一起走变更集流程
2. 增加转换管道能力，支持链式算子转换
3. 数据流预览增强，展示完整转换过程用于排障
4. 变更集原子性发布，带依赖检查和 Dry Run 验证

## 2. 架构决策

### 2.1 属性分层架构（三层）

| 层级 | 位置 | 职责 | 发布方式 |
|------|------|------|---------|
| 标准属性字典 | 全局 | 定义属性名、标准类型、默认校验规则 | 即时生效 |
| 属性提取配置 | 接入点级 | 提取路径 + 转换管道 | 随接入点发布单 |
| 校验层 | 全局规则 | 转换后的值必须符合标准类型 | 跟随标准属性字典 |

### 2.2 核心原则

- **标准不变，适配在接入点**：全局字典定义"trade_amount 应该是 DOUBLE，单位是元"，接入点负责通过转换管道把原始数据适配成标准格式
- **校验规则不下沉**：接入点不覆盖校验，而是通过转换来满足标准校验
- **标准属性字典保护机制**：refCount > 0 时禁止删除和禁用

## 3. 变更集（Changeset）数据模型

### 3.1 数据结构

```json
{
  "id": "cs-001",
  "entryPointId": "EP00010001",
  "status": "DRAFT | TESTED | READY | PUBLISHED | ARCHIVED",
  "version": 3,
  "changes": [
    {
      "type": "EXTRACTION_ADD",
      "targetId": "temp_001",
      "payload": {
        "propertyId": "5",
        "fieldName": "meta.ip",
        "transformers": []
      }
    },
    {
      "type": "EXTRACTION_MODIFY",
      "targetId": "e1",
      "payload": {
        "fieldName": "data.uid",
        "transformers": [
          { "operator": "SCALE", "params": { "divisor": 100 } },
          { "operator": "TO_DOUBLE", "params": {} }
        ]
      }
    },
    {
      "type": "EXTRACTION_DELETE",
      "targetId": "e3",
      "payload": null
    },
    {
      "type": "FEATURE_ADD",
      "sceneCode": "PRE",
      "targetId": null,
      "dependsOn": ["temp_001"],
      "payload": {
        "featureId": "f5",
        "action": "WRITE",
        "propertyMapping": "client_ip",
        "conditionExpression": "fact.clientIp != nil"
      }
    },
    {
      "type": "FEATURE_MODIFY",
      "sceneCode": "PROCESS",
      "targetId": "sf2",
      "payload": {
        "conditionExpression": "fact.amount > 1000"
      }
    }
  ],
  "testResult": {
    "passed": true,
    "timestamp": "2026-04-11T14:30:00Z",
    "details": {}
  },
  "createdAt": "2026-04-11T10:00:00Z",
  "updatedAt": "2026-04-11T14:30:00Z"
}
```

### 3.2 变更类型

- 属性提取：`EXTRACTION_ADD` / `EXTRACTION_MODIFY` / `EXTRACTION_DELETE`
- 特征配置：`FEATURE_ADD` / `FEATURE_MODIFY` / `FEATURE_DELETE`

### 3.3 关键规则

- 每个接入点同时最多一个 DRAFT 变更集
- 编辑操作记录到变更集，不直接修改线上数据
- 发布时变更集原子性应用到线上配置
- `dependsOn` 字段声明变更项之间的依赖关系

### 3.4 状态机

```
DRAFT → [运行 Dry Run] → TESTED → [提交发布] → READY → [审批通过] → PUBLISHED
                                                                        ↓
                                                                    ARCHIVED (新版本上线后)
```

- DRAFT → TESTED：必须通过 Dry Run 模拟测试
- TESTED → READY：提交发布审批
- READY → PUBLISHED：审批通过，原子性上线
- PUBLISHED → ARCHIVED：新版本发布后，旧版本归档

## 4. 转换管道设计

### 4.1 算子清单

| 算子 | 分类 | 参数 | 说明 |
|------|------|------|------|
| `SCALE` | 数值计算 | divisor (除数) | 除法，如分→元 |
| `OFFSET` | 数值计算 | offset (偏移量) | 加减偏移 |
| `ABS` | 数值计算 | 无 | 取绝对值 |
| `TO_INT` | 类型转换 | 无 | 转整数（向下取整） |
| `TO_DOUBLE` | 类型转换 | 无 | 转浮点数 |
| `TO_STR` | 类型转换 | 无 | 转字符串 |
| `FROM_WEI` | Web3 专项 | 无 | Wei→Eth (÷10^18) |
| `SUB_STR` | 字符串处理 | start, length | 截取字符串 |
| `TRIM` | 字符串处理 | 无 | 去除首尾空格 |
| `CUSTOM` | 自定义 | expression | 自定义表达式，变量用 `val` |

### 4.2 转换执行流程

```
报文字段 → 按路径提取(Raw Extract) → 算子 Step1 → 算子 Step2 → ... → 全局校验 → 标准属性值
```

- 每一步记录中间值和数据类型
- 提取失败（null）时直接标红，不进入转换链
- 校验不通过时标红提示"转换结果不符合标准规范"

## 5. 交互设计

### 5.1 提取规则表格

在现有表格基础上新增"转换规则"列：

| 属性信息 | 提取路径 | 类型 | 转换规则 | 校验 | 状态 | 操作 |
|---------|---------|------|---------|------|------|------|
| user_id / 用户ID | `body.userId` | STRING | — | STRING | ✅ | 编辑 |
| trade_amount / 交易金额 | `body.amt` | DOUBLE | `SCALE(100)` `TO_DOUBLE` | >0 | ✅ | 编辑 |

- 无转换：显示 `—`
- 有转换：蓝色 tag 展示每个算子
- 点击 tag 或"编辑"打开配置弹框

### 5.2 转换管道配置弹框

弹框包含四个区域：

1. **标准属性规范（只读）**：展示全局字典中的类型、校验规则、描述，让运营知道转换目标
2. **提取路径**：配置报文提取路径
3. **转换管道**：链式步骤配置，每步选择算子 + 填参数，支持拖拽排序、删除、追加
4. **实时预览**：使用当前接入点示例报文自动计算，展示完整转换链

### 5.3 数据流预览（增强版）

Pipeline 链式可视化，展示完整转换过程：

```
1. 提取路径 [body.amt] → "1000" (String)
2. SCALE(100)           → "10" (String)
3. TO_DOUBLE            → 10.0 (Double)
4. 校验 (> 0)           → ✅ 通过
```

关键要点：
- 第一步展示 Raw Extract 结果，提取失败直接标红
- 每步标注数据类型（浅灰小字），防止隐式类型转换出错
- 错误环节标红，精确定位是"路径配错"还是"算子配错"
- 属性描述从全局字典透出，减少页面跳转

### 5.4 变更集发布单页面

#### 变更摘要区
- 属性提取：+N 新增 / ~N 修改 / -N 删除
- 场景特征：+N 新增 / ~N 修改 / -N 删除
- 受影响场景列表
- **Blast Radius 预览**：提示本次变更影响的决策路径覆盖比例

#### 变更明细区
- 按"属性提取变更"和"特征变更"分组
- 新增(绿 #52c41a / +)、修改(蓝 #1890ff / ~)、删除(红 #ff4d4f / -)
- 修改项只展示变化字段，`旧值 → 新值` 格式
- 删除项自动检查依赖，有引用则标红警告阻止提交
- 新增特征引用的属性如在本次变更集中新增，标注 `✅ 本次新增`

#### 模拟测试区
- Dry Run：用示例报文跑完整数据流
- 历史回溯测试（进阶）：用过去 24 小时真实线上数据验证，防大规模误杀
- 测试通过后状态变为 TESTED

#### 操作区
- DRAFT 状态：[继续编辑] [运行测试]
- TESTED 状态：[继续编辑] [重新测试] [提交发布]
- PUBLISHED 状态：[一键回滚至上一版本]

## 6. 回滚策略

- 每个 PUBLISHED 的变更集保留完整快照
- 回滚 = 执行该变更集的逆向操作
- 回滚操作生成一个新的变更集（类型为 ROLLBACK），保留审计记录
- 回滚后原变更集状态标记为 ROLLED_BACK

## 7. 改动范围

### 需要改动的页面/组件
1. **接入点详情页（ep-detail-demo.html）**
   - Tab 1 属性提取配置：增加转换规则列、配置弹框、增强数据流预览
   - 顶部：增加变更集状态栏
   - 新增：变更集详情/发布单页面

2. **标准属性字典页面（property-dictionary-demo.html）**
   - 增加 refCount > 0 时的删除/禁用保护

3. **主应用（app.js / index.html）**
   - 路由中增加变更集详情页

### 不需要改动的
- 标准属性字典的发布方式（保持即时生效）
- 场景编排的整体结构（特征已有版本管理）
