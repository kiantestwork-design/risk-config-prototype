# 属性提取增强 + 变更集发布流程 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为接入点详情页增加属性提取转换管道、增强数据流预览、实现变更集发布单流程，并为标准属性字典增加 refCount 保护。

**Architecture:** 在现有 `ep-detail-demo.html` 单文件 React 应用基础上扩展。Mock 数据中的提取规则新增 `transformers` 字段；新增转换管道配置弹框组件；重写 DataFlowVisualization 为 Pipeline 链式可视化；新增变更集状态栏和发布单页面（作为第三个 Tab）；在 `property-dictionary-demo.html` 中增加 refCount 保护逻辑。

**Tech Stack:** React 19 (UMD + Babel standalone)、Tailwind CSS (CDN)、纯前端 Mock 数据、单 HTML 文件

**设计文档:** `docs/superpowers/specs/2026-04-11-property-changeset-pipeline-design.md`

---

### Task 1: Mock 数据结构升级 — 提取规则增加 transformers 字段

**Files:**
- Modify: `ep-detail-demo.html:74-91` (MOCK_EXTRACTIONS_LOGIN / MOCK_EXTRACTIONS_WITHDRAW)
- Modify: `ep-detail-demo.html:36-58` (常量区，新增 OPERATORS 常量)

- [ ] **Step 1: 在常量区新增算子定义**

在 `VALIDATE_TYPES` 常量后面（第58行之后）新增：

```jsx
const OPERATORS = [
  { value: 'SCALE', label: '除法 SCALE', category: '数值计算', hasParam: true, paramLabel: '除数', paramKey: 'divisor' },
  { value: 'OFFSET', label: '偏移 OFFSET', category: '数值计算', hasParam: true, paramLabel: '偏移量', paramKey: 'offset' },
  { value: 'ABS', label: '绝对值 ABS', category: '数值计算', hasParam: false },
  { value: 'TO_INT', label: '转整数 TO_INT', category: '类型转换', hasParam: false },
  { value: 'TO_DOUBLE', label: '转浮点 TO_DOUBLE', category: '类型转换', hasParam: false },
  { value: 'TO_STR', label: '转字符串 TO_STR', category: '类型转换', hasParam: false },
  { value: 'FROM_WEI', label: 'Wei→Eth FROM_WEI', category: 'Web3', hasParam: false },
  { value: 'SUB_STR', label: '截取 SUB_STR', category: '字符串', hasParam: true, paramLabel: '起始,长度', paramKey: 'range' },
  { value: 'TRIM', label: '去空格 TRIM', category: '字符串', hasParam: false },
  { value: 'CUSTOM', label: '自定义表达式', category: '自定义', hasParam: true, paramLabel: '表达式 (用 val 表示值)', paramKey: 'expression' },
];
```

- [ ] **Step 2: 新增转换引擎函数**

在 OPERATORS 后面新增两个工具函数 — `applyTransformer` 执行单步转换并返回结果+类型，`runPipeline` 执行整个管道：

```jsx
// 获取值的JS类型标签
function getTypeLabel(val) {
  if (val === null || val === undefined) return 'Null';
  if (typeof val === 'number') return Number.isInteger(val) ? 'Integer' : 'Double';
  if (typeof val === 'boolean') return 'Boolean';
  if (typeof val === 'string') return 'String';
  return typeof val;
}

// 单步转换，返回 { value, type, error }
function applyTransformer(val, operator, params) {
  try {
    switch (operator) {
      case 'SCALE': {
        const n = Number(val);
        if (isNaN(n)) return { value: val, type: getTypeLabel(val), error: '无法转为数字' };
        const divisor = Number(params.divisor);
        if (!divisor) return { value: val, type: getTypeLabel(val), error: '除数不能为0' };
        const result = n / divisor;
        return { value: result, type: getTypeLabel(result), error: null };
      }
      case 'OFFSET': {
        const n = Number(val);
        if (isNaN(n)) return { value: val, type: getTypeLabel(val), error: '无法转为数字' };
        const result = n + Number(params.offset || 0);
        return { value: result, type: getTypeLabel(result), error: null };
      }
      case 'ABS': {
        const n = Number(val);
        if (isNaN(n)) return { value: val, type: getTypeLabel(val), error: '无法转为数字' };
        const result = Math.abs(n);
        return { value: result, type: getTypeLabel(result), error: null };
      }
      case 'TO_INT': {
        const n = Number(val);
        if (isNaN(n)) return { value: val, type: getTypeLabel(val), error: '无法转为数字' };
        const result = Math.floor(n);
        return { value: result, type: 'Integer', error: null };
      }
      case 'TO_DOUBLE': {
        const n = Number(val);
        if (isNaN(n)) return { value: val, type: getTypeLabel(val), error: '无法转为数字' };
        const result = parseFloat(n);
        return { value: result, type: 'Double', error: null };
      }
      case 'TO_STR': {
        const result = String(val);
        return { value: result, type: 'String', error: null };
      }
      case 'FROM_WEI': {
        const n = Number(val);
        if (isNaN(n)) return { value: val, type: getTypeLabel(val), error: '无法转为数字' };
        const result = n / 1e18;
        return { value: result, type: 'Double', error: null };
      }
      case 'SUB_STR': {
        const s = String(val);
        const [start, len] = (params.range || '0,0').split(',').map(Number);
        const result = s.substring(start, start + len);
        return { value: result, type: 'String', error: null };
      }
      case 'TRIM': {
        const result = String(val).trim();
        return { value: result, type: 'String', error: null };
      }
      case 'CUSTOM': {
        const expr = params.expression || 'val';
        try {
          const fn = new Function('val', `return (${expr});`);
          const result = fn(val);
          return { value: result, type: getTypeLabel(result), error: null };
        } catch (e) {
          return { value: val, type: getTypeLabel(val), error: `表达式错误: ${e.message}` };
        }
      }
      default:
        return { value: val, type: getTypeLabel(val), error: `未知算子: ${operator}` };
    }
  } catch (e) {
    return { value: val, type: getTypeLabel(val), error: e.message };
  }
}

// 执行整个 pipeline，返回每一步的结果数组
// [{ step: 0, label: '提取', value, type, error }, { step: 1, label: 'SCALE(100)', ... }, ...]
function runPipeline(rawValue, transformers) {
  const steps = [{
    step: 0,
    label: '提取原始值',
    value: rawValue,
    type: rawValue === undefined ? 'Null' : getTypeLabel(rawValue),
    error: rawValue === undefined ? '路径未匹配' : null,
  }];
  if (rawValue === undefined || !transformers || transformers.length === 0) return steps;
  let current = rawValue;
  transformers.forEach((t, i) => {
    const opDef = OPERATORS.find(o => o.value === t.operator);
    const paramStr = t.params && Object.values(t.params).filter(Boolean).join(',');
    const label = paramStr ? `${t.operator}(${paramStr})` : t.operator;
    const result = applyTransformer(current, t.operator, t.params || {});
    steps.push({ step: i + 1, label, value: result.value, type: result.type, error: result.error });
    if (!result.error) current = result.value;
  });
  return steps;
}
```

