// ConditionExpressionEditor - 还原自 app.js Coe/Ooe + fz/Lz 组件
// 支持递归条件组、AND/OR 逻辑切换、条件节点增删、只读模式
import { useCallback, useState, useEffect, useRef } from 'react'
import { Trash2, Layers, Plus, FolderTree, ChevronDown, Search } from 'lucide-react'
import { MOCK_PROPERTIES } from '../config/mock/properties'
import { MOCK_FEATURES } from '../config/mock/features'

const OPERATORS = [
  { value: 'EQ', label: '等于' },
  { value: 'NEQ', label: '不等于' },
  { value: 'GT', label: '大于' },
  { value: 'GTE', label: '大于等于' },
  { value: 'LT', label: '小于' },
  { value: 'LTE', label: '小于等于' },
  { value: 'IN', label: '包含在' },
  { value: 'NOT_IN', label: '不包含在' },
  { value: 'CONTAINS', label: '包含' },
  { value: 'NOT_CONTAINS', label: '不包含' },
  { value: 'IS_NULL', label: '为空' },
  { value: 'IS_NOT_NULL', label: '不为空' },
  { value: 'REGEX', label: '正则匹配' },
]

const NO_VALUE_OPS = ['IS_NULL', 'IS_NOT_NULL']

// 从 mock 数据构建字段选项：属性 + 特征
function buildFieldOptions() {
  const props = MOCK_PROPERTIES.filter(p => p.status === 1).map(p => ({
    value: p.name, label: p.description, group: '属性',
  }))
  const feats = MOCK_FEATURES.map(f => ({
    value: f.name, label: f.description, group: '特征',
  }))
  return [...props, ...feats]
}

const FIELD_OPTIONS = buildFieldOptions()

let _idCounter = 0
function genId() { return `cond_${Date.now()}_${++_idCounter}` }

function newCondition() {
  return { id: genId(), type: 'condition', field: '', operator: 'EQ', value: '' }
}

function newGroup() {
  return { id: genId(), type: 'group', logic: 'AND', children: [newCondition()] }
}

function parseValue(val) {
  if (!val) return { id: genId(), type: 'group', logic: 'AND', children: [] }
  if (val.children && Array.isArray(val.children)) {
    return {
      id: val.id || genId(), type: 'group', logic: val.logic || 'AND',
      children: val.children.map(c =>
        (c.children || c.conditions || c.groups) ? parseValue(c) : { ...c, id: c.id || genId(), type: 'condition' }
      ),
    }
  }
  if (val.groups && Array.isArray(val.groups)) {
    return {
      id: val.id || genId(), type: 'group', logic: val.logic || 'AND',
      children: val.groups.map(g => {
        if (g.conditions && Array.isArray(g.conditions)) {
          return { id: g.id || genId(), type: 'group', logic: g.logic || 'AND', children: g.conditions.map(c => ({ ...c, id: c.id || genId(), type: 'condition' })) }
        }
        return parseValue(g)
      }),
    }
  }
  if (val.conditions && Array.isArray(val.conditions)) {
    return { id: val.id || genId(), type: 'group', logic: val.logic || 'AND', children: val.conditions.map(c => ({ ...c, id: c.id || genId(), type: 'condition' })) }
  }
  return { id: genId(), type: 'group', logic: val.logic || 'AND', children: [] }
}

function groupToLegacy(tree) {
  if (tree.type === 'condition') return { field: tree.field, operator: tree.operator, value: tree.value }
  const conditions = tree.children.filter(c => c.type === 'condition').map(c => ({ field: c.field, operator: c.operator, value: c.value }))
  const groups = tree.children.filter(c => c.type === 'group').map(c => groupToLegacy(c))
  const result = { logic: tree.logic }
  if (conditions.length > 0) result.conditions = conditions
  if (groups.length > 0) result.groups = groups
  return result
}

function toValue(tree) {
  if (tree.children.length === 0) return { logic: tree.logic, groups: [] }
  const allConditions = tree.children.every(c => c.type === 'condition')
  if (allConditions) {
    return { logic: tree.logic, groups: [{ logic: tree.logic, conditions: tree.children.map(c => ({ field: c.field, operator: c.operator, value: c.value })) }] }
  }
  return {
    logic: tree.logic,
    groups: tree.children.map(c => c.type === 'group' ? groupToLegacy(c) : { logic: 'AND', conditions: [{ field: c.field, operator: c.operator, value: c.value }] }),
  }
}

// AND/OR 样式配置
const LOGIC_STYLES = {
  AND: {
    gradient: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
    line: '#c7d2fe', lineActive: '#818cf8',
    shadow: 'rgba(79,70,229,0.3)', shadowLight: 'rgba(79,70,229,0.2)',
  },
  OR: {
    gradient: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
    line: '#fde68a', lineActive: '#fbbf24',
    shadow: 'rgba(217,119,6,0.3)', shadowLight: 'rgba(217,119,6,0.2)',
  },
}

