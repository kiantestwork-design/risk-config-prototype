# 规则与策略集多对多改造 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将规则从策略集的附属实体改造为独立实体，建立多对多关联关系，支持规则复用和策略集级别的优先级/权重管理。

**Architecture:** 所有代码在单文件 `app.js` 中。新增 `Ar`（ActivationRule 关联表）mock 数据数组。改造 `Or`（规则）mock 数据去除 `activationName`/`eventPoint`/`priority` 字段。改造 `rlRenderForm`（规则编辑）、`acRenderForm`（策略集编辑/详情）、规则列表搜索筛选、规则详情展示。新增策略集详情页的「关联规则面板」和「添加规则弹框」。

**Tech Stack:** React (JSX runtime), Tailwind CSS, 内联在 app.js 中的组件

**Design Spec:** `docs/superpowers/specs/2026-04-07-rule-activation-many-to-many-design.md`

---

## File Structure

所有变更都在单一文件中：

- **Modify:** `app.js` — 唯一的源文件，包含所有 mock 数据、组件和渲染逻辑

关键代码位置（行号为近似值，因为长行会跨越多个逻辑段落）：
- Line 42: 所有 mock 数据定义（`Or` 规则, `gr` 策略集, `rn` 接入点, `Ks` 动作等）
- Line 263~339: `acRenderStatus`, `acRenderForm`（策略集渲染）
- Line 271: `relatedRules=Or.filter(x=>x.activationName===e.name)` — 策略集查关联规则
- Line 335~338: 策略集详情中显示关联规则列表
- Line 339: `acValidate`, `rlRenderStatus=acRenderStatus`
- Line 340~435: `rlRenderForm`（规则编辑/详情渲染）
- Line 341: 规则默认值定义（含 `activationName:"",eventPoint:"",priority:1`）
- Line 348: `_setActivation` 函数 — 规则选策略集联动
- Line 360: 规则编辑页的策略集下拉框
- Line 415: `relatedAc=gr.find(v=>v.name===e.activationName)` — 规则详情查策略集
- Line 422: 规则详情中显示「所属策略」
- Line 435: `rlValidate`

---

### Task 1: 新增 ActivationRule 关联表 mock 数据

**Files:**
- Modify: `app.js:42` (mock 数据定义区域)

- [ ] **Step 1: 在 mock 数据区域添加 `Ar` 关联表数组**

在 line 42 中，在 `Or=[...]` 定义之后插入新的 `Ar` 数组。根据现有 `Or` 数据中的 `activationName` 和 `priority` 关系提取：

```javascript
,Ar=[
  {activationName:"activation_txn_risk_45min",ruleName:"rule_high_amount",priority:10,weight:1.0},
  {activationName:"activation_txn_risk_45min",ruleName:"rule_freq_check",priority:20,weight:1.5},
  {activationName:"activation_txn_risk_45min",ruleName:"rule_model_evaluation",priority:30,weight:2.0},
  {activationName:"activation_login_risk",ruleName:"rule_new_device_login",priority:10,weight:1.0},
  {activationName:"activation_txn_amount_check",ruleName:"rule_amount_threshold",priority:10,weight:1.0}
]
```

在 line 42 中找到 `Or=[{id:1,name:"rule_high_amount"...}]` 的结尾 `]`，紧跟其后插入上述代码。

- [ ] **Step 2: 验证页面正常加载**

在浏览器打开 `index.html`，确认页面不报错，所有现有功能正常。

- [ ] **Step 3: Commit**

```bash
git add app.js
git commit -m "feat: 新增 ActivationRule 关联表 mock 数据"
```

---

### Task 2: 改造 Rule mock 数据，移除 activationName/eventPoint/priority 字段

**Files:**
- Modify: `app.js:42` (Or 数组定义)

- [ ] **Step 1: 从 Or 数组的每个规则对象中删除三个字段**

在 `Or` 数组中，对每条规则删除以下字段：
- `activationName:"activation_txn_risk_45min"` (或其他值)
- `eventPoint:"EP00000001"` (或其他值)
- `priority:N`

