// RuleList 页面 - 还原自 app.js Nz 组件（offset 926883，~54K）
import { useState, useMemo, useEffect } from 'react'
import { Search, Eye, SquarePen, Trash2, Plus, TriangleAlert } from 'lucide-react'
import EntityEditorShell from '../components/EntityEditorShell'
import StatusToggle from '../components/StatusToggle'
import ConditionExpressionEditor from '../components/ConditionExpressionEditor'
import { MOCK_RULE_VERSIONS } from '../config/mock/versions'
import BulkActionToolbar from '../components/list/BulkActionToolbar'
import BulkConfirmModal from '../components/list/BulkConfirmModal'

function getRunStatus(item) {
  if (item.lifecycleState === 'PUBLISHED' && item.status === 1) return { label: '运行中', cls: 'bg-[#f6ffed] text-[#52c41a] border border-[#b7eb8f]' }
  if (item.lifecycleState === 'PUBLISHED' && item.status === 2) return { label: '已停用', cls: 'bg-[#f5f5f5] text-[rgba(0,0,0,0.45)] border border-[#d9d9d9]' }
  return { label: '未发布', cls: 'bg-[#fff7e6] text-[#fa8c16] border border-[#ffd591]' }
}

const ACTION_TYPE_COLORS = {
  TAG: 'bg-blue-50 text-blue-700 border-blue-200',
  HTTP: 'bg-green-50 text-green-700 border-green-200',
  DUBBO: 'bg-purple-50 text-purple-700 border-purple-200',
}

