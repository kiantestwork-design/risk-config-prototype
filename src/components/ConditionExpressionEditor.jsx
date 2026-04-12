// ConditionExpressionEditor - 还原自 app.js Coe/Ooe + fz/Lz 组件
// 支持递归条件组、AND/OR 逻辑切换、条件节点增删、只读模式
import { useCallback } from 'react'
import { Trash2, Layers } from 'lucide-react'

const OPERATORS = [
  { value: 'EQ', label: '等于 (==)' },
  { value: 'NEQ', label: '不等于 (!=)' },
  { value: 'GT', label: '大于 (>)' },
  { value: 'GTE', label: '大于等于 (>=)' },
  { value: 'LT', label: '小于 (<)' },
  { value: 'LTE', label: '小于等于 (<=)' },
  { value: 'IN', label: '包含在 (IN)' },
  { value: 'NOT_IN', label: '不包含在 (NOT IN)' },
  { value: 'CONTAINS', label: '包含 (CONTAINS)' },
  { value: 'NOT_CONTAINS', label: '不包含' },
  { value: 'IS_NULL', label: '为空 (IS NULL)' },
  { value: 'IS_NOT_NULL', label: '不为空 (IS NOT NULL)' },
  { value: 'REGEX', label: '正则匹配' },
]

const NO_VALUE_OPS = ['IS_NULL', 'IS_NOT_NULL']

let _idCounter = 0
function genId() { return `cond_${Date.now()}_${++_idCounter}` }

function newCondition() {
  return { id: genId(), type: 'condition', field: '', operator: 'EQ', value: '' }
}

function newGroup() {
  return { id: genId(), type: 'group', logic: 'AND', children: [newCondition()] }
}

// 将 legacy 数据格式 { logic, groups: [{ logic, conditions: [{field,operator,value}] }] }
// 转换为内部树形结构 { type:'group', logic, children: [条件节点 | 子组] }
function parseValue(val) {
  if (!val) return { id: genId(), type: 'group', logic: 'AND', children: [] }

  // 新格式：已有 children[]
  if (val.children && Array.isArray(val.children)) {
    return {
      id: val.id || genId(),
      type: 'group',
      logic: val.logic || 'AND',
      children: val.children.map(c =>
        (c.children || c.conditions || c.groups)
          ? parseValue(c)
          : { ...c, id: c.id || genId(), type: 'condition' }
      ),
    }
  }

  // legacy 格式：groups[].conditions[]
  if (val.groups && Array.isArray(val.groups)) {
    return {
      id: val.id || genId(),
      type: 'group',
      logic: val.logic || 'AND',
      children: val.groups.map(g => {
        // 每个 group 可能有 conditions（叶子条件数组）
        if (g.conditions && Array.isArray(g.conditions)) {
          return {
            id: g.id || genId(),
            type: 'group',
            logic: g.logic || 'AND',
            children: g.conditions.map(c => ({ ...c, id: c.id || genId(), type: 'condition' })),
          }
        }
        // 也可能是嵌套组
        return parseValue(g)
      }),
    }
  }

  // 单个 group 带 conditions（非顶层）
  if (val.conditions && Array.isArray(val.conditions)) {
    return {
      id: val.id || genId(),
      type: 'group',
      logic: val.logic || 'AND',
      children: val.conditions.map(c => ({ ...c, id: c.id || genId(), type: 'condition' })),
    }
  }

  return { id: genId(), type: 'group', logic: val.logic || 'AND', children: [] }
}

// 转换子组为 legacy 格式 { logic, conditions: [...], groups: [...] }
function groupToLegacy(tree) {
  if (tree.type === 'condition') {
    return { field: tree.field, operator: tree.operator, value: tree.value }
  }
  const conditions = tree.children
    .filter(c => c.type === 'condition')
    .map(c => ({ field: c.field, operator: c.operator, value: c.value }))
  const groups = tree.children
    .filter(c => c.type === 'group')
    .map(c => groupToLegacy(c))
  const result = { logic: tree.logic }
  if (conditions.length > 0) result.conditions = conditions
  if (groups.length > 0) result.groups = groups
  return result
}