例如，第一条规则从：
```javascript
{id:1,name:"rule_high_amount",description:"\u5927\u989D\u4EA4\u6613\u68C0\u6D4B",activationName:"activation_txn_risk_45min",eventPoint:"EP00000001",conditionExpression:...,priority:1,actions:...}
```
改为：
```javascript
{id:1,name:"rule_high_amount",description:"\u5927\u989D\u4EA4\u6613\u68C0\u6D4B",conditionExpression:...,actions:...}
```

对全部 5 条规则执行同样操作。

- [ ] **Step 2: 验证页面加载**

页面会因为引用了 `e.activationName` 等字段而显示空值或 `-`，这是预期行为，后续 Task 会修复。确认不报 JS 错误即可。

- [ ] **Step 3: Commit**

```bash
git add app.js
git commit -m "refactor: 从 Rule mock 数据中移除 activationName/eventPoint/priority"
```

---

### Task 3: 改造策略集详情/编辑中的关联规则查询逻辑

**Files:**
- Modify: `app.js:271` (acRenderForm 中的 relatedRules 查询)
- Modify: `app.js:335~338` (策略集详情中的关联规则展示)

- [ ] **Step 1: 修改 relatedRules 查询，改用 Ar 关联表**

找到 line 271：
```javascript
let relatedRules=Or.filter(x=>x.activationName===e.name);
```

替换为：
```javascript
let relatedArs=Ar.filter(x=>x.activationName===e.name);let relatedRules=relatedArs.map(ar=>{let rl=Or.find(x=>x.name===ar.ruleName);return rl?{...rl,_priority:ar.priority,_weight:ar.weight}:null}).filter(Boolean).sort((a,b)=>a._priority-b._priority);
```

- [ ] **Step 2: 更新策略集详情中的关联规则展示，增加优先级和权重列**

找到 line 335~338 附近的关联规则展示区域：
```javascript
(0,X.jsxs)("h3",{...children:[(0,X.jsx)(Ra,{className:"w-5 h-5 text-blue-500"}),"关联规则 (",relatedRules.length,")"]}),
(0,X.jsx)("div",{className:"space-y-2",children:relatedRules.map(v=>(0,X.jsxs)("div",{className:"flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100",children:[(0,X.jsx)("span",{className:"font-medium text-sm text-slate-800",children:v.name}),(0,X.jsx)("span",{className:"text-xs px-2 py-0.5 rounded "+(v.status===1?"bg-green-50 text-green-600":"bg-red-50 text-red-600"),children:fe(v.status)})]},v.id||v.name))})
```

替换为增强版，显示优先级、权重和状态：
```javascript
(0,X.jsxs)("h3",{className:"font-semibold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3",children:[(0,X.jsx)(Ra,{className:"w-5 h-5 text-blue-500"}),"\u5173\u8054\u89C4\u5219 (",relatedRules.length,")"]}),
(0,X.jsx)("div",{className:"space-y-2",children:relatedRules.length===0?(0,X.jsx)("div",{className:"text-xs text-slate-400 text-center py-4 border border-dashed border-slate-300 rounded",children:"\u672A\u5173\u8054\u4EFB\u4F55\u89C4\u5219"})
:relatedRules.map(v=>(0,X.jsxs)("div",{className:"flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100",children:[
  (0,X.jsxs)("div",{className:"flex items-center gap-3",children:[
    (0,X.jsx)("span",{className:"font-medium text-sm text-slate-800",children:v.name}),
    (0,X.jsx)("span",{className:"text-xs text-slate-400",children:v.description})
  ]}),
  (0,X.jsxs)("div",{className:"flex items-center gap-3",children:[
    (0,X.jsxs)("span",{className:"text-xs text-slate-500",children:["\u4F18\u5148\u7EA7:",v._priority]}),
    (0,X.jsxs)("span",{className:"text-xs text-slate-500",children:["\u6743\u91CD:",v._weight]}),
    (0,X.jsx)("span",{className:"text-xs px-2 py-0.5 rounded "+(v.status===1?"bg-green-50 text-green-600":"bg-red-50 text-red-600"),children:fe(v.status)})
  ]})
]},v.id||v.name))})
```

- [ ] **Step 3: 验证策略集详情页正常展示关联规则**

