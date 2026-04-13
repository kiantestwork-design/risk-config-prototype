// ActivationList 页面 - 还原自 app.js bz 组件（offset 865925，~61K）
import { useState, useMemo, useCallback, useRef } from 'react'
import { Search, Eye, SquarePen, Trash2, Plus } from 'lucide-react'
import MultiSelectFilter from '../components/MultiSelectFilter'
import EntityEditorShell from '../components/EntityEditorShell'
import StatusToggle from '../components/StatusToggle'
import { MOCK_ACTIVATION_VERSIONS } from '../config/mock/versions'
import BulkActionToolbar from '../components/list/BulkActionToolbar'
import BulkConfirmModal from '../components/list/BulkConfirmModal'
import RulePickerModal from '../components/RulePickerModal'

function getRunStatus(item) {
  if (item.lifecycleState === 'PUBLISHED' && item.status === 1) return { label: '运行中', cls: 'bg-[#f6ffed] text-[#52c41a] border border-[#b7eb8f]' }
  if (item.lifecycleState === 'PUBLISHED' && item.status === 2) return { label: '已停用', cls: 'bg-[#f5f5f5] text-[rgba(0,0,0,0.45)] border border-[#d9d9d9]' }
  return { label: '未发布', cls: 'bg-[#fff7e6] text-[#fa8c16] border border-[#ffd591]' }
}