- [ ] **Step 3: 升级 Mock 提取规则数据，增加 transformers 字段**

将 `MOCK_EXTRACTIONS_LOGIN` 替换为（每条加 `transformers: []`，trade_amount 的提现接入点加示例转换）：

```jsx
const MOCK_EXTRACTIONS_LOGIN = [
  { id: 'e1', propertyId: '1', propertyName: 'user_id', propertyDesc: '用户ID', fieldName: 'properties.userId', transformers: [], status: 1 },
  { id: 'e2', propertyId: '6', propertyName: 'device_id', propertyDesc: '设备ID', fieldName: 'properties.deviceId', transformers: [], status: 1 },
  { id: 'e3', propertyId: '5', propertyName: 'client_ip', propertyDesc: '客户端IP', fieldName: 'properties.clientIp', transformers: [], status: 1 },
  { id: 'e4', propertyId: '7', propertyName: 'platform', propertyDesc: '登录平台', fieldName: 'properties.platform', transformers: [], status: 1 },
  { id: 'e5', propertyId: '8', propertyName: 'login_tx_id', propertyDesc: '登录事务ID', fieldName: 'properties.loginTransactionId', transformers: [], status: 1 },
  { id: 'e6', propertyId: '9', propertyName: 'sms_verified', propertyDesc: '短信验证状态', fieldName: 'properties.smsVerified', transformers: [], status: 1 },
  { id: 'e7', propertyId: '10', propertyName: 'email_verified', propertyDesc: '邮箱验证状态', fieldName: 'properties.emailVerified', transformers: [], status: 1 },
];

const MOCK_EXTRACTIONS_WITHDRAW = [
  { id: 'w1', propertyId: '1', propertyName: 'user_id', propertyDesc: '用户ID', fieldName: 'properties.fromUserId', transformers: [], status: 1 },
  { id: 'w2', propertyId: '2', propertyName: 'trade_amount', propertyDesc: '交易金额', fieldName: 'properties.amount', transformers: [
    { operator: 'SCALE', params: { divisor: '100' } },
    { operator: 'TO_DOUBLE', params: {} },
  ], status: 1 },
  { id: 'w3', propertyId: '3', propertyName: 'target_address', propertyDesc: '提现目标地址', fieldName: 'properties.toAddress', transformers: [], status: 1 },
  { id: 'w4', propertyId: '4', propertyName: 'asset_type', propertyDesc: '币种', fieldName: 'properties.assetType', transformers: [], status: 1 },
  { id: 'w5', propertyId: '5', propertyName: 'client_ip', propertyDesc: '客户端IP', fieldName: 'eventInfo.clientIp', transformers: [], status: 1 },
  { id: 'w6', propertyId: '11', propertyName: 'request_id', propertyDesc: '请求唯一标识', fieldName: 'eventInfo.requestId', transformers: [], status: 1 },
];
```

- [ ] **Step 4: 确认页面正常渲染**

在浏览器中打开 `ep-detail-demo.html`，确认：
- 页面无报错
- 两个接入点的提取规则表格正常显示
- 切换接入点数据正确切换

- [ ] **Step 5: Commit**

```bash
git add ep-detail-demo.html
git commit -m "feat: 新增算子常量、转换引擎、Mock数据升级transformers字段"
```

---

### Task 2: 提取规则表格增加"转换规则"列

**Files:**
- Modify: `ep-detail-demo.html` — ExtractionCard 组件的表格 thead 和 tbody

- [ ] **Step 1: 新增 TransformerTags 展示组件**

在 `ValidateTag` 组件后面新增（用于在表格中展示算子 tag）：

```jsx
function TransformerTags({ transformers }) {
  if (!transformers || transformers.length === 0) {
    return <span className="text-xs text-[rgba(0,0,0,0.25)]">—</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {transformers.map((t, i) => {
        const paramStr = t.params && Object.values(t.params).filter(Boolean).join(',');
        const label = paramStr ? `${t.operator}(${paramStr})` : t.operator;
        return (
          <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono whitespace-nowrap flex-shrink-0 text-[#1890ff] bg-[#e6f7ff] border border-[#91d5ff]">
            {label}
          </span>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: 修改表格 thead，在"类型"列后面插入"转换规则"列**

将 ExtractionCard 表格 thead（约第522-530行）替换为：

```jsx
<thead>
  <tr className="bg-[#fafafa] border-b border-[#f0f0f0]">
    <th className="px-3 py-3 text-left text-xs font-medium text-[rgba(0,0,0,0.65)]">标准属性</th>
    <th className="px-3 py-3 text-left text-xs font-medium text-[rgba(0,0,0,0.65)]">提取路径</th>
    <th className="px-3 py-3 text-left text-xs font-medium text-[rgba(0,0,0,0.65)]">类型</th>
    <th className="px-3 py-3 text-left text-xs font-medium text-[rgba(0,0,0,0.65)]">转换规则</th>
    <th className="px-3 py-3 text-left text-xs font-medium text-[rgba(0,0,0,0.65)]">校验规则</th>
    <th className="px-3 py-3 text-center text-xs font-medium text-[rgba(0,0,0,0.65)] w-[90px]">状态</th>
    <th className="px-3 py-3 text-center text-xs font-medium text-[rgba(0,0,0,0.65)] w-[100px]">操作</th>
  </tr>
</thead>
```

- [ ] **Step 3: 修改表格 tbody，在类型列后面插入转换规则列**

在每行的 `<FieldTypeTag>` 所在的 `<td>` 后面，增加一个新的 `<td>`：

```jsx
<td className="px-3 py-3">
  <TransformerTags transformers={ext.transformers} />