打开浏览器，进入策略集 `activation_txn_risk_45min` 的详情，确认：
- 显示 3 条关联规则
- 每条显示优先级和权重
- 按优先级排序

- [ ] **Step 4: Commit**

```bash
git add app.js
git commit -m "refactor: 策略集详情改用关联表查询规则，增加优先级权重展示"
```

---

### Task 4: 策略集编辑页新增「关联规则管理面板」

**Files:**
- Modify: `app.js:263~339` (acRenderForm 编辑模式部分)

- [ ] **Step 1: 在策略集编辑模式中添加关联规则管理面板**

在 `acRenderForm` 的编辑模式 (`if(r){...}`) 返回的 JSX 中，在阈值配置区域之后、return 语句之前，添加关联规则管理面板。

需要先在 `acRenderForm` 函数内部添加状态管理和操作函数：

```javascript
let _arList=Ar.filter(x=>x.activationName===e.name).map(ar=>{let rl=Or.find(x=>x.name===ar.ruleName);return rl?{...ar,_rule:rl}:null}).filter(Boolean).sort((a,b)=>a.priority-b.priority);
let [_showRulePicker,_setShowRulePicker]=oe.useState(false);
let [_ruleSearch,_setRuleSearch]=oe.useState("");
let [_selectedNewRules,_setSelectedNewRules]=oe.useState([]);
let _allRulesForPick=Or.filter(rl=>!_arList.some(ar=>ar.ruleName===rl.name));
let _filteredPickRules=_allRulesForPick.filter(rl=>!_ruleSearch||rl.name.includes(_ruleSearch)||rl.description.includes(_ruleSearch));
let _addRules=()=>{let maxP=_arList.length>0?Math.max(..._arList.map(x=>x.priority)):0;_selectedNewRules.forEach((rn2,i)=>{Ar.push({activationName:e.name,ruleName:rn2,priority:maxP+(i+1)*10,weight:1.0})});_setSelectedNewRules([]);_setShowRulePicker(false);t("_refresh",Date.now())};
let _removeRule=(ruleName)=>{let idx=Ar.findIndex(x=>x.activationName===e.name&&x.ruleName===ruleName);if(idx>=0)Ar.splice(idx,1);t("_refresh",Date.now())};
let _updateArField=(ruleName,key,val)=>{let ar=Ar.find(x=>x.activationName===e.name&&x.ruleName===ruleName);if(ar)ar[key]=val;t("_refresh",Date.now())};
let _dragItem=oe.useRef(null);let _dragOver=oe.useRef(null);
let _handleDragEnd=()=>{if(_dragItem.current===null||_dragOver.current===null)return;let items=[..._arList];let [dragged]=items.splice(_dragItem.current,1);items.splice(_dragOver.current,0,dragged);items.forEach((it2,i)=>{let ar=Ar.find(x=>x.activationName===e.name&&x.ruleName===it2.ruleName);if(ar)ar.priority=(i+1)*10});_dragItem.current=null;_dragOver.current=null;t("_refresh",Date.now())};
```

- [ ] **Step 2: 添加关联规则面板 UI**

在编辑模式的 return JSX 中，阈值面板之后添加：