export default function ActivationList({ activations, onSaveActivation, onDeleteActivation, onBatchUpdateActivations, onBatchDeleteActivations, onAddToDrafts, entryPoints = [], rules = [] }) {
  const [mode, setMode] = useState('LIST')
  const [selectedItem, setSelectedItem] = useState(null)
  const [initialMode, setInitialMode] = useState('view')
  const [filter, setFilter] = useState({ name: '', eventPoints: [], scenes: [], lifecycle: 'ALL', status: 'ALL' })
  const [applied, setApplied] = useState({ name: '', eventPoints: [], scenes: [], lifecycle: 'ALL', status: 'ALL' })
  const [selected, setSelected] = useState(new Set())
  const [batchModalVisible, setBatchModalVisible] = useState(false)
  const [batchAction, setBatchAction] = useState('RELEASE')

  const allEpOpts = useMemo(() => [...new Set(activations.map(a => a.eventPoint))].filter(Boolean).map(ep => ({ value: ep, label: ep })), [activations])
  const allSceneOpts = useMemo(() => [...new Set(activations.flatMap(a => a.scenes || []))].filter(Boolean).map(sc => ({ value: sc, label: sc })), [activations])

  const filtered = useMemo(() => activations.filter(act => {
    if (applied.name && !act.name.toLowerCase().includes(applied.name.toLowerCase()) && !act.description.toLowerCase().includes(applied.name.toLowerCase())) return false
    if (applied.eventPoints.length > 0 && !applied.eventPoints.includes(act.eventPoint)) return false
    if (applied.scenes.length > 0 && !(act.scenes || []).some(sc => applied.scenes.includes(sc))) return false
    if (applied.status !== 'ALL') {
      if (applied.status === 'ENABLED' && act.status !== 1) return false
      if (applied.status === 'DISABLED' && act.status !== 2) return false
    }
    if (applied.lifecycle !== 'ALL') {
      const s = getRunStatus(act)
      if (applied.lifecycle === 'RUNNING' && s.label !== '运行中') return false
      if (applied.lifecycle === 'STOPPED' && s.label !== '已停用') return false
      if (applied.lifecycle === 'UNPUBLISHED' && s.label !== '未发布') return false
    }
    return true
  }), [activations, applied])

  const openView = (act) => { setSelectedItem(act); setInitialMode('view'); setEditRuleIds(act.ruleIds || []); initialRuleIdsRef.current = JSON.stringify(act.ruleIds || []); setMode('EDITOR') }
  const openEdit = (act) => { setSelectedItem(act); setInitialMode('edit'); setEditRuleIds(act.ruleIds || []); initialRuleIdsRef.current = JSON.stringify(act.ruleIds || []); setMode('EDITOR') }
  const openNew = () => { setSelectedItem(null); setInitialMode('edit'); setEditRuleIds([]); initialRuleIdsRef.current = '[]'; setMode('EDITOR') }

  const handleSave = (data) => {
    let saved
    const dataWithRules = { ...data, ruleIds: editRuleIds }
    if (selectedItem) {
      saved = { ...selectedItem, ...dataWithRules }
    } else {
      const newId = activations.length ? Math.max(...activations.map(a => a.id)) + 1 : 1
      saved = { id: newId, name: dataWithRules.name || '', description: dataWithRules.description || '', eventPoint: dataWithRules.eventPoint || '', scenes: [], status: dataWithRules.status ?? 1, lifecycleState: 'DRAFT', priority: dataWithRules.priority || 1, thresholds: [], ruleIds: editRuleIds, createAt: new Date().toISOString().replace('T', ' ').slice(0, 19), updateAt: dataWithRules.updateAt || '', operator: dataWithRules.operator || '' }
    }
    onSaveActivation(saved)
    return saved
  }

  const handleDelete = (id) => {
    if (confirm('确定要删除该策略吗？此操作不可恢复。')) {
      onDeleteActivation(id)
      const next = new Set(selected); next.delete(id); setSelected(next)
    }
  }

  const handleSelectAll = (e) => {
    e.target.checked ? setSelected(new Set(filtered.map(a => a.id))) : setSelected(new Set())
  }
  const toggleRow = (id) => {
    const next = new Set(selected); next.has(id) ? next.delete(id) : next.add(id); setSelected(next)
  }

  const openBatchModal = (action) => { setBatchAction(action); setBatchModalVisible(true) }
  const executeBatch = (eligibleItems) => {
    const ids = eligibleItems.map(it => it.id)
    if (batchAction === 'RELEASE') {
      eligibleItems.forEach(it => {
        onAddToDrafts({ id: `DFT-${Date.now()}-${it.id}`, type: 'ACTIVATION', targetId: String(it.id), targetName: it.name, version: 'vNext', relatedKeys: it.eventPoint || '', updatedAt: new Date().toISOString(), editor: 'current_user', changeSummary: '批量加入发布清单' })
      })
      onBatchUpdateActivations(ids, { lifecycleState: 'READY' })
    } else if (batchAction === 'ENABLE' || batchAction === 'DISABLE') {
      const newStatus = batchAction === 'ENABLE' ? 1 : 2
      onBatchUpdateActivations(ids, { status: newStatus, lifecycleState: 'DRAFT', updateAt: new Date().toISOString().replace('T', ' ').slice(0, 19) })
    } else if (batchAction === 'DELETE') {
      onBatchDeleteActivations(ids)
    }
    setSelected(new Set())
    setBatchModalVisible(false)
  }

  const [rulePickerVisible, setRulePickerVisible] = useState(false)
  // ruleIdsRef 用于在 extraSections 中管理编辑态的 ruleIds（因为 extraSections 拿到的是 data snapshot）
  const [editRuleIds, setEditRuleIds] = useState([])
  const initialRuleIdsRef = useRef('[]')

  const extraDirtyCheck = useCallback(() => {
    return JSON.stringify(editRuleIds) !== initialRuleIdsRef.current
  }, [editRuleIds])

  if (mode === 'EDITOR') {
    const actVersions = selectedItem ? MOCK_ACTIVATION_VERSIONS.filter(v => v.activationId === selectedItem.id) : []
    return (
      <EntityEditorShell
        entityName="策略"
        item={selectedItem}
        isNew={!selectedItem}
        initialMode={initialMode}
        onBack={() => setMode('LIST')}
        onSave={handleSave}
        versions={actVersions}
        extraDirtyCheck={extraDirtyCheck}
        renderForm={({ data, onChange, mode: m, changeNoteEl }) => (
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-5">
            <h3 className="text-base font-semibold text-slate-800">基本信息</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">策略名 *</label>
              {m === 'edit' ? (
                <input type="text" value={data.name || ''} onChange={e => onChange('name', e.target.value)}
                  disabled={!!selectedItem}
                  className={`w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 ${selectedItem ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
                  placeholder="如：activation_txn_risk" />
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
              <label className="block text-sm font-medium text-slate-700 mb-1">接入点</label>
              {m === 'edit' ? (
                <select value={data.eventPoint || ''} onChange={e => onChange('eventPoint', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                  <option value="">-- 选择接入点 --</option>
                  {entryPoints.map(ep => <option key={ep.id} value={ep.eventPoint}>{ep.eventPoint} - {ep.description}</option>)}
                </select>
              ) : (
                <div className="text-sm font-mono">{data.eventPoint || '-'}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">优先级</label>
              {m === 'edit' ? (
                <input type="number" value={data.priority || 1} onChange={e => onChange('priority', e.target.value === '' ? null : parseInt(e.target.value))} min={1}
                  className="w-32 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              ) : (
                <div className="text-sm">{data.priority}</div>
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
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">场景</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(data.scenes || []).map(sc => (
                    <span key={sc} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#e6f7ff] text-[#1890ff] text-xs">
                      {sc}
                      <svg className="w-3 h-3 cursor-pointer hover:text-[#ff4d4f]" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        onClick={() => onChange('scenes', (data.scenes || []).filter(s => s !== sc))}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  {['deposit', 'withdraw', 'transfer', 'login', 'register'].filter(sc => !(data.scenes || []).includes(sc)).map(sc => (
                    <button key={sc} onClick={() => onChange('scenes', [...(data.scenes || []), sc])}
                      className="text-xs px-2 py-0.5 rounded border border-dashed border-slate-300 text-slate-500 hover:border-[#1890ff] hover:text-[#1890ff] transition-colors">
                      + {sc}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-slate-700">阈值配置</label>
                {m === 'edit' && (
                  <button onClick={() => onChange('thresholds', [...(data.thresholds || []), { name: '', score: null }])}
                    className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center">
                    <Plus className="w-3 h-3 mr-0.5" />添加阈值段
                  </button>
                )}
              </div>
              {(data.thresholds || []).length === 0 && (
                <div className="text-xs text-slate-400 italic">未配置阈值段</div>
              )}
              {m === 'edit' ? (
                <div className="space-y-2">
                  {(data.thresholds || []).map((t, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="text" value={t.name || ''} placeholder="阈值段名称"
                        onChange={e => { const next = [...(data.thresholds || [])]; next[i] = { ...next[i], name: e.target.value }; onChange('thresholds', next) }}
                        className="flex-1 px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      <input type="number" value={t.score ?? ''} placeholder="分数阈值"
                        onChange={e => { const next = [...(data.thresholds || [])]; next[i] = { ...next[i], score: e.target.value === '' ? null : Number(e.target.value) }; onChange('thresholds', next) }}
                        className="w-28 px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      <button onClick={() => { const next = [...(data.thresholds || [])]; next.splice(i, 1); onChange('thresholds', next) }}
                        className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(data.thresholds || []).map((t, i) => (
                    <span key={i} className="inline-flex items-center px-2 py-1 rounded text-xs bg-slate-100 text-slate-600">
                      {t.name}: {t.score ?? '无上限'}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {m === 'view' && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div><div className="text-xs text-[rgba(0,0,0,0.45)] mb-1">生命周期状态</div><div className="text-sm">{{ PUBLISHED: '已发布', DRAFT: '草稿', ARCHIVED: '已归档', READY: '待发布' }[data.lifecycleState] || data.lifecycleState || '-'}</div></div>
                <div><div className="text-xs text-[rgba(0,0,0,0.45)] mb-1">场景</div><div className="text-sm">{(data.scenes || []).join(', ') || '-'}</div></div>
                <div><div className="text-xs text-[rgba(0,0,0,0.45)] mb-1">更新时间</div><div className="text-sm">{data.updateAt || '-'}</div></div>
                <div><div className="text-xs text-[rgba(0,0,0,0.45)] mb-1">操作人</div><div className="text-sm">{data.operator || '-'}</div></div>
              </div>
            )}
            {changeNoteEl}
          </div>
        )}
        extraSections={({ data, mode: m }) => {
          const currentRuleIds = m === 'edit' ? editRuleIds : (data.ruleIds || [])
          const relatedRules = rules.filter(r => currentRuleIds.includes(r.id))

          const handleRemoveRule = (ruleId) => {
            const next = editRuleIds.filter(id => id !== ruleId)
            setEditRuleIds(next)
          }

          const handleMoveRule = (index, direction) => {
            const next = [...editRuleIds]
            const target = index + direction
            if (target < 0 || target >= next.length) return
            ;[next[index], next[target]] = [next[target], next[index]]
            setEditRuleIds(next)
          }

          const handleAddRules = (ruleIds) => {
            setEditRuleIds([...editRuleIds, ...ruleIds])
            setRulePickerVisible(false)
          }

          return (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-slate-800">关联规则 ({relatedRules.length})</h3>
                {m === 'edit' && (
                  <button onClick={() => setRulePickerVisible(true)}
                    className="inline-flex items-center h-8 px-4 text-sm rounded-md bg-[#1890ff] text-white border-none hover:bg-[#40a9ff] transition-colors">
                    <Plus className="w-4 h-4 mr-1" />添加规则
                  </button>
                )}
              </div>
              {relatedRules.length > 0 ? (
                <table className="w-full" style={{ tableLayout: 'auto' }}>
                  <thead>
                    <tr className="bg-[#fafafa] border-b border-[#f0f0f0]">
                      {m === 'edit' && <th className="px-3 py-2 text-center text-xs font-medium text-[rgba(0,0,0,0.65)] w-[60px]">排序</th>}
                      <th className="px-3 py-2 text-left text-xs font-medium text-[rgba(0,0,0,0.65)]">规则信息</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-[rgba(0,0,0,0.65)] w-[90px]">状态</th>
                      {m === 'edit' && <th className="px-3 py-2 text-center text-xs font-medium text-[rgba(0,0,0,0.65)] w-[60px]">操作</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {currentRuleIds.map((ruleId, idx) => {
                      const r = rules.find(r => r.id === ruleId)
                      if (!r) return null
                      const s = getRunStatus(r)
                      return (
                        <tr key={r.id} className="border-b border-[#f0f0f0] hover:bg-[#fafafa] transition-colors">
                          {m === 'edit' && (
                            <td className="px-3 py-2 text-center">
                              <div className="flex justify-center gap-1">
                                <button onClick={() => handleMoveRule(idx, -1)} disabled={idx === 0}
                                  className="text-[rgba(0,0,0,0.45)] hover:text-[#1890ff] disabled:text-[rgba(0,0,0,0.15)] disabled:cursor-not-allowed transition-colors" title="上移">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                                </button>
                                <button onClick={() => handleMoveRule(idx, 1)} disabled={idx === currentRuleIds.length - 1}
                                  className="text-[rgba(0,0,0,0.45)] hover:text-[#1890ff] disabled:text-[rgba(0,0,0,0.15)] disabled:cursor-not-allowed transition-colors" title="下移">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </button>
                              </div>
                            </td>
                          )}
                          <td className="px-3 py-2">
                            <div className="text-sm font-mono text-[#1890ff]">{r.name}</div>
                            <div className="text-xs text-[rgba(0,0,0,0.45)] mt-0.5">{r.description}</div>
                          </td>
                          <td className="px-3 py-2 text-center"><span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${s.cls}`}>{s.label}</span></td>
                          {m === 'edit' && (
                            <td className="px-3 py-2 text-center">
                              <button onClick={() => handleRemoveRule(r.id)} className="text-xs text-[#ff4d4f] hover:text-[#ff7875] transition-colors">移除</button>
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="text-sm text-[rgba(0,0,0,0.25)] text-center py-6">暂无关联规则</div>
              )}
              {m === 'edit' && (
                <RulePickerModal
                  visible={rulePickerVisible}
                  rules={rules}
                  existingRuleIds={editRuleIds}
                  onConfirm={handleAddRules}
                  onClose={() => setRulePickerVisible(false)}
                />
              )}
            </div>
          )
        }}
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
              <label className="text-xs font-medium text-slate-500">策略名/描述</label>
              <div className="mt-1 relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="输入关键字" value={filter.name}
                  onChange={e => setFilter({ ...filter, name: e.target.value })}
                  className="w-40 pl-8 pr-3 py-1.5 rounded border border-slate-300 text-sm focus:outline-none focus:border-[#1890ff] focus:ring-1 focus:ring-[#1890ff] transition-colors" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">接入点</label>
              <div className="mt-1 w-44">
                <MultiSelectFilter value={filter.eventPoints} onChange={v => setFilter({ ...filter, eventPoints: v })} options={allEpOpts} placeholder="全部接入点" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">场景</label>
              <div className="mt-1 w-44">
                <MultiSelectFilter value={filter.scenes} onChange={v => setFilter({ ...filter, scenes: v })} options={allSceneOpts} placeholder="全部场景" />
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
            {window.__hasPerm?.('activation:edit') && (
              <button onClick={openNew} className="inline-flex items-center px-4 py-1.5 text-sm font-medium text-[#1890ff] bg-indigo-50 border border-[#1890ff] rounded hover:bg-indigo-100 shadow-sm transition-colors whitespace-nowrap">
                <Plus className="w-4 h-4 mr-1" />新建策略
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
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">策略信息</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">接入点</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">场景</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">优先级</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">阈值段</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500">规则数</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 w-[90px]">运行状态</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">更新时间/操作人</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 w-[140px]">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(act => {
              const s = getRunStatus(act)
              return (
                <tr key={act.id} className={`hover:bg-[#f0f7ff] transition-colors group ${selected.has(act.id) ? 'bg-indigo-50/30' : ''}`}>
                  <td className="px-3 py-3">
                    <input type="checkbox" className="w-4 h-4 text-indigo-600 border-slate-300 rounded"
                      checked={selected.has(act.id)} onChange={() => toggleRow(act.id)} />
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-sm font-mono text-[#1890ff] cursor-pointer hover:underline" onClick={() => openView(act)}>{act.name}</div>
                    <div className="text-xs text-[rgba(0,0,0,0.45)] mt-0.5">{act.description}</div>
                  </td>
                  <td className="px-3 py-3 text-sm font-mono text-[rgba(0,0,0,0.65)]">{act.eventPoint}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(act.scenes || []).map(sc => (
                        <span key={sc} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-indigo-50 text-indigo-600 whitespace-nowrap">{sc}</span>
                      ))}
                      {(!act.scenes || act.scenes.length === 0) && <span className="text-xs text-[rgba(0,0,0,0.25)]">-</span>}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm text-[rgba(0,0,0,0.65)]">{act.priority}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(act.thresholds || []).map((t, i) => (
                        <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-slate-100 text-slate-600 whitespace-nowrap">{t.name}:{t.score ?? '∞'}</span>
                      ))}
                      {(!act.thresholds || act.thresholds.length === 0) && <span className="text-xs text-[rgba(0,0,0,0.25)]">-</span>}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    {(() => { const cnt = (act.ruleIds || []).length; return cnt > 0 ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-pink-50 text-pink-600 border border-pink-200">{cnt} 条</span> : <span className="text-xs text-[rgba(0,0,0,0.25)]">-</span> })()}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${s.cls}`}>{s.label}</span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-xs text-[rgba(0,0,0,0.65)]">{act.updateAt}</div>
                    <div className="text-xs text-[rgba(0,0,0,0.45)]">by {act.operator}</div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-center text-sm font-medium">
                    <div className="flex justify-center gap-2">
                      <button className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors" onClick={() => openView(act)} title="查看详情">
                        <Eye className="w-4 h-4 mr-1" />查看
                      </button>
                      {window.__hasPerm?.('activation:edit') && (
                        <button className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors" onClick={() => openEdit(act)} title="编辑策略">
                          <SquarePen className="w-4 h-4 mr-1" />编辑
                        </button>
                      )}
                      <button className="flex items-center text-slate-400 hover:text-red-600 transition-colors" onClick={() => handleDelete(act.id)} title="删除策略">
                        <Trash2 className="w-4 h-4 mr-1" />删除
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={10} className="px-3 py-8 text-center text-sm text-[rgba(0,0,0,0.25)]">暂无数据</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <BulkConfirmModal
        visible={batchModalVisible}
        action={batchAction}
        selectedItems={activations.filter(it => selected.has(it.id))}
        onExecute={executeBatch}
        onClose={() => setBatchModalVisible(false)}
      />
    </div>
  )
}