// 转换回 legacy 顶层格式，始终输出 { logic, groups: [...] }
function toValue(tree) {
  if (tree.children.length === 0) {
    return { logic: tree.logic, groups: [] }
  }
  const allConditions = tree.children.every(c => c.type === 'condition')
  if (allConditions) {
    // 顶层子节点全是条件 → 包成一个 group
    return {
      logic: tree.logic,
      groups: [{
        logic: tree.logic,
        conditions: tree.children.map(c => ({ field: c.field, operator: c.operator, value: c.value })),
      }],
    }
  }
  // 子节点包含子组 → 每个子组转为 legacy group
  return {
    logic: tree.logic,
    groups: tree.children.map(c => c.type === 'group' ? groupToLegacy(c) : { logic: 'AND', conditions: [{ field: c.field, operator: c.operator, value: c.value }] }),
  }
}

function ConditionRow({ node, onChange, onRemove, readOnly }) {
  if (readOnly) {
    const opLabel = OPERATORS.find(o => o.value === node.operator)?.label || node.operator
    return (
      <div className="flex items-center gap-2 bg-[#fafafa] border border-[#f0f0f0] rounded px-2 py-1 text-sm">
        <span className="font-mono text-[rgba(0,0,0,0.88)]">{node.field || '(未设置)'}</span>
        <span className="text-[rgba(0,0,0,0.45)]">{opLabel}</span>
        {!NO_VALUE_OPS.includes(node.operator) && (
          <span className="font-mono text-[#1890ff]">{node.value || '""'}</span>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <input type="text" value={node.field || ''} placeholder="字段路径"
        onChange={e => onChange({ ...node, field: e.target.value })}
        className="w-[180px] h-[28px] px-2 text-sm border border-[#d9d9d9] rounded hover:border-[#1890ff] focus:border-[#1890ff] focus:outline-none font-mono" />
      <select value={node.operator || 'EQ'} onChange={e => onChange({ ...node, operator: e.target.value })}
        className="h-[28px] px-2 text-sm border border-[#d9d9d9] rounded bg-white hover:border-[#1890ff] focus:border-[#1890ff] focus:outline-none">
        {OPERATORS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
      </select>
      {!NO_VALUE_OPS.includes(node.operator) && (
        <input type="text" value={node.value || ''} placeholder="值"
          onChange={e => onChange({ ...node, value: e.target.value })}
          className="w-[150px] h-[28px] px-2 text-sm border border-[#d9d9d9] rounded hover:border-[#1890ff] focus:border-[#1890ff] focus:outline-none font-mono" />
      )}
      <button onClick={onRemove} className="text-[rgba(0,0,0,0.45)] hover:text-[#ff4d4f] transition-colors" title="删除条件">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

function GroupNode({ group, level, onChange, onRemove, readOnly, isRoot }) {
  const updateChild = useCallback((idx, newChild) => {
    const next = { ...group, children: group.children.map((c, i) => i === idx ? newChild : c) }
    onChange(next)
  }, [group, onChange])

  const removeChild = useCallback((idx) => {
    const next = { ...group, children: group.children.filter((_, i) => i !== idx) }
    onChange(next)
  }, [group, onChange])

  const addCondition = () => {
    onChange({ ...group, children: [...group.children, newCondition()] })
  }

  const addSubGroup = () => {
    onChange({ ...group, children: [...group.children, newGroup()] })
  }

  const toggleLogic = () => {
    onChange({ ...group, logic: group.logic === 'AND' ? 'OR' : 'AND' })
  }

  const leftBorderClass = level === 0 ? 'border-l-2 border-l-[#1890ff]' : 'border-l-2 border-l-[#d9d9d9]'

  return (
    <div className={`border border-[#d9d9d9] rounded bg-white ${leftBorderClass} pl-3 pr-3 pt-2 pb-2`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button
            style={{
              padding: '0 8px',
              height: 22,
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 4,
              background: group.logic === 'AND' ? '#e6f7ff' : '#fff7e6',
              color: group.logic === 'AND' ? '#1890ff' : '#fa8c16',
              border: `1px solid ${group.logic === 'AND' ? '#91d5ff' : '#ffd591'}`,
              cursor: readOnly ? 'default' : 'pointer',
            }}
            onClick={!readOnly ? toggleLogic : undefined}
          >
            {group.logic}
          </button>
        </div>
        <div className="flex items-center gap-2">
          {!readOnly && (
            <>
              <span
                onClick={addCondition}
                className="text-xs text-[#1890ff] hover:text-[#40a9ff] cursor-pointer"
              >
                + 添加条件
              </span>
              <span
                onClick={addSubGroup}
                className="text-xs text-[#1890ff] hover:text-[#40a9ff] cursor-pointer"
              >
                + 添加子组
              </span>
            </>
          )}
          {!isRoot && !readOnly && (
            <button onClick={onRemove} className="text-[rgba(0,0,0,0.45)] hover:text-[#ff4d4f] transition-colors" title="删除组">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      <div className="space-y-2">
        {group.children.map((child, idx) => (
          <div key={child.id}>
            {child.type === 'group' ? (
              <GroupNode group={child} level={level + 1} onChange={c => updateChild(idx, c)} onRemove={() => removeChild(idx)} readOnly={readOnly} isRoot={false} />
            ) : (
              <ConditionRow node={child} onChange={c => updateChild(idx, c)} onRemove={() => removeChild(idx)} readOnly={readOnly} />
            )}
          </div>
        ))}
        {group.children.length === 0 && (
          <div className="text-xs text-[rgba(0,0,0,0.45)] italic py-2 text-center border border-dashed border-[#d9d9d9] rounded">
            {readOnly ? '无条件' : '空组，请添加条件'}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ConditionExpressionEditor({ value, onChange, readOnly = false, label = '条件表达式' }) {
  const handleChange = useCallback((newTree) => {
    onChange(toValue(newTree))
  }, [onChange])

  // 用 key 来确保重新挂载时重新解析
  const currentTree = parseValue(value)

  if (readOnly && (!currentTree.children || currentTree.children.length === 0)) {
    return (
      <div>
        <label className="block text-sm font-medium text-[rgba(0,0,0,0.88)] mb-2 flex items-center gap-2">
          <Layers className="w-4 h-4 text-[rgba(0,0,0,0.65)]" />{label}
        </label>
        <div className="border border-dashed border-[#d9d9d9] rounded-lg p-4 text-center text-sm text-[rgba(0,0,0,0.45)] italic">
          无前置条件，始终执行
        </div>
      </div>
    )
  }

  return (
    <div>
      <label className="block text-sm font-medium text-[rgba(0,0,0,0.88)] mb-2 flex items-center gap-2">
        <Layers className="w-4 h-4 text-[rgba(0,0,0,0.65)]" />{label}
      </label>
      {currentTree.children.length === 0 && !readOnly ? (
        <div className="border border-dashed border-[#d9d9d9] rounded-lg p-4 text-center">
          <p className="text-sm text-[rgba(0,0,0,0.45)] mb-2">未配置条件时，默认始终执行</p>
          <button onClick={() => handleChange({ ...currentTree, children: [newCondition()] })}
            className="inline-flex items-center text-sm text-white bg-[#1890ff] border-0 rounded h-[28px] px-[15px] hover:bg-[#40a9ff] transition-colors">
            + 添加第一个条件
          </button>
        </div>
      ) : (
        <GroupNode group={currentTree} level={0} onChange={handleChange} onRemove={() => {}} readOnly={readOnly} isRoot={true} />
      )}
      {!readOnly && (
        <p className="text-xs text-[rgba(0,0,0,0.45)] mt-1">满足条件时才会执行。</p>
      )}
    </div>
  )
}