```javascript
let rulePanel=(0,X.jsxs)("div",{className:"bg-white rounded-lg border border-slate-200 shadow-sm p-6",children:[
  (0,X.jsxs)("div",{className:"flex justify-between items-center mb-4 border-b border-slate-100 pb-3",children:[
    (0,X.jsxs)("h3",{className:"font-semibold text-slate-900 flex items-center gap-2",children:[(0,X.jsx)(Ra,{className:"w-5 h-5 text-blue-500"}),"\u5173\u8054\u89C4\u5219",(0,X.jsx)("span",{className:"bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full",children:_arList.length})]}),
    (0,X.jsxs)("button",{type:"button",onClick:()=>_setShowRulePicker(true),className:"text-xs flex items-center text-white bg-indigo-500 hover:bg-indigo-600 px-3 py-1.5 rounded-md",children:[(0,X.jsx)(ft,{className:"w-3 h-3 mr-1"}),"\u6DFB\u52A0\u89C4\u5219"]})
  ]}),
  _arList.length===0?(0,X.jsx)("div",{className:"text-xs text-slate-400 text-center py-8 border border-dashed border-slate-300 rounded",children:"\u672A\u5173\u8054\u4EFB\u4F55\u89C4\u5219\uFF0C\u70B9\u51FB\u4E0A\u65B9\u201C\u6DFB\u52A0\u89C4\u5219\u201D\u6309\u94AE\u5F00\u59CB\u6DFB\u52A0"})
  :(0,X.jsxs)("div",{children:[
    (0,X.jsxs)("div",{className:"grid grid-cols-[30px_1fr_1fr_80px_80px_80px_60px] gap-2 px-3 py-2 bg-slate-50 rounded-t border border-slate-200 text-xs font-medium text-slate-500",children:[
      (0,X.jsx)("span",{}),
      (0,X.jsx)("span",{children:"\u89C4\u5219\u540D\u79F0"}),
      (0,X.jsx)("span",{children:"\u63CF\u8FF0"}),
      (0,X.jsx)("span",{className:"text-center",children:"\u4F18\u5148\u7EA7"}),
      (0,X.jsx)("span",{className:"text-center",children:"\u6743\u91CD"}),
      (0,X.jsx)("span",{className:"text-center",children:"\u72B6\u6001"}),
      (0,X.jsx)("span",{className:"text-center",children:"\u64CD\u4F5C"})
    ]}),
    (0,X.jsx)("div",{className:"border border-t-0 border-slate-200 rounded-b divide-y divide-slate-100",children:_arList.map((ar,idx)=>(0,X.jsxs)("div",{className:"grid grid-cols-[30px_1fr_1fr_80px_80px_80px_60px] gap-2 px-3 py-2.5 items-center text-sm hover:bg-slate-50 cursor-grab",draggable:true,onDragStart:()=>{_dragItem.current=idx},onDragOver:(ev)=>{ev.preventDefault();_dragOver.current=idx},onDragEnd:_handleDragEnd,children:[
      (0,X.jsx)("span",{className:"text-slate-300 cursor-grab",children:"\u2807"}),
      (0,X.jsx)("span",{className:"font-medium text-blue-600",children:ar.ruleName}),
      (0,X.jsx)("span",{className:"text-slate-500 text-xs truncate",children:ar._rule?ar._rule.description:""}),
      (0,X.jsx)("span",{className:"text-center",children:(0,X.jsx)("input",{type:"number",className:"w-14 text-center text-xs border border-slate-300 rounded px-1 py-0.5",value:ar.priority,onChange:ev=>_updateArField(ar.ruleName,"priority",parseInt(ev.target.value)||0)})}),
      (0,X.jsx)("span",{className:"text-center",children:(0,X.jsx)("input",{type:"number",step:"0.1",className:"w-14 text-center text-xs border border-slate-300 rounded px-1 py-0.5",value:ar.weight,onChange:ev=>_updateArField(ar.ruleName,"weight",parseFloat(ev.target.value)||1)})}),
      (0,X.jsx)("span",{className:"text-center",children:ar._rule?(0,X.jsx)("span",{className:"text-xs px-2 py-0.5 rounded "+(ar._rule.status===1?"bg-green-50 text-green-600 border border-green-200":"bg-red-50 text-red-500 border border-red-200"),children:fe(ar._rule.status)}):"-"}),
      (0,X.jsx)("span",{className:"text-center",children:(0,X.jsx)("button",{type:"button",onClick:()=>_removeRule(ar.ruleName),className:"text-xs text-red-500 hover:text-red-700",children:"\u79FB\u9664"})})
    ]},ar.ruleName))}),
    (0,X.jsx)("div",{className:"mt-2 text-xs text-slate-400",children:"\uD83D\uDCA1 \u62D6\u62FD \u2807 \u56FE\u6807\u8C03\u6574\u6267\u884C\u987A\u5E8F\uFF0C\u70B9\u51FB\u4F18\u5148\u7EA7/\u6743\u91CD\u6570\u5B57\u53EF\u76F4\u63A5\u7F16\u8F91"})
  ]})
]});
```

然后在编辑模式的 return 语句中将 `rulePanel` 放在阈值配置面板之后。

- [ ] **Step 3: 添加规则选择弹框**

在 `rulePanel` 之后，添加弹框组件：