export default function RuleList({ rules, onSaveRule, onAddToDrafts, activations = [] }) {
  const [items, setItems] = useState(rules)
  useEffect(() => { setItems(rules) }, [rules])
  const [mode, setMode] = useState('LIST')
  const [selectedItem, setSelectedItem] = useState(null)
  const [initialMode, setInitialMode] = useState('view')
  const [filter, setFilter] = useState({ name: '', lifecycle: 'ALL', status: 'ALL' })
  const [applied, setApplied] = useState({ name: '', lifecycle: 'ALL', status: 'ALL' })
  const [selected, setSelected] = useState(new Set())
  const [batchModalVisible, setBatchModalVisible] = useState(false)
  const [batchAction, setBatchAction] = useState('RELEASE')

  const filtered = useMemo(() => items.filter(r => {
    if (applied.name && !r.name.toLowerCase().includes(applied.name.toLowerCase()) && !r.description.toLowerCase().includes(applied.name.toLowerCase())) return false
    if (applied.status !== 'ALL') {
      if (applied.status === 'ENABLED' && r.status !== 1) return false
      if (applied.status === 'DISABLED' && r.status !== 2) return false
    }
    if (applied.lifecycle !== 'ALL') {
      const s = getRunStatus(r)
      if (applied.lifecycle === 'RUNNING' && s.label !== '运行中') return false
      if (applied.lifecycle === 'STOPPED' && s.label !== '已停用') return false
      if (applied.lifecycle === 'UNPUBLISHED' && s.label !== '未发布') return false
    }
    return true
  }), [items, applied])

  const openView = (r) => { setSelectedItem(r); setInitialMode('view'); setMode('EDITOR') }
  const openEdit = (r) => { setSelectedItem(r); setInitialMode('edit'); setMode('EDITOR') }
  const openNew = () => { setSelectedItem(null); setInitialMode('edit'); setMode('EDITOR') }

  const handleSave = (data) => {
    let saved
    if (selectedItem) {
      saved = { ...selectedItem, ...data }
      setItems(prev => prev.map(r => r.id === saved.id ? saved : r))
    } else {
      const newId = items.length ? Math.max(...items.map(r => r.id)) + 1 : 1
      saved = { id: newId, name: data.name || '', description: data.description || '', conditionExpression: { logic: 'AND', groups: [] }, initScore: 0, baseNum: 0, operator: 'NONE', valueField: '', max: null, rate: 1, status: data.status ?? 1, lifecycleState: 'DRAFT', actions: [], createAt: new Date().toISOString().replace('T', ' ').slice(0, 19), updateAt: data.updateAt || '', editOperator: data.editOperator || '' }
      setItems(prev => [...prev, saved])
    }
    onSaveRule(saved)
    return saved
  }

  const handleDelete = (id) => {
    if (confirm('确定要删除该规则吗？此操作不可恢复。')) {
      setItems(prev => prev.filter(r => r.id !== id))
      const next = new Set(selected); next.delete(id); setSelected(next)
    }
  }

  const handleSelectAll = (e) => {
    e.target.checked ? setSelected(new Set(filtered.map(r => r.id))) : setSelected(new Set())
  }
  const toggleRow = (id) => {
    const next = new Set(selected); next.has(id) ? next.delete(id) : next.add(id); setSelected(next)
  }

  const openBatchModal = (action) => { setBatchAction(action); setBatchModalVisible(true) }
  const executeBatch = (eligibleItems) => {
    if (batchAction === 'RELEASE') {
      eligibleItems.forEach(it => {
        onAddToDrafts({ id: `DFT-${Date.now()}-${it.id}`, type: 'RULE', targetId: String(it.id), targetName: it.name, version: 'vNext', relatedKeys: (it.actions || []).map(a => a.actionType).join(','), updatedAt: new Date().toISOString(), editor: 'current_user', changeSummary: '批量加入发布清单' })
      })
      setItems(prev => prev.map(it => eligibleItems.find(s => s.id === it.id) ? { ...it, lifecycleState: 'READY' } : it))
    } else if (batchAction === 'ENABLE' || batchAction === 'DISABLE') {
      const newStatus = batchAction === 'ENABLE' ? 1 : 2
      setItems(prev => prev.map(it => eligibleItems.find(s => s.id === it.id) ? { ...it, status: newStatus, lifecycleState: 'DRAFT', updateAt: new Date().toISOString().replace('T', ' ').slice(0, 19) } : it))
    } else if (batchAction === 'DELETE') {
      setItems(prev => prev.filter(it => !eligibleItems.find(s => s.id === it.id)))
    }
    setSelected(new Set())
    setBatchModalVisible(false)
  }

  if (mode === 'EDITOR') {
    const ruleVersions = selectedItem ? MOCK_RULE_VERSIONS.filter(v => v.ruleId === selectedItem.id) : []
    const referencingActivations = selectedItem ? activations.filter(a => (a.ruleIds || []).includes(selectedItem.id)) : []

    const handleSubmitReady = (data) => {
      const saved = handleSave({ ...data, lifecycleState: 'READY' })
      if (saved && onAddToDrafts) {
        onAddToDrafts({ id: `DFT-${Date.now()}-${saved.id}`, type: 'RULE', targetId: String(saved.id), targetName: saved.name, version: 'vNext', relatedKeys: (saved.actions || []).map(a => a.actionType).join(','), updatedAt: new Date().toISOString(), editor: 'current_user', changeSummary: data._changeNote || '提交待发布' })
      }
      return saved
    }

    const referenceBanner = referencingActivations.length > 0 ? (
      <div className="flex items-start gap-3 bg-[#fffbe6] border border-[#ffe58f] rounded-lg px-4 py-3 mb-2">
        <TriangleAlert className="w-4 h-4 text-[#faad14] mt-0.5 shrink-0" />
        <div className="text-sm text-[rgba(0,0,0,0.65)]">
          <span className="font-medium text-[rgba(0,0,0,0.88)]">引用影响提示：</span>当前规则被
          {referencingActivations.map((a, i) => (
            <span key={a.id}>
              {i > 0 && '、'}
              <span className="font-medium text-[#1890ff]">{a.name}</span>
            </span>
          ))}
          {' '}等 {referencingActivations.length} 个策略引用，修改后可能影响相关策略的执行。
        </div>
      </div>
    ) : null

    return (
      <EntityEditorShell
        entityName="规则"
        item={selectedItem}
        isNew={!selectedItem}
        initialMode={initialMode}
        onBack={() => setMode('LIST')}
        onSave={handleSave}
        onSubmitReady={handleSubmitReady}
        showDraftPublish={true}
        headerBanner={referenceBanner}
        versions={ruleVersions}
        renderForm={({ data, onChange, mode: m, changeNoteEl }) => (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-5">
              <h3 className="text-base font-semibold text-slate-800">基本信息</h3>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">规则名 *</label>
                {m === 'edit' ? (
                  <input type="text" value={data.name || ''} onChange={e => onChange('name', e.target.value)}
                    disabled={!!selectedItem}
                    className={`w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 ${selectedItem ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
                    placeholder="如：rule_high_amount" />
                ) : (
                  <div className="text-sm font-mono text-[#1890ff]">{data.name}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">描述</label>
                {m === 'edit' ? (
                  <textarea value={data.description || ''} onChange={e => onChange('description', e.target.value)} rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                ) : (
                  <div className="text-sm text-[rgba(0,0,0,0.65)]">{data.description || '-'}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">启用状态</label>
                {m === 'edit' ? (
                  <div className="flex items-center gap-3">
                    <StatusToggle enabled={data.status === 1} onChange={v => onChange('status', v ? 1 : 2)} />
                    <span className={`text-sm ${data.status === 1 ? 'text-green-600' : 'text-slate-500'}`}>{data.status === 1 ? '启用' : '禁用'}</span>
                  </div>
                ) : (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${data.status === 1 ? 'bg-[#f6ffed] text-[#52c41a] border-[#b7eb8f]' : 'bg-[#f5f5f5] text-[rgba(0,0,0,0.45)] border-[#d9d9d9]'}`}>
                    {data.status === 1 ? '启用' : '禁用'}
                  </span>
                )}
              </div>
              {m === 'edit' && (
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <h4 className="text-sm font-semibold text-slate-700">评分配置</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">初始分</label>
                      <input type="number" value={data.initScore ?? 0} onChange={e => onChange('initScore', e.target.value === '' ? null : Number(e.target.value))}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">评分运算</label>
                      <select value={data.operator || 'NONE'} onChange={e => onChange('operator', e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                        <option value="NONE">无运算 (NONE)</option>
                        <option value="ADD">加法 (ADD)</option>
                        <option value="SUB">减法 (SUB)</option>
                        <option value="MUL">乘法 (MUL)</option>
                        <option value="DIV">除法 (DIV)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">基数</label>
                      <input type="number" value={data.baseNum ?? 0} onChange={e => onChange('baseNum', e.target.value === '' ? null : Number(e.target.value))}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">取值字段</label>
                      <input type="text" value={data.valueField || ''} onChange={e => onChange('valueField', e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="如：amount" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">倍率</label>
                      <input type="number" value={data.rate ?? 1} onChange={e => onChange('rate', e.target.value === '' ? null : Number(e.target.value))} step="0.1"
                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">分数上限</label>
                      <input type="number" value={data.max ?? ''} onChange={e => onChange('max', e.target.value === '' ? null : Number(e.target.value))} placeholder="无上限"
                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </div>
                  {data.operator && data.operator !== 'NONE' && (
                    <div className="bg-slate-50 rounded p-2 text-xs text-slate-500 font-mono">
                      公式：{data.initScore ?? 0} {data.operator === 'ADD' ? '+' : data.operator === 'SUB' ? '-' : data.operator === 'MUL' ? '×' : '÷'} ({data.valueField || 'field'} × {data.rate ?? 1})，上限 {data.max ?? '无'}
                    </div>
                  )}
                </div>
              )}
              {m === 'view' && (
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                  <div><div className="text-xs text-[rgba(0,0,0,0.45)] mb-1">生命周期状态</div><div className="text-sm">{{ PUBLISHED: '已发布', DRAFT: '草稿', ARCHIVED: '已归档', READY: '待发布' }[data.lifecycleState] || data.lifecycleState || '-'}</div></div>
                  <div><div className="text-xs text-[rgba(0,0,0,0.45)] mb-1">初始分</div><div className="text-sm">{data.initScore ?? '-'}</div></div>
                  <div><div className="text-xs text-[rgba(0,0,0,0.45)] mb-1">评分运算</div><div className="text-sm">{data.operator || '-'}</div></div>
                  <div><div className="text-xs text-[rgba(0,0,0,0.45)] mb-1">基数</div><div className="text-sm">{data.baseNum ?? '-'}</div></div>
                  <div><div className="text-xs text-[rgba(0,0,0,0.45)] mb-1">取值字段</div><div className="text-sm font-mono">{data.valueField || '-'}</div></div>
                  <div><div className="text-xs text-[rgba(0,0,0,0.45)] mb-1">倍率</div><div className="text-sm">{data.rate ?? '-'}</div></div>
                  <div><div className="text-xs text-[rgba(0,0,0,0.45)] mb-1">最大分</div><div className="text-sm">{data.max ?? '无上限'}</div></div>
                  <div><div className="text-xs text-[rgba(0,0,0,0.45)] mb-1">更新时间</div><div className="text-sm">{data.updateAt || '-'}</div></div>
                  <div><div className="text-xs text-[rgba(0,0,0,0.45)] mb-1">操作人</div><div className="text-sm">{data.editOperator || '-'}</div></div>
                </div>
              )}
              {changeNoteEl}
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
              <ConditionExpressionEditor
                value={data.conditionExpression || { logic: 'AND', children: [] }}
                onChange={v => onChange('conditionExpression', v)}
                readOnly={m === 'view'}
                label="条件表达式"
              />
            </div>

            {data.actions && data.actions.length > 0 && (
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
                <h3 className="text-base font-semibold text-slate-800 mb-4">动作配置</h3>
                <div className="space-y-3">
                  {data.actions.map((action, i) => (
                    <div key={i} className="border border-slate-100 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${ACTION_TYPE_COLORS[action.actionType] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>{action.actionType}</span>
                        <span className="text-sm font-mono text-[rgba(0,0,0,0.88)]">{action.actionName}</span>
                        <span className="text-xs text-[rgba(0,0,0,0.45)]">优先级 {action.priority}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${action.executionMode === 'sync' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>{action.executionMode === 'sync' ? '同步' : '异步'}</span>
                      </div>
                      <div className="text-xs text-[rgba(0,0,0,0.45)] font-mono bg-slate-50 p-2 rounded overflow-x-auto">{action.actionConfig}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      />
    )
  }

  return (
    <div className="space-y-4">
      <BulkActionToolbar selectedCount={selected.size} onAction={openBatchModal} onClear={() => setSelected(new Set())} />

      {selected.size === 0 && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <div className="flex flex-wrap gap-x-6 gap-y-4 items-end">
            <div>
              <label className="text-xs font-medium text-slate-500">规则名/描述</label>
              <div className="mt-1 relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="输入关键字" value={filter.name}
                  onChange={e => setFilter({ ...filter, name: e.target.value })}
                  className="w-40 pl-8 pr-3 py-1.5 rounded border border-slate-300 text-sm focus:outline-none focus:border-[#1890ff] focus:ring-1 focus:ring-[#1890ff] transition-colors" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">运行状态</label>
              <select value={filter.lifecycle} onChange={e => setFilter({ ...filter, lifecycle: e.target.value })}
                className="mt-1 block w-28 border border-slate-300 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-[#1890ff]">
                <option value="ALL">全部</option>
                <option value="RUNNING">运行中</option>
                <option value="STOPPED">已停用</option>
                <option value="UNPUBLISHED">未发布</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">启用状态</label>
              <select value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })}
                className="mt-1 block w-28 border border-slate-300 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-[#1890ff]">
                <option value="ALL">全部</option>
                <option value="ENABLED">已启用</option>
                <option value="DISABLED">已禁用</option>
              </select>
            </div>
            <button onClick={() => setApplied({ ...filter })} className="inline-flex items-center px-4 py-1.5 text-sm font-medium text-white bg-[#1890ff] rounded hover:bg-[#40a9ff] shadow-sm transition-colors whitespace-nowrap">
              <Search className="w-4 h-4 mr-1" />查询
            </button>
            <div className="flex-1" />
            {window.__hasPerm?.('rule:edit') && (
              <button onClick={openNew} className="inline-flex items-center px-4 py-1.5 text-sm font-medium text-[#1890ff] bg-indigo-50 border border-[#1890ff] rounded hover:bg-indigo-100 shadow-sm transition-colors whitespace-nowrap">
                <Plus className="w-4 h-4 mr-1" />新建规则
              </button>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full" style={{ tableLayout: 'auto' }}>
          <thead className="bg-[#fafafa]">
            <tr>
              <th className="px-3 py-3 w-10">
                <input type="checkbox" className="w-4 h-4 text-indigo-600 border-slate-300 rounded"
                  checked={filtered.length > 0 && selected.size === filtered.length}
                  onChange={handleSelectAll} />
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">规则信息</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">动作</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500">引用数</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 w-[90px]">运行状态</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">更新时间/操作人</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 w-[140px]">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(r => {
              const s = getRunStatus(r)
              return (
                <tr key={r.id} className={`hover:bg-[#f0f7ff] transition-colors group ${selected.has(r.id) ? 'bg-indigo-50/30' : ''}`}>
                  <td className="px-3 py-3">
                    <input type="checkbox" className="w-4 h-4 text-indigo-600 border-slate-300 rounded"
                      checked={selected.has(r.id)} onChange={() => toggleRow(r.id)} />
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-sm font-mono text-[#1890ff] cursor-pointer hover:underline" onClick={() => openView(r)}>{r.name}</div>
                    <div className="text-xs text-[rgba(0,0,0,0.45)] mt-0.5">{r.description}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(r.actions || []).map((action, i) => (
                        <span key={i} className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs border whitespace-nowrap ${ACTION_TYPE_COLORS[action.actionType] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>{action.actionType}</span>
                      ))}
                      {(!r.actions || r.actions.length === 0) && <span className="text-xs text-[rgba(0,0,0,0.25)]">-</span>}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    {(() => { const cnt = activations.filter(a => (a.ruleIds || []).includes(r.id)).length; return cnt > 0 ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-pink-50 text-pink-600 border border-pink-200">{cnt} 个策略</span> : <span className="text-xs text-[rgba(0,0,0,0.25)]">-</span> })()}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${s.cls}`}>{s.label}</span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-xs text-[rgba(0,0,0,0.65)]">{r.updateAt}</div>
                    <div className="text-xs text-[rgba(0,0,0,0.45)]">by {r.editOperator}</div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-center text-sm font-medium">
                    <div className="flex justify-center gap-2">
                      <button className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors" onClick={() => openView(r)} title="查看详情">
                        <Eye className="w-4 h-4 mr-1" />查看
                      </button>
                      {window.__hasPerm?.('rule:edit') && (
                        <button className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors" onClick={() => openEdit(r)} title="编辑规则">
                          <SquarePen className="w-4 h-4 mr-1" />编辑
                        </button>
                      )}
                      <button className="flex items-center text-slate-400 hover:text-red-600 transition-colors" onClick={() => handleDelete(r.id)} title="删除规则">
                        <Trash2 className="w-4 h-4 mr-1" />删除
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-sm text-[rgba(0,0,0,0.25)]">暂无数据</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <BulkConfirmModal
        visible={batchModalVisible}
        action={batchAction}
        selectedItems={items.filter(it => selected.has(it.id))}
        onExecute={executeBatch}
        onClose={() => setBatchModalVisible(false)}
      />
    </div>
  )
}