</td>
```

同时将所有 `colSpan={6}` 改为 `colSpan={7}`（编辑行、空状态行、新增表单）。

- [ ] **Step 4: 确认页面渲染正确**

在浏览器中打开，确认：
- 登录接入点的提取规则表格显示"转换规则"列全部为"—"
- 切换到提现接入点，trade_amount 行显示 `SCALE(100)` `TO_DOUBLE` 两个蓝色 tag
- 表格无溢出，列宽合理

- [ ] **Step 5: Commit**

```bash
git add ep-detail-demo.html
git commit -m "feat: 提取规则表格新增转换规则列"
```

---

### Task 3: 转换管道配置弹框

**Files:**
- Modify: `ep-detail-demo.html` — 新增 TransformerModal 组件，修改 ExtractionCard 触发弹框

- [ ] **Step 1: 新增 Modal 基础样式**

在 `<style>` 区域（第12-25行之间）追加：

```css
.modal-overlay {
  position: fixed; inset: 0; z-index: 50;
  background: rgba(0,0,0,0.45);
  display: flex; align-items: center; justify-content: center;
  animation: fadeIn 0.15s ease;
}
.modal-card {
  background: white; border-radius: 8px; width: 720px; max-height: 85vh;
  box-shadow: 0 6px 16px rgba(0,0,0,0.08), 0 3px 6px -4px rgba(0,0,0,0.12), 0 9px 28px 8px rgba(0,0,0,0.05);
  display: flex; flex-direction: column;
  animation: zoomIn 0.2s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
```

- [ ] **Step 2: 新增 TransformerModal 组件**

在 `TransformerTags` 组件后面新增完整的弹框组件。这个组件接收一条提取规则，编辑其 `fieldName` 和 `transformers`，并实时预览 Pipeline 结果：

```jsx
function TransformerModal({ extraction, stdProp, payload, onSave, onClose }) {
  const [fieldName, setFieldName] = useState(extraction.fieldName);
  const [transformers, setTransformers] = useState(
    extraction.transformers ? extraction.transformers.map((t, i) => ({ ...t, _key: i })) : []
  );
  const [nextKey, setNextKey] = useState(extraction.transformers ? extraction.transformers.length : 0);

  // 从 payload 中按路径取值
  const getValueByPath = (obj, path) => {
    return path.split('.').reduce((o, k) => (o && o[k] !== undefined) ? o[k] : undefined, obj);
  };

  const rawValue = getValueByPath(payload, fieldName);
  const pipelineSteps = runPipeline(rawValue, transformers);
  const finalStep = pipelineSteps[pipelineSteps.length - 1];
  const hasError = pipelineSteps.some(s => s.error);

  const addStep = () => {
    setTransformers([...transformers, { operator: 'TO_STR', params: {}, _key: nextKey }]);
    setNextKey(nextKey + 1);
  };

  const removeStep = (idx) => {
    setTransformers(transformers.filter((_, i) => i !== idx));
  };

  const updateStep = (idx, field, value) => {
    setTransformers(transformers.map((t, i) => {
      if (i !== idx) return t;
      if (field === 'operator') {
        return { ...t, operator: value, params: {} };
      }
      return { ...t, params: { ...t.params, [field]: value } };
    }));
  };

  const moveStep = (idx, dir) => {
    const newArr = [...transformers];
    const target = idx + dir;
    if (target < 0 || target >= newArr.length) return;
    [newArr[idx], newArr[target]] = [newArr[target], newArr[idx]];
    setTransformers(newArr);
  };

  const handleSave = () => {
    const cleanTransformers = transformers.map(({ _key, ...rest }) => rest);
    onSave({ fieldName, transformers: cleanTransformers });
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[rgba(5,5,5,0.06)] flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-[rgba(0,0,0,0.88)]">
              编辑提取规则 — {extraction.propertyName}
            </h3>
            <span className="text-xs text-[rgba(0,0,0,0.45)]">{extraction.propertyDesc}</span>
          </div>
          <button className="text-[rgba(0,0,0,0.45)] hover:text-[rgba(0,0,0,0.88)] transition-colors" onClick={onClose}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-auto flex-1 space-y-5">
          {/* 标准属性规范（只读） */}
          <div className="bg-[#fafafa] rounded-lg p-3 border border-[#f0f0f0]">
            <div className="text-xs text-[rgba(0,0,0,0.45)] mb-2 font-medium">标准属性规范（全局字典定义）</div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-[rgba(0,0,0,0.88)]">{stdProp ? stdProp.description : '-'}</span>
              {stdProp && <FieldTypeTag type={stdProp.fieldType} />}
              {stdProp && <ValidateTag type={stdProp.validateType} args={stdProp.validateArgs} />}
            </div>
          </div>

          {/* 提取路径 */}
          <div>
            <label className="block text-xs text-[rgba(0,0,0,0.65)] mb-1 font-medium">提取路径</label>
            <input
              type="text"
              className="w-full border rounded-md px-3 h-8 text-sm font-mono outline-none bg-white transition-colors border-[#d9d9d9] focus:border-[#1890ff] focus:shadow-[0_0_0_2px_rgba(24,144,255,0.2)]"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              placeholder="如 properties.amount"
            />
          </div>

          {/* 转换管道 */}
          <div>
            <label className="block text-xs text-[rgba(0,0,0,0.65)] mb-2 font-medium">转换管道</label>
            <div className="space-y-2">
              {transformers.map((t, idx) => {
                const opDef = OPERATORS.find(o => o.value === t.operator);
                return (
                  <div key={t._key} className="flex items-center gap-2 bg-[#fafafa] rounded-md px-3 py-2 border border-[#f0f0f0]">
                    <span className="text-xs text-[rgba(0,0,0,0.45)] w-16 flex-shrink-0">Step {idx + 1}</span>
                    <select
                      className="h-7 px-2 text-sm border border-[#d9d9d9] rounded-md outline-none bg-white focus:border-[#1890ff] min-w-[160px]"
                      value={t.operator}
                      onChange={(e) => updateStep(idx, 'operator', e.target.value)}
                    >
                      {OPERATORS.map(op => (
                        <option key={op.value} value={op.value}>{op.label}</option>
                      ))}
                    </select>
                    {opDef && opDef.hasParam && opDef.paramKey !== 'expression' && (
                      <input
                        type="text"
                        className="h-7 px-2 text-sm border border-[#d9d9d9] rounded-md outline-none bg-white focus:border-[#1890ff] w-28 font-mono"
                        placeholder={opDef.paramLabel}
                        value={t.params[opDef.paramKey] || ''}
                        onChange={(e) => updateStep(idx, opDef.paramKey, e.target.value)}
                      />
                    )}
                    {opDef && opDef.paramKey === 'expression' && (
                      <input
                        type="text"
                        className="h-7 px-2 text-sm border border-[#d9d9d9] rounded-md outline-none bg-white focus:border-[#1890ff] flex-1 font-mono"
                        placeholder="val * 2 + 1"
                        value={t.params.expression || ''}
                        onChange={(e) => updateStep(idx, 'expression', e.target.value)}
                      />
                    )}
                    <div className="flex items-center gap-1 ml-auto flex-shrink-0">
                      <button className="text-[rgba(0,0,0,0.25)] hover:text-[rgba(0,0,0,0.65)] transition-colors disabled:opacity-30" disabled={idx === 0} onClick={() => moveStep(idx, -1)} title="上移">↑</button>
                      <button className="text-[rgba(0,0,0,0.25)] hover:text-[rgba(0,0,0,0.65)] transition-colors disabled:opacity-30" disabled={idx === transformers.length - 1} onClick={() => moveStep(idx, 1)} title="下移">↓</button>
                      <button className="text-[#ff4d4f] hover:text-[#ff7875] transition-colors ml-1" onClick={() => removeStep(idx)} title="删除">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              className="mt-2 h-8 px-4 text-sm rounded-md border border-dashed border-[#d9d9d9] bg-white text-[rgba(0,0,0,0.65)] hover:border-[#1890ff] hover:text-[#1890ff] transition-colors w-full"
              onClick={addStep}
            >
              + 添加转换步骤
            </button>
          </div>

          {/* 实时预览 */}
          <div>
            <label className="block text-xs text-[rgba(0,0,0,0.65)] mb-2 font-medium">实时预览（基于示例报文）</label>
            <div className="bg-[#fafafa] rounded-lg p-3 border border-[#f0f0f0] space-y-1.5">
              {pipelineSteps.map((step, i) => {
                const isError = !!step.error;
                const isLast = i === pipelineSteps.length - 1 && !hasError;
                return (
                  <div key={i} className={`flex items-center gap-2 text-xs ${isError ? 'text-[#ff4d4f]' : ''}`}>
                    <span className="text-[rgba(0,0,0,0.45)] w-6 text-right flex-shrink-0">{i + 1}.</span>
                    <span className="font-medium min-w-[100px]">{step.label}</span>
                    <span className="text-[rgba(0,0,0,0.25)]">→</span>
                    <code className={`font-mono px-1.5 py-0.5 rounded ${isError ? 'bg-[#fff2f0] text-[#ff4d4f]' : isLast ? 'bg-[#f6ffed] text-[#52c41a] font-semibold' : 'bg-white text-[rgba(0,0,0,0.65)]'}`}>
                      {isError ? step.error : JSON.stringify(step.value)}
                    </code>
                    <span className="text-[rgba(0,0,0,0.25)] text-[10px]">({step.type})</span>
                  </div>
                );
              })}
              {!hasError && stdProp && (
                <div className="flex items-center gap-2 text-xs border-t border-[#f0f0f0] pt-1.5 mt-1.5">
                  <span className="text-[rgba(0,0,0,0.45)] w-6 text-right flex-shrink-0">{pipelineSteps.length + 1}.</span>
                  <span className="font-medium min-w-[100px]">校验 ({stdProp.validateType || '无'})</span>
                  <span className="text-[rgba(0,0,0,0.25)]">→</span>
                  <span className="text-[#52c41a]">✅ 通过</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[rgba(5,5,5,0.06)] flex items-center justify-end gap-2">
          <button className="h-8 px-4 text-sm rounded-md border border-[#d9d9d9] bg-white text-[rgba(0,0,0,0.65)] hover:border-[#1890ff] hover:text-[#1890ff] transition-colors" onClick={onClose}>取消</button>
          <button className="h-8 px-4 text-sm rounded-md bg-[#1890ff] text-white border-none hover:bg-[#40a9ff] transition-colors" onClick={handleSave}>确定</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 在 ExtractionCard 中增加弹框状态和触发逻辑**

在 ExtractionCard 组件的 state 区域（约第385-392行），新增：

```jsx
const [modalExtId, setModalExtId] = useState(null);
```

新增 `handleModalSave` 函数（在 `handleDelete` 后面）：

```jsx
const handleModalSave = ({ fieldName, transformers }) => {
  setExtractions(extractions.map(e =>
    e.id === modalExtId ? { ...e, fieldName, transformers } : e
  ));
  setModalExtId(null);
};
```

- [ ] **Step 4: 修改表格"操作"列的"编辑"按钮，改为打开弹框**

将操作列中原来的编辑按钮（约第559行）：
```jsx
<button className="text-xs text-[#1890ff] hover:text-[#40a9ff] transition-colors" onClick={() => startEdit(ext)}>编辑</button>
```

替换为：
```jsx
<button className="text-xs text-[#1890ff] hover:text-[#40a9ff] transition-colors" onClick={() => setModalExtId(ext.id)}>编辑</button>
```

- [ ] **Step 5: 在 ExtractionCard 的 return 末尾渲染弹框**

在 ExtractionCard 的 return 语句的最外层 `<div>` 结束前，增加弹框渲染：

```jsx
{modalExtId && (() => {
  const ext = extractions.find(e => e.id === modalExtId);
  if (!ext) return null;
  const stdProp = lookupProp(ext.propertyId);
  return (
    <TransformerModal
      extraction={ext}
      stdProp={stdProp}
      payload={payload}
      onSave={handleModalSave}
      onClose={() => setModalExtId(null)}
    />
  );
})()}
```

- [ ] **Step 6: 移除旧的行内编辑逻辑**

由于编辑现在通过弹框进行，移除以下不再需要的代码：
- `editingId` state 及相关的 `setEditingId` 调用
- `editForm` state 及相关的 `setEditForm` 调用
- `startEdit` 函数
- `saveEdit` 函数
- `renderForm` 函数（保留给新增表单使用，或者新增也改用弹框 — 这里保留 `renderForm` 给新增用）
- 表格行中的 `editingId` 相关高亮和展开逻辑（`editing-row` class、编辑行的 `<tr>` expand-section）

实际上为了简化，保留 `renderForm` 函数给新增使用。只移除编辑相关的：
- 删除 `const [editingId, setEditingId] = useState(null);`
- 删除 `const [editForm, setEditForm] = useState({ ...emptyForm });`
- 删除 `startEdit` 函数
- 删除 `saveEdit` 函数
- 在 `useEffect` 的重置中移除 `setEditingId(null);`
- 移除表格行中的 `${editingId === ext.id ? 'editing-row' : ''}` class
- 移除每行后面的编辑展开 `<tr>`（包含 expand-section 的那个 `<tr>`）

- [ ] **Step 7: 确认弹框正常工作**

在浏览器中打开，确认：
- 点击任意提取规则的"编辑"按钮，弹框出现
- 弹框顶部显示标准属性规范（只读）
- 可以修改提取路径
- 可以添加/删除/排序转换步骤
- 实时预览正确显示 Pipeline 每步结果和类型
- 提现接入点的 trade_amount 弹框中预设了 SCALE(100) 和 TO_DOUBLE
- 点击确定后表格中的转换规则 tag 正确更新

- [ ] **Step 8: Commit**

```bash
git add ep-detail-demo.html
git commit -m "feat: 转换管道配置弹框（算子编辑+实时预览）"
```

---

### Task 4: 数据流预览增强 — Pipeline 链式可视化

**Files:**
- Modify: `ep-detail-demo.html` — 重写 DataFlowVisualization 组件

- [ ] **Step 1: 重写 DataFlowVisualization 组件**

将原有的三列布局（原始报文 → 映射规则 → 标准上下文）替换为增强版。新版本为每条启用的提取规则展示完整的 Pipeline 链：

```jsx
function DataFlowVisualization({ extractions, payload }) {
  const [expanded, setExpanded] = useState(false);

  const getValueByPath = (obj, path) => {
    return path.split('.').reduce((o, k) => (o && o[k] !== undefined) ? o[k] : undefined, obj);
  };

  const enabledExtractions = extractions.filter(e => e.status === 1);

  // 为每条规则计算 Pipeline
  const pipelineResults = enabledExtractions.map(ext => {
    const rawValue = getValueByPath(payload, ext.fieldName);
    const steps = runPipeline(rawValue, ext.transformers);
    const finalStep = steps[steps.length - 1];
    const hasError = steps.some(s => s.error);
    const stdProp = MOCK_STANDARD_PROPERTIES.find(p => p.id === ext.propertyId);
    return { ext, steps, finalStep, hasError, stdProp };
  });

  // 构建标准上下文
  const standardContext = {};
  pipelineResults.forEach(({ ext, finalStep, hasError }) => {
    if (!hasError && finalStep.value !== undefined) {
      standardContext[ext.propertyName] = finalStep.value;
    }
  });

  const successCount = pipelineResults.filter(r => !r.hasError).length;
  const errorCount = pipelineResults.filter(r => r.hasError).length;

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm mb-4">
      <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[#fafafa] transition-colors" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-2">
          <svg className={`w-4 h-4 text-[rgba(0,0,0,0.45)] transition-transform ${expanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-sm font-medium text-[rgba(0,0,0,0.88)]">数据流预览</span>
          <span className="text-xs text-[rgba(0,0,0,0.45)]">（{enabledExtractions.length} 条规则，{successCount} 成功{errorCount > 0 ? `，${errorCount} 失败` : ''}）</span>
        </div>
      </div>
      <div className={`expand-section ${expanded ? 'open' : ''}`}>
        <div className="expand-inner">
          <div className="px-4 pb-4">
            {/* Pipeline 逐条展示 */}
            <div className="space-y-2 mb-4">
              {pipelineResults.map(({ ext, steps, hasError, stdProp }) => (
                <div key={ext.id} className={`rounded-lg border p-3 ${hasError ? 'border-[#ffccc7] bg-[#fff2f0]' : 'border-[#f0f0f0] bg-[#fafafa]'}`}>
                  {/* 属性名 + 描述 */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-[#1890ff]">{ext.propertyName}</span>
                    <span className="text-xs text-[rgba(0,0,0,0.45)]">{stdProp ? stdProp.description : ext.propertyDesc}</span>
                  </div>
                  {/* Pipeline 步骤链 */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {steps.map((step, i) => {
                      const isError = !!step.error;
                      const isLast = i === steps.length - 1 && !hasError;
                      return (
                        <React.Fragment key={i}>
                          {i > 0 && <span className="text-[rgba(0,0,0,0.25)] text-xs">→</span>}
                          {i === 0 ? (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono ${isError ? 'bg-[#fff1f0] text-[#ff4d4f] border border-[#ffa39e]' : 'bg-[#f5f5f5] text-[rgba(0,0,0,0.65)] border border-[#e8e8e8]'}`}>
                              <span className="text-[rgba(0,0,0,0.45)]">[{ext.fieldName}]</span>
                              {!isError && <span className="font-semibold">{JSON.stringify(step.value)}</span>}
                              {isError && <span className="text-[#ff4d4f]">null</span>}
                              <span className="text-[rgba(0,0,0,0.25)] text-[10px]">({step.type})</span>
                            </span>
                          ) : (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono ${isError ? 'bg-[#fff1f0] text-[#ff4d4f] border border-[#ffa39e]' : isLast ? 'bg-[#f6ffed] text-[#52c41a] border border-[#b7eb8f] font-semibold' : 'bg-[#e6f7ff] text-[#1890ff] border border-[#91d5ff]'}`}>
                              <span className={isError ? 'text-[#ff4d4f]' : 'text-[rgba(0,0,0,0.45)]'}>{step.label}</span>
                              {!isError && <span>{JSON.stringify(step.value)}</span>}
                              {isError && <span>{step.error}</span>}
                              {!isError && <span className="text-[rgba(0,0,0,0.25)] text-[10px]">({step.type})</span>}
                            </span>
                          )}
                        </React.Fragment>
                      );
                    })}
                    {!hasError && (
                      <>
                        <span className="text-[rgba(0,0,0,0.25)] text-xs">→</span>
                        <span className="text-[#52c41a] text-xs">✅</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 标准上下文输出 */}
            <div>
              <div className="text-xs text-[rgba(0,0,0,0.45)] mb-2 font-medium">标准上下文输出</div>
              <pre className="text-xs font-mono bg-[#f6ffed] rounded-lg p-3 overflow-auto max-h-[200px] border border-[#b7eb8f]" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {JSON.stringify(standardContext, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 确认增强版预览正常工作**

在浏览器中打开，确认：
- 折叠标题显示规则数量和成功/失败计数
- 展开后每条提取规则有独立的 Pipeline 行
- 登录接入点：所有属性显示 `[路径] rawValue → ✅`（无转换步骤）
- 提现接入点 trade_amount：显示 `[properties.amount] "1000" (String) → SCALE(100) 10 (Double) → TO_DOUBLE 10.0 (Double) → ✅`
- 属性描述从全局字典透出
- 路径未匹配的规则标红

- [ ] **Step 3: Commit**

```bash
git add ep-detail-demo.html
git commit -m "feat: 数据流预览增强—Pipeline链式可视化+类型标注"
```

---

### Task 5: 变更集状态栏 + Tab 入口

**Files:**
- Modify: `ep-detail-demo.html` — App 组件，新增变更集 state 和状态栏 UI

- [ ] **Step 1: 在 App 组件中新增变更集 state**

在 App 组件的 `sceneFeatures` state 后面（约第829行之后），新增：

```jsx
// 变更集 state
const [changeset, setChangeset] = useState({
  id: 'cs-001',
  entryPointId: 'EP00010001',
  status: 'DRAFT',
  version: 3,
  changes: [],
  testResult: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// 记录变更
const recordChange = (type, targetId, payload, sceneCode, dependsOn) => {
  setChangeset(prev => {
    // 如果同一个 targetId+type 已存在，更新它
    const existingIdx = prev.changes.findIndex(c => c.type === type && c.targetId === targetId);
    let newChanges;
    if (existingIdx >= 0) {
      newChanges = [...prev.changes];
      newChanges[existingIdx] = { ...newChanges[existingIdx], payload, sceneCode, dependsOn };
    } else {
      newChanges = [...prev.changes, { type, targetId, payload, sceneCode, dependsOn }];
    }
    return {
      ...prev,
      changes: newChanges,
      status: 'DRAFT',
      testResult: null,
      updatedAt: new Date().toISOString(),
    };
  });
};
```

- [ ] **Step 2: 在 EP 信息卡片下方添加变更集状态栏**

在 EP 切换按钮区域（约第902行）上方，添加变更集状态栏：

```jsx
{/* 变更集状态栏 */}
<div className="bg-white rounded-lg border border-slate-200 shadow-sm px-6 py-3 mb-4 flex items-center justify-between">
  <div className="flex items-center gap-3">
    <span className="text-sm text-[rgba(0,0,0,0.65)]">当前版本: <span className="font-mono font-medium text-[rgba(0,0,0,0.88)]">v{changeset.version - 1}</span> (线上)</span>
    {changeset.changes.length > 0 && (
      <>
        <span className="w-px h-4 bg-[#f0f0f0]"></span>
        <span className="text-sm">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs whitespace-nowrap ${changeset.status === 'DRAFT' ? 'text-[#faad14] bg-[#fffbe6] border border-[#faad1430]' : changeset.status === 'TESTED' ? 'text-[#52c41a] bg-[#f6ffed] border border-[#52c41a30]' : 'text-[#1890ff] bg-[#e6f7ff] border border-[#1890ff30]'}`}>
            {changeset.status === 'DRAFT' ? '草稿' : changeset.status === 'TESTED' ? '已测试' : changeset.status === 'READY' ? '待发布' : changeset.status}
          </span>
        </span>
        <span className="text-sm text-[rgba(0,0,0,0.65)]">{changeset.changes.length} 项变更</span>
      </>
    )}
    {changeset.changes.length === 0 && (
      <span className="text-sm text-[rgba(0,0,0,0.45)]">无待发布变更</span>
    )}
  </div>
  {changeset.changes.length > 0 && (
    <button
      className="h-8 px-4 text-sm rounded-md bg-[#1890ff] text-white border-none hover:bg-[#40a9ff] transition-colors"
      onClick={() => setActiveTab('changeset')}
    >
      查看变更集
    </button>
  )}
</div>
```

- [ ] **Step 3: Tab 栏增加"变更集"入口**

在 Tab 切换区域（约第916行），在"场景编排"按钮后面增加：

```jsx
{changeset.changes.length > 0 && (
  <button
    className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${activeTab === 'changeset' ? 'text-[#1890ff]' : 'text-[rgba(0,0,0,0.65)] hover:text-[#1890ff]'}`}
    onClick={() => setActiveTab('changeset')}
  >
    变更集
    <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] bg-[#ff4d4f] text-white">{changeset.changes.length}</span>
    {activeTab === 'changeset' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1890ff]"></div>}
  </button>
)}
```

- [ ] **Step 4: 确认状态栏和 Tab 入口显示正确**

在浏览器中打开，确认：
- 无变更时状态栏显示"无待发布变更"
- 有变更时显示变更数量和状态
- Tab 栏可见"变更集"入口（后面 Task 实现内容区）

- [ ] **Step 5: Commit**

```bash
git add ep-detail-demo.html
git commit -m "feat: 变更集状态栏和Tab入口"
```

---

### Task 6: ExtractionCard 编辑操作接入变更集记录

**Files:**
- Modify: `ep-detail-demo.html` — ExtractionCard 组件和 App 组件

- [ ] **Step 1: 给 ExtractionCard 传入 recordChange**

在 App 组件中，修改 ExtractionCard 的 props（约第935行）：

```jsx
<ExtractionCard
  extractions={extractions}
  setExtractions={setExtractions}
  payload={currentPayload}
  activeEP={activeEP}
  recordChange={recordChange}
/>
```

- [ ] **Step 2: ExtractionCard 接收 recordChange，在增删改时记录变更**

修改 ExtractionCard 的函数签名：

```jsx
function ExtractionCard({ extractions, setExtractions, payload, activeEP, recordChange }) {
```

修改 `saveNew` 函数，在 `setExtractions` 调用后增加：

```jsx
if (recordChange) {
  recordChange('EXTRACTION_ADD', newExt.id, {
    propertyId: newForm.propertyId,
    fieldName: newForm.fieldName,
    transformers: [],
  });
}
```

修改 `handleModalSave` 函数，在 `setExtractions` 调用后增加：

```jsx
if (recordChange) {
  recordChange('EXTRACTION_MODIFY', modalExtId, { fieldName, transformers });
}
```

修改 `handleDelete` 函数，在 `setExtractions` 调用前增加：

```jsx
if (recordChange) {
  recordChange('EXTRACTION_DELETE', id, null);
}
```

修改 StatusToggle 的 `onChange`，在 toggle 后记录变更：

将状态切换的 onChange 改为独立函数：

```jsx
const handleToggleStatus = (ext, enabled) => {
  setExtractions(extractions.map(e => e.id === ext.id ? { ...e, status: enabled ? 1 : 0 } : e));
  if (recordChange) {
    recordChange('EXTRACTION_MODIFY', ext.id, { status: enabled ? 1 : 0 });
  }
};
```

表格中调用：`onChange={(v) => handleToggleStatus(ext, v)}`

- [ ] **Step 3: 确认变更集记录生效**

在浏览器中打开，执行以下操作并确认变更集状态栏数字更新：
- 新增一条提取规则 → 状态栏显示"1 项变更"
- 编辑一条规则的转换管道 → 显示"2 项变更"
- 删除一条规则 → 显示"3 项变更"

- [ ] **Step 4: Commit**

```bash
git add ep-detail-demo.html
git commit -m "feat: 属性提取增删改接入变更集记录"
```

---

### Task 7: 变更集详情页（发布单）

**Files:**
- Modify: `ep-detail-demo.html` — 新增 ChangesetDetail 组件，App 中渲染

- [ ] **Step 1: 新增 ChangesetDetail 组件**

在 App 组件前面新增：

```jsx
function ChangesetDetail({ changeset, setChangeset, extractions, payload }) {
  const extractionChanges = changeset.changes.filter(c => c.type.startsWith('EXTRACTION_'));
  const featureChanges = changeset.changes.filter(c => c.type.startsWith('FEATURE_'));

  const addCount = (arr) => arr.filter(c => c.type.endsWith('_ADD')).length;
  const modifyCount = (arr) => arr.filter(c => c.type.endsWith('_MODIFY')).length;
  const deleteCount = (arr) => arr.filter(c => c.type.endsWith('_DELETE')).length;

  const typePrefix = (type) => {
    if (type.endsWith('_ADD')) return { label: '+', color: '#52c41a', bg: '#f6ffed' };
    if (type.endsWith('_MODIFY')) return { label: '~', color: '#1890ff', bg: '#e6f7ff' };
    if (type.endsWith('_DELETE')) return { label: '-', color: '#ff4d4f', bg: '#fff2f0' };
    return { label: '?', color: '#999', bg: '#fafafa' };
  };

  const handleDryRun = () => {
    // 模拟 Dry Run：检查所有提取规则的 Pipeline
    const results = extractions.filter(e => e.status === 1).map(ext => {
      const getValueByPath = (obj, path) => path.split('.').reduce((o, k) => (o && o[k] !== undefined) ? o[k] : undefined, obj);
      const rawValue = getValueByPath(payload, ext.fieldName);
      const steps = runPipeline(rawValue, ext.transformers);
      return { propertyName: ext.propertyName, hasError: steps.some(s => s.error) };
    });
    const allPassed = results.every(r => !r.hasError);
    setChangeset(prev => ({
      ...prev,
      status: allPassed ? 'TESTED' : 'DRAFT',
      testResult: {
        passed: allPassed,
        timestamp: new Date().toISOString(),
        details: results,
      },
    }));
  };

  const handleSubmit = () => {
    setChangeset(prev => ({ ...prev, status: 'READY' }));
  };

  const handleRollback = () => {
    setChangeset(prev => ({ ...prev, status: 'DRAFT', changes: [], testResult: null }));
  };

  const changeLabel = (c) => {
    if (c.type.startsWith('EXTRACTION_')) {
      const ext = extractions.find(e => e.id === c.targetId);
      return ext ? `${ext.propertyName} (${ext.propertyDesc})` : c.targetId;
    }
    return c.payload ? (c.payload.featureId || c.targetId) : c.targetId;
  };

  return (
    <div className="space-y-4">
      {/* 变更摘要 */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
        <h3 className="text-sm font-medium text-[rgba(0,0,0,0.88)] mb-3">变更摘要</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#fafafa] rounded-lg p-3 border border-[#f0f0f0]">
            <div className="text-xs text-[rgba(0,0,0,0.45)] mb-1">属性提取</div>
            <div className="flex items-center gap-3 text-sm">
              {addCount(extractionChanges) > 0 && <span className="text-[#52c41a]">+{addCount(extractionChanges)} 新增</span>}
              {modifyCount(extractionChanges) > 0 && <span className="text-[#1890ff]">~{modifyCount(extractionChanges)} 修改</span>}
              {deleteCount(extractionChanges) > 0 && <span className="text-[#ff4d4f]">-{deleteCount(extractionChanges)} 删除</span>}
              {extractionChanges.length === 0 && <span className="text-[rgba(0,0,0,0.25)]">无变更</span>}
            </div>
          </div>
          <div className="bg-[#fafafa] rounded-lg p-3 border border-[#f0f0f0]">
            <div className="text-xs text-[rgba(0,0,0,0.45)] mb-1">场景特征</div>
            <div className="flex items-center gap-3 text-sm">
              {addCount(featureChanges) > 0 && <span className="text-[#52c41a]">+{addCount(featureChanges)} 新增</span>}
              {modifyCount(featureChanges) > 0 && <span className="text-[#1890ff]">~{modifyCount(featureChanges)} 修改</span>}
              {deleteCount(featureChanges) > 0 && <span className="text-[#ff4d4f]">-{deleteCount(featureChanges)} 删除</span>}
              {featureChanges.length === 0 && <span className="text-[rgba(0,0,0,0.25)]">无变更</span>}
            </div>
          </div>
        </div>
      </div>

      {/* 变更明细 */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-[#f0f0f0]">
          <h3 className="text-sm font-medium text-[rgba(0,0,0,0.88)]">变更明细</h3>
        </div>
        {/* 属性提取变更 */}
        {extractionChanges.length > 0 && (
          <div className="border-b border-[#f0f0f0]">
            <div className="px-4 py-2 bg-[#fafafa] text-xs font-medium text-[rgba(0,0,0,0.65)]">
              属性提取变更 ({extractionChanges.length})
            </div>
            {extractionChanges.map((c, i) => {
              const tp = typePrefix(c.type);
              return (
                <div key={i} className="px-4 py-3 border-b border-[#f0f0f0] last:border-0 flex items-start gap-3">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded text-xs font-bold flex-shrink-0" style={{ color: tp.color, background: tp.bg, border: `1px solid ${tp.color}30` }}>{tp.label}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[rgba(0,0,0,0.88)]">{c.type.endsWith('_ADD') ? '新增' : c.type.endsWith('_MODIFY') ? '修改' : '删除'} — {changeLabel(c)}</div>
                    {c.payload && (
                      <div className="mt-1 text-xs text-[rgba(0,0,0,0.45)] space-y-0.5">
                        {c.payload.fieldName && <div>路径: <code className="font-mono bg-[#f5f5f5] px-1 rounded">{c.payload.fieldName}</code></div>}
                        {c.payload.transformers && c.payload.transformers.length > 0 && (
                          <div className="flex items-center gap-1">
                            转换: <TransformerTags transformers={c.payload.transformers} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {/* 特征变更 */}
        {featureChanges.length > 0 && (
          <div>
            <div className="px-4 py-2 bg-[#fafafa] text-xs font-medium text-[rgba(0,0,0,0.65)]">
              场景特征变更 ({featureChanges.length})
            </div>
            {featureChanges.map((c, i) => {
              const tp = typePrefix(c.type);
              return (
                <div key={i} className="px-4 py-3 border-b border-[#f0f0f0] last:border-0 flex items-start gap-3">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded text-xs font-bold flex-shrink-0" style={{ color: tp.color, background: tp.bg, border: `1px solid ${tp.color}30` }}>{tp.label}</span>
                  <div className="text-sm text-[rgba(0,0,0,0.88)]">{c.type.endsWith('_ADD') ? '新增' : c.type.endsWith('_MODIFY') ? '修改' : '删除'} — {changeLabel(c)}</div>
                </div>
              );
            })}
          </div>
        )}
        {changeset.changes.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-[rgba(0,0,0,0.25)]">暂无变更</div>
        )}
      </div>

      {/* 模拟测试 */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
        <h3 className="text-sm font-medium text-[rgba(0,0,0,0.88)] mb-3">模拟测试 (Dry Run)</h3>
        {changeset.testResult ? (
          <div className={`rounded-lg p-3 border ${changeset.testResult.passed ? 'border-[#b7eb8f] bg-[#f6ffed]' : 'border-[#ffccc7] bg-[#fff2f0]'}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-sm font-medium ${changeset.testResult.passed ? 'text-[#52c41a]' : 'text-[#ff4d4f]'}`}>
                {changeset.testResult.passed ? '✅ 全部通过' : '❌ 存在失败'}
              </span>
              <span className="text-xs text-[rgba(0,0,0,0.45)]">{new Date(changeset.testResult.timestamp).toLocaleString()}</span>
            </div>
            {changeset.testResult.details && (
              <div className="space-y-1">
                {changeset.testResult.details.map((r, i) => (
                  <div key={i} className="text-xs flex items-center gap-2">
                    <span>{r.hasError ? '❌' : '✅'}</span>
                    <span className="font-mono">{r.propertyName}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-[rgba(0,0,0,0.45)]">未测试</div>
        )}
      </div>

      {/* 操作栏 */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm px-4 py-3 flex items-center justify-end gap-2">
        {changeset.status === 'DRAFT' && (
          <button className="h-8 px-4 text-sm rounded-md bg-[#1890ff] text-white border-none hover:bg-[#40a9ff] transition-colors" onClick={handleDryRun}>
            运行测试
          </button>
        )}
        {changeset.status === 'TESTED' && (
          <>
            <button className="h-8 px-4 text-sm rounded-md border border-[#d9d9d9] bg-white text-[rgba(0,0,0,0.65)] hover:border-[#1890ff] hover:text-[#1890ff] transition-colors" onClick={handleDryRun}>
              重新测试
            </button>
            <button className="h-8 px-4 text-sm rounded-md bg-[#52c41a] text-white border-none hover:bg-[#73d13d] transition-colors" onClick={handleSubmit}>
              提交发布
            </button>
          </>
        )}
        {changeset.status === 'READY' && (
          <span className="text-sm text-[rgba(0,0,0,0.45)]">等待审批中...</span>
        )}
        {(changeset.status === 'PUBLISHED' || changeset.status === 'READY') && (
          <button className="h-8 px-4 text-sm rounded-md border border-[#ff4d4f] text-[#ff4d4f] bg-white hover:bg-[#fff2f0] transition-colors" onClick={handleRollback}>
            回滚
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 在 App 中渲染变更集 Tab 内容**

在 Tab 2 场景编排的 `</div>` 后面（约第962行），增加：

```jsx
{/* Tab 3: 变更集详情 */}
<div style={{ display: activeTab === 'changeset' ? 'block' : 'none' }}>
  <ChangesetDetail
    changeset={changeset}
    setChangeset={setChangeset}
    extractions={extractions}
    payload={currentPayload}
  />
</div>
```

- [ ] **Step 3: 确认变更集页面完整工作**

在浏览器中打开，执行以下流程：
1. 在属性提取 Tab 中做几个操作（新增、编辑、删除）
2. 点击状态栏的"查看变更集"或 Tab 切换到变更集
3. 确认变更摘要显示正确的计数
4. 确认变更明细列出每条变更
5. 点击"运行测试"，确认 Dry Run 执行并显示结果
6. 测试通过后"提交发布"按钮出现
7. 点击提交发布，状态变为 READY

- [ ] **Step 4: Commit**

```bash
git add ep-detail-demo.html
git commit -m "feat: 变更集详情页（摘要+明细+DryRun+发布操作）"
```

---

### Task 8: 标准属性字典 refCount 保护

**Files:**
- Modify: `property-dictionary-demo.html` — 删除/禁用操作增加 refCount 保护

- [ ] **Step 1: 修改删除逻辑，refCount > 0 时阻止删除**

在 `property-dictionary-demo.html` 中，修改 `handleDelete` 函数（约第359行）：

```jsx
const handleDelete = (id) => {
  const prop = properties.find(p => p.id === id);
  if (prop && prop.refCount > 0) {
    // refCount > 0 时不允许删除，这个分支理论上不会触发（按钮已禁用）
    return;
  }
  setProperties(properties.filter(p => p.id !== id));
  setDeleteConfirmId(null);
};
```

- [ ] **Step 2: 修改删除按钮，refCount > 0 时禁用并改提示**

找到操作列中的删除按钮（约第517行）和 ConfirmPopover（约第519行），替换为：

```jsx
{prop.refCount > 0 ? (
  <span className="text-xs text-[rgba(0,0,0,0.25)] cursor-not-allowed" title={`被 ${prop.refCount} 个接入点引用，无法删除`}>删除</span>
) : (
  <button className="text-xs text-[#ff4d4f] hover:text-[#ff7875] transition-colors"
    onClick={() => setDeleteConfirmId(prop.id)}>删除</button>
)}
{prop.refCount === 0 && (
  <ConfirmPopover
    visible={deleteConfirmId === prop.id}
    onConfirm={() => handleDelete(prop.id)}
    onCancel={() => setDeleteConfirmId(null)}
    message="确认删除该属性？"
  />
)}
```

- [ ] **Step 3: 修改禁用开关，refCount > 0 时阻止禁用**

找到 StatusToggle 的 onChange（约第506-514行），修改为：

```jsx
<td className="px-3 py-3 text-center">
  <StatusToggle
    enabled={prop.status === 1}
    onChange={(v) => {
      if (!v && prop.refCount > 0) {
        alert(`该属性正在被 ${prop.refCount} 个接入点引用，无法禁用`);
        return;
      }
      setProperties(properties.map(p => p.id === prop.id ? { ...p, status: v ? 1 : 0 } : p));
    }}
  />
</td>
```

- [ ] **Step 4: 确认保护逻辑正常**

在浏览器中打开 `property-dictionary-demo.html`，确认：
- `user_id` (refCount: 3) — 删除按钮灰色不可点击，hover 显示 tooltip；开关无法关闭，弹出 alert
- `request_id` (refCount: 0) — 删除按钮正常红色可点击；开关可以正常切换

- [ ] **Step 5: Commit**

```bash
git add property-dictionary-demo.html
git commit -m "feat: 标准属性字典refCount保护（禁止删除和禁用被引用属性）"
```

---

### Task 9: 新增表单也改用弹框 + 整体联调

**Files:**
- Modify: `ep-detail-demo.html` — 新增操作也通过 TransformerModal 弹框

- [ ] **Step 1: 修改新增流程**

修改 ExtractionCard，将新增操作拆为两步：先选属性+路径，再打开弹框配转换管道。

修改 `saveNew` 函数：新增时先创建提取规则（transformers 为空），然后立即打开弹框：

```jsx
const saveNew = () => {
  const errs = validateForm(newForm);
  if (Object.keys(errs).length > 0) { setErrors(errs); return; }
  const prop = MOCK_STANDARD_PROPERTIES.find(p => p.id === newForm.propertyId);
  const newExt = {
    id: String(Date.now()),
    propertyId: newForm.propertyId,
    propertyName: prop.name,
    propertyDesc: prop.description,
    fieldName: newForm.fieldName,
    transformers: [],
    status: 1,
  };
  setExtractions(prev => [...prev, newExt]);
  setAddingNew(false);
  setNewForm({ ...emptyForm });
  setErrors({});
  // 立即打开弹框编辑转换管道
  setModalExtId(newExt.id);
  if (recordChange) {
    recordChange('EXTRACTION_ADD', newExt.id, {
      propertyId: newForm.propertyId,
      fieldName: newForm.fieldName,
      transformers: [],
    });
  }
};
```

- [ ] **Step 2: 整体联调测试**

在浏览器中打开 `ep-detail-demo.html`，完整走一遍以下流程：

1. **新增提取规则**：点击"新增提取规则"→ 选属性、填路径 → 保存 → 弹框自动打开 → 添加转换步骤 → 确定
2. **编辑提取规则**：点击"编辑" → 弹框打开 → 修改路径和转换 → 实时预览正确 → 确定
3. **查看数据流预览**：展开折叠区 → 每条规则显示完整 Pipeline 链 → 类型标注正确
4. **查看变更集**：切换到变更集 Tab → 摘要计数正确 → 明细列出所有操作
5. **运行 Dry Run**：点击"运行测试" → 显示通过/失败 → 通过后"提交发布"可点击
6. **切换接入点**：切换到提现接入点 → 数据完全重置 → trade_amount 显示预设转换
7. **标准属性保护**：打开 property-dictionary-demo.html → 被引用属性无法删除/禁用

- [ ] **Step 3: Commit**

```bash
git add ep-detail-demo.html
git commit -m "feat: 新增规则流程优化+整体联调完成"
```