```javascript
let rulePickerModal=_showRulePicker?(0,X.jsx)("div",{className:"fixed inset-0 z-50 flex items-center justify-center",children:(0,X.jsxs)(oe.Fragment,{children:[
  (0,X.jsx)("div",{className:"fixed inset-0 bg-black/45",onClick:()=>{_setShowRulePicker(false);_setSelectedNewRules([]);_setRuleSearch("")}}),
  (0,X.jsxs)("div",{className:"relative bg-white rounded-lg shadow-xl w-[520px] max-h-[70vh] flex flex-col animate-in fade-in zoom-in-95 duration-200",style:{boxShadow:"0 6px 16px rgba(0,0,0,0.08), 0 3px 6px -4px rgba(0,0,0,0.12), 0 9px 28px 8px rgba(0,0,0,0.05)"},children:[
    (0,X.jsxs)("div",{className:"px-5 py-4 border-b border-slate-100 flex justify-between items-center",children:[
      (0,X.jsx)("h3",{className:"font-semibold text-slate-900",children:"\u4ECE\u89C4\u5219\u5E93\u9009\u62E9\u89C4\u5219"}),
      (0,X.jsx)("button",{onClick:()=>{_setShowRulePicker(false);_setSelectedNewRules([]);_setRuleSearch("")},className:"text-slate-400 hover:text-slate-600",children:"\u2715"})
    ]}),
    (0,X.jsx)("div",{className:"px-5 py-3 border-b border-slate-100",children:
      (0,X.jsx)("input",{type:"text",className:"w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500",placeholder:"\u641C\u7D22\u89C4\u5219\u540D\u79F0\u6216\u63CF\u8FF0...",value:_ruleSearch,onChange:ev=>_setRuleSearch(ev.target.value)})
    }),
    (0,X.jsx)("div",{className:"flex-1 overflow-y-auto",children:_filteredPickRules.length===0?(0,X.jsx)("div",{className:"text-center py-8 text-sm text-slate-400",children:"\u6CA1\u6709\u53EF\u6DFB\u52A0\u7684\u89C4\u5219"})
    :_filteredPickRules.map(rl=>{let checked=_selectedNewRules.includes(rl.name);return(0,X.jsxs)("div",{className:"px-5 py-3 border-b border-slate-50 flex items-center gap-3 hover:bg-slate-50 cursor-pointer",onClick:()=>{_setSelectedNewRules(prev=>checked?prev.filter(x=>x!==rl.name):[...prev,rl.name])},children:[
      (0,X.jsx)("input",{type:"checkbox",checked:checked,readOnly:true,className:"accent-indigo-500"}),
      (0,X.jsxs)("div",{className:"flex-1",children:[
        (0,X.jsx)("div",{className:"text-sm font-medium text-slate-800",children:rl.name}),
        (0,X.jsx)("div",{className:"text-xs text-slate-400",children:rl.description})
      ]}),
      (0,X.jsx)("span",{className:"text-xs px-2 py-0.5 rounded "+(rl.status===1?"bg-green-50 text-green-600":"bg-slate-100 text-slate-500"),children:fe(rl.status)})
    ]},rl.name)})}),
    (0,X.jsxs)("div",{className:"px-5 py-3 border-t border-slate-100 flex justify-between items-center",children:[
      (0,X.jsxs)("span",{className:"text-xs text-slate-400",children:["\u5DF2\u9009 ",_selectedNewRules.length," \u6761\u65B0\u89C4\u5219"]}),
      (0,X.jsxs)("div",{className:"flex gap-2",children:[
        (0,X.jsx)("button",{type:"button",onClick:()=>{_setShowRulePicker(false);_setSelectedNewRules([]);_setRuleSearch("")},className:"px-4 py-1.5 text-sm border border-slate-300 rounded-md hover:bg-slate-50",children:"\u53D6\u6D88"}),
        (0,X.jsx)("button",{type:"button",onClick:_addRules,disabled:_selectedNewRules.length===0,className:"px-4 py-1.5 text-sm text-white rounded-md "+((_selectedNewRules.length>0)?"bg-indigo-500 hover:bg-indigo-600":"bg-indigo-300 cursor-not-allowed"),children:"\u786E\u8BA4\u6DFB\u52A0"})
      ]})
    ]})
  ]})
]})}):null;
```

