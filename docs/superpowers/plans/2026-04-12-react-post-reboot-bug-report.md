# 2026-04-12 React 重启后浏览器实测缺陷清单（复核版）

## 测试方式

- 使用 Chrome 直接打开当前 React 页和 `legacy-host.html` 标准页
- 逐条进入列表页 -> 详情页 / 编辑页，直接点击、切换历史版本、查看右栏和主区字段
- 构建检查：`npm run build` 通过，仅有 chunk size warning
- 复核截图保存在：`/tmp/recheck-browser/`

## 复核结论

上次记录里有几条已经不成立，本次复核后确认：

- `rule_high_amount` 现在已经有 `v3`
- `rule_high_amount` 编辑页现在已经有 `保存草稿`、`提交待发布` 和引用影响提示
- `user_recent_trade_time_7d_rt` 当前页数据现在与 legacy 一致
- `activation_login_risk` 当前页历史版本说明和时间现在与 legacy 一致
- 条件表达式编辑器这次复核时已明显接近 legacy，未再单独记为缺陷

当前仍可稳定复现的缺陷如下。

## 缺陷列表

### 1. [特征][user_transaction_history] 历史版本链比标准页少一条

- 检查项：右侧历史版本 parity
- React：`v2`、`v1`
- Legacy：`v3`、`v2`、`v1`
- 直接现象：
  - React 缺少 legacy 的 `v3`
  - Legacy `v3` 为 `2025-10-25 15:30:00 / 草稿 / V3草稿：尝试新的压缩算法 / dev_user_new`
- 影响：历史版本链不完整
- 是否可复现：稳定复现

### 2. [特征][user_login_count_1h] 历史版本链和当前文案都与标准页不一致

- 检查项：右侧历史版本 parity / 主区文案 parity
- React：`v2`、`v1`
- Legacy：只有 `v1`
- 直接现象：
  - React 多出一条 `v2`
  - React 名称文案为 `用户每1小时登录次数`
  - Legacy 名称文案为 `用户近1小时登录次数`
  - Legacy `v1` 说明为 `初始创建登录次数特征`
- 影响：当前实体版本和文案都不是标准页行为
- 是否可复现：稳定复现

### 3. [规则][rule_freq_check] 历史版本链比标准页少一条

- 检查项：右侧历史版本 parity
- React：`v2`、`v1`
- Legacy：`v3`、`v2`、`v1`
- 直接现象：
  - React 缺少 legacy 的 `v3`
  - Legacy `v3` 为 `2025-03-30 10:00:00 / 草稿 / 下调频次阈值至 15 / 李四`
- 影响：规则历史回溯链不完整
- 是否可复现：稳定复现

### 4. [规则][rule_new_device_login] React 多出一条 legacy 不存在的 `v2`

- 检查项：右侧历史版本 parity
- React：`v2`、`v1`
- Legacy：只有 `v1`
- 直接现象：
  - React 展示 `v2 / 草稿 / 2025-03-25 16:00:00 / 增加生物识别排除条件`
  - Legacy 只有 `v1 / 草稿 / 2025-03-15 14:00:00 / 初始创建新设备登录规则`
- 影响：规则版本记录与标准页分叉
- 是否可复现：稳定复现

### 5. [规则][rule_high_amount] 历史版本元数据与标准页不一致

- 检查项：右侧历史版本内容 parity
- 结果：版本数一致，但版本内容不一致
- React：
  - `v2 / 线上 / 2025-03-28 15:00:00 / 调整阈值 / 张三`
  - 页面引用影响提示显示被 `2` 个策略引用
- Legacy：
  - `v2 / 历史 / 2025-03-15 09:20:00 / 调整阈值为 10000 / 李四`
  - 规则详情里引用方为 `1`
- 影响：
  - 历史版本内容不可信
  - 引用方数量与标准页不一致
- 是否可复现：稳定复现

### 6. [规则][rule_amount_threshold] 历史版本元数据与标准页不一致

- 检查项：右侧历史版本内容 parity
- 结果：版本数一致，但版本内容不一致
- React：
  - `v2 / 草稿 / 2025-03-30 15:00:00 / 调整金额阈值区间 / 张三`
  - `v1 / 2025-03-20 09:00:00`
- Legacy：
  - `v2 / 草稿 / 2025-03-30 15:00:00 / 调整金额阈值区间 / 李四`
  - `v1 / 2025-03-20 09:30:00`
- 影响：版本时间和操作人不对，无法视为标准页等价数据
- 是否可复现：稳定复现

### 7. [策略][activation_txn_risk_45min] 历史版本链严重缺失，且关联规则不对

- 检查项：右侧历史版本 parity / 关联规则 parity
- React：`v2`、`v1`
- Legacy：`v5`、`v4`、`v3`、`v1`
- 直接现象：
  - React 缺少 `v5`、`v4`、`v3`
  - React 关联规则为 `rule_high_amount`、`rule_freq_check`、`rule_amount_threshold`
  - Legacy 关联规则为 `rule_high_amount`、`rule_freq_check`、`rule_model_evaluation`
- 影响：
  - 历史链缺口大
  - 当前策略实际关联对象都和标准页不一致
- 是否可复现：稳定复现

### 8. [策略][activation_txn_amount_check] 历史版本链少一条，且关联规则不对

- 检查项：右侧历史版本 parity / 关联规则 parity
- React：`v2`、`v1`
- Legacy：`v3`、`v2`、`v1`
- 直接现象：
  - React 缺少 `v3 / 草稿 / 2025-04-01 16:00:00 / 下调 pass 阈值至 45 / 李四`
  - React 关联规则显示 `rule_high_amount` + `rule_amount_threshold`
  - Legacy 只关联 `rule_amount_threshold`
- 影响：
  - 历史版本链不完整
  - 规则绑定关系和标准页不一致
- 是否可复现：稳定复现

## 本轮未发现问题的项

- 接入点 4 条测试实体的历史版本数和切换结果与 legacy 一致
- `user_recent_trade_time_7d_rt` 当前展示版本和历史元数据与 legacy 一致
- `rule_model_evaluation` 历史版本链与 legacy 一致
- `activation_login_risk`、`activation_device_fingerprint` 历史版本链与 legacy 一致
- `rule_high_amount` 编辑页顶部操作区现在已恢复为 `取消 / 保存草稿 / 提交待发布`

## 总结

当前 React 版的主要问题已经集中在两类：

- **版本历史数据还原不完整**
  - 部分实体缺版本
  - 部分实体多版本
  - 部分实体版本时间、状态、操作人、说明不对
- **规则与策略的关联关系还原错误**
  - `activation_txn_risk_45min`
  - `activation_txn_amount_check`
  - 连带导致规则页引用提示也和标准页不一致