function isGroup(node) { return node.type === 'group' || node.children || node.groups }

function updateInTree(root, updated) {
  if (root.id === updated.id) return updated
  if (!root.children) return root
  return { ...root, children: root.children.map(c => updateInTree(c, updated)) }
}

function removeFromTree(root, targetId) {
  if (!root.children) return root
  return { ...root, children: root.children.filter(c => c.id !== targetId).map(c => removeFromTree(c, targetId)) }
}

// 特征属性搜索下拉选择器（单选，按属性/特征分组）
function FieldSelect({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef(null)
  const inputRef = useRef(null)
  const selected = FIELD_OPTIONS.find(o => o.value === value)

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open])

  const q = query.toLowerCase()
  const filtered = FIELD_OPTIONS.filter(o =>
    o.value.toLowerCase().includes(q) || o.label.toLowerCase().includes(q)
  )
  const groups = [...new Set(filtered.map(o => o.group))].filter(Boolean)

  if (disabled) {
    return (
      <div className="pl-4 pr-2 py-2.5 text-[13px] truncate" style={{ color: '#334155', minWidth: '170px' }}>
        {selected ? selected.label : (value || '未选择')}
        {selected && <span className="ml-1.5 text-[10px] font-mono" style={{ color: '#94a3b8' }}>{selected.value}</span>}
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => { setOpen(!open); setQuery('') }}
        className="flex items-center justify-between gap-1 pl-4 pr-2 py-2.5 text-[13px] transition-all duration-150 cursor-pointer truncate"
        style={{ color: '#334155', minWidth: '170px', background: 'transparent' }}
      >
        <span className="truncate">{selected ? selected.label : (value || '选择属性')}</span>
        <ChevronDown className="w-3 h-3 shrink-0" style={{ color: '#94a3b8', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 rounded-lg overflow-hidden" style={{
          left: 0, minWidth: '260px',
          background: '#fff', border: '1px solid #e2e8f0',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <div className="flex items-center gap-1.5 px-2.5 py-2" style={{ borderBottom: '1px solid #f1f5f9' }}>
            <Search className="w-3 h-3 shrink-0" style={{ color: '#94a3b8' }} />
            <input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)}
              className="flex-1 text-xs bg-transparent border-0 outline-none placeholder-slate-300"
              placeholder="搜索属性或特征..." />
          </div>
          <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
            {filtered.length === 0 && (
              <div className="px-3 py-3 text-xs text-center" style={{ color: '#94a3b8' }}>无匹配结果</div>
            )}
            {groups.map(g => (
              <div key={g}>
                <div className="px-3 py-1 text-[10px] font-semibold tracking-wider" style={{ color: '#94a3b8', background: '#fafbfc' }}>{g}</div>
                {filtered.filter(o => o.group === g).map(o => (
                  <button key={o.value} type="button"
                    className="w-full text-left px-3 py-1.5 text-xs transition-colors duration-100 flex items-center justify-between gap-3"
                    style={{
                      background: o.value === value ? '#eef2ff' : 'transparent',
                      color: o.value === value ? '#4338ca' : '#475569',
                      fontWeight: o.value === value ? 600 : 400,
                    }}
                    onMouseEnter={e => { if (o.value !== value) e.currentTarget.style.background = '#f8fafc' }}
                    onMouseLeave={e => { if (o.value !== value) e.currentTarget.style.background = o.value === value ? '#eef2ff' : 'transparent' }}
                    onClick={() => { onChange(o.value); setOpen(false); setQuery('') }}
                  >
                    <span>{o.label}</span>
                    <span className="text-[10px] font-mono shrink-0" style={{ color: '#94a3b8' }}>{o.value}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// 条件行组件
function ConditionRow({ item, update, remove, readOnly }) {
  const setField = (key, val) => { update(tree => updateInTree(tree, { ...item, [key]: val })) }

  return (
    <div
      className="group/item flex items-center gap-0 rounded-lg transition-all duration-200"
      style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #fafbff 100%)',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      }}
      onMouseEnter={e => { e.currentTarget.style.border = '1px solid #a5b4fc'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(99,102,241,0.1), 0 1px 2px rgba(0,0,0,0.04)' }}
      onMouseLeave={e => { e.currentTarget.style.border = '1px solid #e2e8f0'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)' }}
    >
      {/* 特征属性选择 */}
      <div className="relative flex items-center" style={{ borderRight: '1px solid #f1f5f9' }}>
        <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full" style={{ background: 'linear-gradient(180deg, #818cf8, #6366f1)' }} />
        <FieldSelect value={item.field} onChange={v => setField('field', v)} disabled={readOnly} />
      </div>

      {/* 操作符 */}
      <div className="px-1.5 shrink-0" style={{ borderRight: !NO_VALUE_OPS.includes(item.operator) ? '1px solid #f1f5f9' : 'none' }}>
        <select
          className="appearance-none text-center py-1.5 px-2.5 text-xs font-medium rounded-md border-0 outline-none cursor-pointer disabled:cursor-default transition-colors duration-150"
          style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)', color: '#4338ca', minWidth: '72px' }}
          value={item.operator}
          onChange={e => {
            const op = e.target.value
            update(tree => updateInTree(tree, { ...item, operator: op, value: NO_VALUE_OPS.includes(op) ? '' : item.value }))
          }}
          disabled={readOnly}
        >
          {OPERATORS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
        </select>
      </div>

      {/* 比较值 */}
      {!NO_VALUE_OPS.includes(item.operator) && (
        <div className="flex-1 min-w-0">
          <input
            type="text"
            className="w-full px-3 py-2.5 text-[13px] bg-transparent border-0 outline-none placeholder-slate-300 disabled:text-slate-400"
            value={item.value} onChange={e => setField('value', e.target.value)}
            placeholder={item.operator === 'IN' || item.operator === 'NOT_IN' ? '逗号分隔多个值...' : '输入值...'} disabled={readOnly}
          />
        </div>
      )}

      {/* 删除按钮 */}
      {!readOnly && (
        <button type="button" onClick={() => remove(tree => removeFromTree(tree, item.id))}
          className="shrink-0 w-8 h-8 flex items-center justify-center mr-1 rounded-md transition-all duration-150 opacity-0 group-hover/item:opacity-100"
          style={{ color: '#94a3b8' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fef2f2' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent' }}
          title="删除条件"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}

// 条件组组件
function GroupNode({ group, level, update, remove, readOnly, isRoot = false }) {
  const setLogic = (logic) => { update(tree => updateInTree(tree, { ...group, logic })) }

  const addCondition = () => {
    update(tree => updateInTree(tree, { ...group, children: [...group.children, newCondition()] }))
  }

  const addSubGroup = () => {
    update(tree => updateInTree(tree, { ...group, children: [...group.children, newGroup()] }))
  }

  const style = LOGIC_STYLES[group.logic] || LOGIC_STYLES.AND
  const childCount = group.children.length

  return (
    <div className="flex gap-0 min-w-0">
      {/* 左侧：竖线 + AND/OR 切换器 */}
      <div className="flex flex-col items-center shrink-0 relative" style={{ width: '48px' }}>
        <div className="flex-1 min-h-[8px]" style={{ width: '2px', background: childCount > 0 ? style.line : 'transparent', borderRadius: '1px' }} />
        {readOnly ? (
          <div className="relative z-10 select-none whitespace-nowrap" style={{
            background: style.gradient, color: '#fff', fontSize: '10px', fontWeight: 700,
            letterSpacing: '0.05em', padding: '4px 10px', borderRadius: '10px',
            boxShadow: `0 2px 6px ${style.shadow}`,
          }}>{group.logic}</div>
        ) : (
          <div className="relative z-10 inline-flex rounded-full overflow-hidden shrink-0" style={{
            boxShadow: `0 2px 8px ${style.shadowLight}`, border: '2px solid #fff',
          }}>
            {['AND', 'OR'].map(l => (
              <button key={l} type="button" className="transition-all duration-200" style={{
                padding: '3px 10px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em',
                background: group.logic === l ? LOGIC_STYLES[l].gradient : '#f8fafc',
                color: group.logic === l ? '#fff' : '#94a3b8', cursor: 'pointer', border: 'none',
              }} onClick={() => setLogic(l)}>{l}</button>
            ))}
          </div>
        )}
        <div className="flex-1 min-h-[8px]" style={{ width: '2px', background: childCount > 0 ? style.line : 'transparent', borderRadius: '1px' }} />
      </div>

      {/* 右侧：子节点列表 */}
      <div className="flex-1 min-w-0 flex flex-col">
        {group.children.map((child) => (
          <div key={child.id} className="flex items-center min-w-0" style={{ minHeight: '42px' }}>
            {/* 水平连线 + 圆点 */}
            <div className="shrink-0 relative" style={{ width: '24px', height: '2px' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${style.line}, ${style.lineActive})`, borderRadius: '1px' }} />
              <div style={{ position: 'absolute', right: '-2px', top: '-3px', width: '8px', height: '8px', borderRadius: '50%', background: '#fff', border: `2px solid ${style.lineActive}` }} />
            </div>
            {/* 子节点内容 */}
            <div className="flex-1 min-w-0 py-[5px] ml-2">
              {isGroup(child) ? (
                <div className="relative group/subgroup rounded-xl transition-all duration-200" style={{
                  background: level < 2 ? 'linear-gradient(135deg, rgba(248,250,252,0.8) 0%, rgba(241,245,249,0.6) 100%)' : 'rgba(248,250,252,0.5)',
                  border: '1px dashed #cbd5e1', padding: '8px 8px 8px 4px',
                }}>
                  <GroupNode group={child} level={level + 1} update={update} remove={remove} readOnly={readOnly} />
                  {!readOnly && (
                    <button type="button" onClick={() => remove(tree => removeFromTree(tree, child.id))}
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-150 opacity-0 group-hover/subgroup:opacity-100"
                      style={{ background: '#fff', border: '1.5px solid #e2e8f0', color: '#94a3b8', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#fca5a5'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fef2f2' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = '#fff' }}
                      title="删除条件组"
                    ><Trash2 className="w-3 h-3" /></button>
                  )}
                </div>
              ) : (
                <ConditionRow item={child} update={update} remove={remove} readOnly={readOnly} />
              )}
            </div>
          </div>
        ))}

        {/* 添加按钮行 */}
        {!readOnly && (
          <div className="flex items-center" style={{ minHeight: '34px' }}>
            <div className="shrink-0" style={{ width: '24px', height: '2px', background: `${style.line}88`, borderRadius: '1px' }} />
            <div className="flex items-center gap-2 py-1 ml-2">
              <button type="button" onClick={addCondition}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-150"
                style={{ color: '#6366f1', background: 'rgba(238,242,255,0.7)', border: '1px dashed #c7d2fe' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#eef2ff'; e.currentTarget.style.borderColor = '#a5b4fc'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(99,102,241,0.12)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(238,242,255,0.7)'; e.currentTarget.style.borderColor = '#c7d2fe'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <Plus className="w-3 h-3" /> 条件
              </button>
              <button type="button" onClick={addSubGroup}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-150"
                style={{ color: '#8b5cf6', background: 'rgba(245,243,255,0.7)', border: '1px dashed #ddd6fe' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f5f3ff'; e.currentTarget.style.borderColor = '#c4b5fd'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(139,92,246,0.12)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(245,243,255,0.7)'; e.currentTarget.style.borderColor = '#ddd6fe'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <FolderTree className="w-3 h-3" /> 条件组
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ConditionExpressionEditor({ value, onChange, readOnly = false, label = '条件表达式' }) {
  const [tree, setTree] = useState(() => parseValue(value))
  const prevValueRef = useRef(value)

  useEffect(() => {
    if (value !== prevValueRef.current) {
      prevValueRef.current = value
      setTree(parseValue(value))
    }
  }, [value])

  const handleUpdate = useCallback((updater) => {
    setTree(prev => {
      const next = updater(prev)
      onChange(toValue(next))
      return next
    })
  }, [onChange])

  if (readOnly && (!tree.children || tree.children.length === 0)) {
    return (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-500" />{label}
        </label>
        <div className="rounded-xl p-8 text-center text-sm" style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', border: '1px dashed #cbd5e1',
        }}>
          <Layers className="w-5 h-5 mx-auto mb-2" style={{ color: '#94a3b8' }} />
          <span style={{ color: '#94a3b8' }}>无前置条件，始终执行</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
        <Layers className="w-4 h-4 text-indigo-500" />{label}
      </label>
      <div className="space-y-3">
        <div className="rounded-xl overflow-x-auto" style={{
          background: 'linear-gradient(180deg, rgba(248,250,252,0.6) 0%, rgba(241,245,249,0.4) 100%)',
          border: '1px solid #e2e8f0', padding: '16px 16px 12px',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)',
        }}>
          <GroupNode group={tree} level={0} update={handleUpdate} remove={handleUpdate} readOnly={readOnly} isRoot={true} />
        </div>
        {!readOnly && tree.children.length === 0 && (
          <div className="text-center pt-3 pb-1">
            <button type="button" onClick={() => handleUpdate(t => ({ ...t, children: [newCondition()] }))}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg transition-all duration-200"
              style={{ color: '#6366f1', background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)', border: '1px solid #c7d2fe', boxShadow: '0 1px 3px rgba(99,102,241,0.1)' }}
            >
              <Plus className="w-3.5 h-3.5" /> 添加第一个条件
            </button>
            <p className="text-xs mt-3" style={{ color: '#94a3b8' }}>未配置条件时，默认始终执行</p>
          </div>
        )}
      </div>
    </div>
  )
}