在编辑模式的 return 中，在最外层 `children` 末尾添加 `rulePickerModal`。

- [ ] **Step 4: 验证策略集编辑页的关联规则面板**

在浏览器中：
1. 进入策略集 `activation_txn_risk_45min` 的编辑页
2. 确认关联规则面板显示 3 条规则
3. 点击「添加规则」打开弹框
4. 确认弹框中只显示未关联的规则
5. 选择一条规则并确认添加
6. 测试移除功能
7. 测试拖拽排序
8. 测试优先级/权重内联编辑

- [ ] **Step 5: Commit**

```bash
git add app.js
git commit -m "feat: 策略集编辑页新增关联规则管理面板和规则选择弹框"
```

---

### Task 5: 改造规则编辑页 — 删除策略集/接入点/优先级字段，添加引用提示

**Files:**
- Modify: `app.js:340~435` (rlRenderForm)

- [ ] **Step 1: 删除规则默认值中的废弃字段**

找到 line 341：
```javascript
let e={name:"",description:"",activationName:"",eventPoint:"",initScore:0,baseNum:0,operator:"ADD",valueField:"",max:null,rate:1,status:1,lifecycleState:"DRAFT",priority:1,actions:[],..._e0};
```

替换为（删除 `activationName`、`eventPoint`、`priority`）：
```javascript
let e={name:"",description:"",initScore:0,baseNum:0,operator:"ADD",valueField:"",max:null,rate:1,status:1,lifecycleState:"DRAFT",actions:[],..._e0};
```

- [ ] **Step 2: 删除 `_setActivation` 函数和策略集下拉框**

删除 line 348 的 `_setActivation` 函数：
```javascript
let _setActivation=(name)=>{t("activationName",name);let found=gr.find(x=>x.name===name);if(found)t("eventPoint",found.eventPoint)};
```

删除 line 360 附近的 `acField` 变量定义（策略集下拉框整个 `(0,X.jsxs)("div",{children:[...所属策略...select...]})` 块）。

- [ ] **Step 3: 删除编辑模式中的优先级输入框**

在 line 360~370 附近的 `scoreFields` 中，找到优先级字段：
```javascript
(0,X.jsxs)("div",{children:[(0,X.jsx)("label",{...children:"优先级"}),(0,X.jsx)("input",{type:"number",...value:e.priority||1,onChange:v=>t("priority",parseInt(v.target.value)||1)})]})
```

删除此字段，将 `grid grid-cols-3` 改为 `grid grid-cols-2`。

- [ ] **Step 4: 在编辑模式顶部添加引用提示栏**

在 `rlRenderForm` 函数开头（`let e={...}` 之后），添加引用关系查询：

```javascript
let _refActivations=Ar.filter(x=>x.ruleName===e.name).map(x=>{let ac=gr.find(g2=>g2.name===x.activationName);return ac?ac.name:x.activationName});
```

在编辑模式的 return JSX 最前面（第一个 `<div>` 之前），添加引用提示：

```javascript
let refBanner=_refActivations.length>0?(0,X.jsxs)("div",{className:"p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-sm",children:[
  (0,X.jsx)("span",{className:"text-amber-500 text-base mt-0.5",children:"\u26A0"}),
  (0,X.jsxs)("div",{className:"text-slate-600",children:[
    (0,X.jsxs)("strong",{className:"text-slate-800",children:["\u6B64\u89C4\u5219\u88AB ",_refActivations.length," \u4E2A\u7B56\u7565\u96C6\u5F15\u7528"]}),
    "\uFF0C\u4FEE\u6539\u5C06\u5F71\u54CD\uFF1A",
    _refActivations.map((n2,i)=>(0,X.jsxs)(oe.Fragment,{children:[(i>0?"\u3001":""),
      (0,X.jsx)("span",{className:"text-blue-600",children:n2})
    ]},n2))
  ]})
]}):null;
```

在编辑模式返回的 JSX 顶部插入 `refBanner`。

- [ ] **Step 5: 删除编辑模式 return 中对 `acField` 的引用**

在编辑模式的 return JSX 中，找到引用 `acField` 的地方，删除它。

- [ ] **Step 6: 验证规则编辑页**

在浏览器中：
1. 进入 `rule_high_amount` 的编辑页
2. 确认没有「所属策略」下拉框
3. 确认没有「优先级」字段
4. 确认没有「接入点」字段
5. 确认顶部显示橙色引用提示，列出 `activation_txn_risk_45min`

- [ ] **Step 7: Commit**

```bash
git add app.js
git commit -m "feat: 规则编辑页删除策略集/接入点/优先级字段，新增引用提示栏"
```

---

### Task 6: 改造规则详情页 — 替换所属策略为引用方列表

**Files:**
- Modify: `app.js:415~435` (rlRenderForm 详情模式部分)

- [ ] **Step 1: 删除规则详情中的「所属策略」和「接入点」字段**

找到 line 415：
```javascript
let relatedAc=gr.find(v=>v.name===e.activationName);
```
删除此行。

找到 line 422 附近的「所属策略」展示：
```javascript
(0,X.jsxs)("div",{className:"space-y-1.5",children:[(0,X.jsx)("span",{className:"text-slate-500 block text-xs",children:"所属策略"}),(0,X.jsx)("span",{className:"font-medium text-slate-900",children:e.activationName||"-"})]})
```
删除此块。

同样找到并删除「接入点」展示块：
```javascript
(0,X.jsxs)("div",{className:"space-y-1.5",children:[(0,X.jsx)("span",{className:"text-slate-500 block text-xs",children:"接入点"}),(0,X.jsx)("span",{className:"font-medium text-slate-900 font-mono",children:e.eventPoint||"-"})]})
```

同样找到并删除「优先级」展示块（如果有的话）。

- [ ] **Step 2: 在详情页底部添加「引用方」区域**

在详情模式的 return JSX 中，在最后一个 `</div>` 之前，添加引用方面板：

```javascript
(0,X.jsxs)("div",{className:"bg-white rounded-lg border border-slate-200 shadow-sm p-6",children:[
  (0,X.jsxs)("h3",{className:"font-semibold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3",children:[(0,X.jsx)(Ra,{className:"w-5 h-5 text-blue-500"}),"\u5F15\u7528\u65B9 (",_refActivations.length,")"]}),
  _refActivations.length===0?(0,X.jsx)("div",{className:"text-xs text-slate-400 text-center py-4 border border-dashed border-slate-300 rounded",children:"\u672A\u88AB\u4EFB\u4F55\u7B56\u7565\u96C6\u5F15\u7528"})
  :(0,X.jsx)("div",{className:"space-y-2",children:Ar.filter(x=>x.ruleName===e.name).map(ar=>{let ac=gr.find(g2=>g2.name===ar.activationName);return(0,X.jsxs)("div",{className:"flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100",children:[
    (0,X.jsxs)("div",{className:"flex items-center gap-3",children:[
      (0,X.jsx)("span",{className:"font-medium text-sm text-slate-800",children:ar.activationName}),
      ac?(0,X.jsx)("span",{className:"text-xs text-slate-400",children:ac.eventPoint}):null
    ]}),
    (0,X.jsxs)("div",{className:"flex items-center gap-3",children:[
      (0,X.jsxs)("span",{className:"text-xs text-slate-500",children:["\u4F18\u5148\u7EA7:",ar.priority]}),
      (0,X.jsxs)("span",{className:"text-xs text-slate-500",children:["\u6743\u91CD:",ar.weight]}),
      ac?(0,X.jsx)("span",{className:"text-xs px-2 py-0.5 rounded "+(ac.status===1?"bg-green-50 text-green-600":"bg-red-50 text-red-600"),children:fe(ac.status)}):null
    ]})
  ]},ar.activationName)})})
]})
```

注意：`_refActivations` 变量已在 Task 5 Step 4 中定义，该变量在编辑和详情模式都需要用到，确保它的定义在两个模式分支之前（在 `if(r){...}` 之前）。

- [ ] **Step 3: 验证规则详情页**

在浏览器中：
1. 进入 `rule_high_amount` 详情页
2. 确认没有「所属策略」和「接入点」字段
3. 确认底部显示「引用方」区域，列出 `activation_txn_risk_45min`
4. 确认 `rule_amount_threshold` 详情页显示引用方 `activation_txn_amount_check`

- [ ] **Step 4: Commit**

```bash
git add app.js
git commit -m "feat: 规则详情页移除所属策略/接入点，新增引用方列表"
```

---

### Task 7: 改造规则列表页筛选条件

**Files:**
- Modify: `app.js` (规则列表页的搜索筛选区域)

- [ ] **Step 1: 找到规则列表页的搜索筛选组件**

在 app.js 中搜索规则列表页的搜索筛选区域。该组件使用通用列表组件，配置了 `searchFields` 或类似的过滤配置。搜索包含 `activation.*ALL` 或 `所属策略` 的筛选下拉框。

删除以下筛选字段：
- 「所属策略」(activation) 下拉筛选
- 「接入点」(eventPoint) 下拉筛选

- [ ] **Step 2: 在规则列表中添加「引用数」列**

在规则列表表格的列定义中，添加新列：

```javascript
{key:"_refCount",label:"\u5F15\u7528\u6570",render:item=>{let cnt=Ar.filter(x=>x.ruleName===item.name).length;return(0,X.jsx)("span",{className:"text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-600",children:cnt})}}
```

- [ ] **Step 3: 从规则列表的过滤逻辑中删除 activation/eventPoint 过滤**

在列表组件的过滤逻辑中（通常是 `filter` 函数），删除对 `activationName` 和 `eventPoint` 的匹配逻辑。

- [ ] **Step 4: 验证规则列表页**

在浏览器中：
1. 打开规则列表页
2. 确认没有「所属策略」和「接入点」筛选下拉
3. 确认每条规则显示「引用数」
4. 确认 `rule_high_amount` 引用数为 1

- [ ] **Step 5: Commit**

```bash
git add app.js
git commit -m "feat: 规则列表移除策略集/接入点筛选，新增引用数列"
```

---

### Task 8: 更新规则验证逻辑

**Files:**
- Modify: `app.js:435` (rlValidate)

- [ ] **Step 1: 从验证逻辑中移除对策略集的必填校验**

找到 line 435 的 `rlValidate`：
```javascript
rlValidate=e=>{if(!e.name||!e.name.trim())return"请输入规则名称";return null}
```

当前验证逻辑只检查 name，不需要改动。但确认没有其他地方对 `activationName` 做必填校验。如果有，删除相关校验。

- [ ] **Step 2: 验证新建规则流程**

在浏览器中：
1. 在规则列表页点击「新建规则」
2. 确认编辑页没有策略集相关字段
3. 填写规则名称和条件后保存
4. 确认保存成功

- [ ] **Step 3: Commit（如果有变更）**

```bash
git add app.js
git commit -m "fix: 确保规则验证逻辑不依赖已删除的字段"
```

---

### Task 9: 最终集成测试

**Files:** 无新改动，仅验证

- [ ] **Step 1: 全流程测试 — 规则独立管理**

1. 规则列表页：查看所有规则，确认「引用数」列正确
2. 新建规则：确认无策略集/接入点字段，保存成功
3. 编辑已有规则：确认引用提示栏显示正确
4. 规则详情：确认引用方列表正确

- [ ] **Step 2: 全流程测试 — 策略集管理规则**

1. 策略集详情页：查看关联规则面板
2. 添加规则：打开弹框，搜索，勾选，确认添加
3. 拖拽排序：拖拽规则行，确认优先级自动更新
4. 修改优先级/权重：内联编辑数字
5. 移除规则：点击移除，确认列表更新

- [ ] **Step 3: 全流程测试 — 多对多关系**

1. 进入策略集 `activation_device_fingerprint`（当前无关联规则）
2. 添加 `rule_high_amount`（该规则已被 `activation_txn_risk_45min` 引用）
3. 确认添加成功
4. 回到 `rule_high_amount` 详情页，确认「引用方」显示两个策略集
5. 回到 `rule_high_amount` 编辑页，确认引用提示显示「被 2 个策略集引用」

- [ ] **Step 4: Commit 最终状态（如有修复）**

```bash
git add app.js
git commit -m "fix: 集成测试修复"
```
