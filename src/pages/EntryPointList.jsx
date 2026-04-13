// EntryPointList 页面 - 还原自 app.js xz+gz 组件
import { useState, useMemo, useCallback, useRef } from 'react'
import { Search, Eye, SquarePen, Trash2, Plus } from 'lucide-react'
import EntityEditorShell from '../components/EntityEditorShell'
import StatusToggle from '../components/StatusToggle'
import ExtractionConfig from '../components/ExtractionConfig'
import SceneOrchestration from '../components/SceneOrchestration'
import BulkActionToolbar from '../components/list/BulkActionToolbar'
import BulkConfirmModal from '../components/list/BulkConfirmModal'
import { MOCK_VERSIONS } from '../config/mock/versions'

function getRunStatus(item) {
  if (item.lifecycleState === 'PUBLISHED' && item.status === 1) return { label: '运行中', cls: 'bg-[#f6ffed] text-[#52c41a] border border-[#b7eb8f]' }
  if (item.lifecycleState === 'PUBLISHED' && item.status === 2) return { label: '已停用', cls: 'bg-[#f5f5f5] text-[rgba(0,0,0,0.45)] border border-[#d9d9d9]' }
  return { label: '未发布', cls: 'bg-[#fff7e6] text-[#fa8c16] border border-[#ffd591]' }
}

const LC_OPTS = [
  { value: 'ALL', label: '全部运行状态' },
  { value: 'RUNNING', label: '运行中' },
  { value: 'STOPPED', label: '已停用' },
  { value: 'UNPUBLISHED', label: '未发布' },
]

export default function EntryPointList({ entryPoints, onSaveEntryPoint, onDeleteEntryPoint, onBatchUpdateEntryPoints, onBatchDeleteEntryPoints, onAddToDrafts, activations = [], properties = [], features = [], extractions = {}, sceneFeatures = {}, onSaveExtractions, onSaveSceneFeatures }) {
  const [mode, setMode] = useState('LIST')
  const [selectedItem, setSelectedItem] = useState(null)
  const [initialMode, setInitialMode] = useState('view')
  const [filter, setFilter] = useState({ code: '', desc: '', lifecycle: 'ALL', status: 'ALL' })
  const [applied, setApplied] = useState({ code: '', desc: '', lifecycle: 'ALL', status: 'ALL' })
  const [selected, setSelected] = useState(new Set())
  const [batchModalVisible, setBatchModalVisible] = useState(false)
  const [batchAction, setBatchAction] = useState('RELEASE')
  const [pendingExtractions, setPendingExtractions] = useState(null)
  const [pendingSceneFeatures, setPendingSceneFeatures] = useState(null)
  const initialExtractionsRef = useRef(null)
  const initialScenesRef = useRef(null)

  const extraDirtyCheck = useCallback(() => {
    if (pendingExtractions !== null && JSON.stringify(pendingExtractions) !== initialExtractionsRef.current) return true
    if (pendingSceneFeatures !== null && JSON.stringify(pendingSceneFeatures) !== initialScenesRef.current) return true
    return false
  }, [pendingExtractions, pendingSceneFeatures])

  const filtered = useMemo(() => entryPoints.filter(ep => {
    if (applied.code && !ep.eventPoint.toLowerCase().includes(applied.code.toLowerCase())) return false
    if (applied.desc && !ep.description.toLowerCase().includes(applied.desc.toLowerCase())) return false
    if (applied.status !== 'ALL') {
      if (applied.status === 'ENABLED' && ep.status !== 1) return false
      if (applied.status === 'DISABLED' && ep.status !== 2) return false
    }
    if (applied.lifecycle !== 'ALL') {
      const s = getRunStatus(ep)
      if (applied.lifecycle === 'RUNNING' && s.label !== '运行中') return false
      if (applied.lifecycle === 'STOPPED' && s.label !== '已停用') return false
      if (applied.lifecycle === 'UNPUBLISHED' && s.label !== '未发布') return false
    }
    return true
  }), [entryPoints, applied])

  const getRelatedCount = (ep) => activations.filter(a => a.eventPoint === ep.eventPoint).length

  const openView = (ep) => {
    setSelectedItem(ep)
    setInitialMode('view')
    const epCode = ep.eventPoint || ''
    const initExtr = extractions[epCode] || []
    const initScenes = sceneFeatures[epCode] || { PRE: [], PROCESS: [], POST: [] }
    initialExtractionsRef.current = JSON.stringify(initExtr)
    initialScenesRef.current = JSON.stringify(initScenes)
    setPendingExtractions(initExtr)
    setPendingSceneFeatures(initScenes)
    setMode('EDITOR')
  }
  const openEdit = (ep) => {
    setSelectedItem(ep)
    setInitialMode('edit')
    const epCode = ep.eventPoint || ''
    const initExtr = extractions[epCode] || []
    const initScenes = sceneFeatures[epCode] || { PRE: [], PROCESS: [], POST: [] }
    initialExtractionsRef.current = JSON.stringify(initExtr)
    initialScenesRef.current = JSON.stringify(initScenes)
    setPendingExtractions(initExtr)
    setPendingSceneFeatures(initScenes)
    setMode('EDITOR')
  }
  const openNew = () => {
    setSelectedItem(null)
    setInitialMode('edit')
    initialExtractionsRef.current = null
    initialScenesRef.current = null
    setPendingExtractions(null)
    setPendingSceneFeatures(null)
    setMode('EDITOR')
  }

  const handleSave = (data) => {
    let saved
    if (selectedItem) {
      saved = { ...selectedItem, ...data }
    } else {
      const newId = entryPoints.length ? Math.max(...entryPoints.map(ep => ep.id)) + 1 : 1
      saved = { id: newId, eventPoint: data.eventPoint || '', description: data.description || '', status: data.status ?? 1, lifecycleState: 'DRAFT', createAt: new Date().toISOString().replace('T', ' ').slice(0, 19), updateAt: data.updateAt || '', operator: data.operator || '' }
    }
    onSaveEntryPoint(saved)
    // Commit pending extraction/scene data
    const epCode = saved.eventPoint || ''
    if (pendingExtractions !== null) {
      onSaveExtractions(epCode, pendingExtractions)
    }
    if (pendingSceneFeatures !== null) {
      onSaveSceneFeatures(epCode, pendingSceneFeatures)
    }
    return saved
  }

  const handleDelete = (id) => {
    if (confirm('确定要删除该接入点吗？此操作不可恢复。')) {
      onDeleteEntryPoint(id)
      const next = new Set(selected); next.delete(id); setSelected(next)
    }
  }

  const handleSelectAll = (e) => {
    e.target.checked ? setSelected(new Set(filtered.map(ep => ep.id))) : setSelected(new Set())
  }
  const toggleRow = (id) => {
    const next = new Set(selected); next.has(id) ? next.delete(id) : next.add(id); setSelected(next)
  }

  const openBatchModal = (action) => { setBatchAction(action); setBatchModalVisible(true) }
  const executeBatch = (eligibleItems) => {
    const ids = eligibleItems.map(it => it.id)
    if (batchAction === 'RELEASE') {
      eligibleItems.forEach(it => {
        onAddToDrafts({ id: `DFT-${Date.now()}-${it.id}`, type: 'ENTRY_POINT', targetId: String(it.id), targetName: it.eventPoint, version: 'vNext', relatedKeys: it.eventPoint, updatedAt: new Date().toISOString(), editor: 'current_user', changeSummary: '批量加入发布清单' })
      })
      onBatchUpdateEntryPoints(ids, { lifecycleState: 'READY' })
    } else if (batchAction === 'ENABLE' || batchAction === 'DISABLE') {
      const newStatus = batchAction === 'ENABLE' ? 1 : 2
      onBatchUpdateEntryPoints(ids, { status: newStatus, lifecycleState: 'DRAFT', updateAt: new Date().toISOString().replace('T', ' ').slice(0, 19) })
    } else if (batchAction === 'DELETE') {
      onBatchDeleteEntryPoints(ids)
    }
    setSelected(new Set())
    setBatchModalVisible(false)
  }

  const [epTab, setEpTab] = useState(0)

  if (mode === 'EDITOR') {
    const versions = selectedItem ? MOCK_VERSIONS.filter(v => v.eventPointId === selectedItem.id) : []
    const epCode = selectedItem?.eventPoint || ''
    const epExtractions = extractions[epCode] || []
    const epScenes = sceneFeatures[epCode] || { PRE: [], PROCESS: [], POST: [] }
    const extractedProps = epExtractions.map(e => ({ propertyName: e.propertyName, propertyDesc: e.propertyDesc }))

    const TAB_ITEMS = [
      { key: 0, label: '基本信息' },
      { key: 1, label: '属性提取配置' },
      { key: 2, label: '场景编排' },
    ]

    return (
      <EntityEditorShell
        entityName="接入点"
        item={selectedItem}
        isNew={!selectedItem}
        initialMode={initialMode}
        onBack={() => { setMode('LIST'); setEpTab(0) }}
        onSave={handleSave}
        versions={versions}
        extraDirtyCheck={extraDirtyCheck}
        renderForm={({ data, onChange, mode: m, changeNoteEl }) => (
          <div className="space-y-4">
            {/* Tab 切换栏 */}
            {selectedItem && (
              <div className="flex border-b border-slate-200">
                {TAB_ITEMS.map(tab => (
                  <button key={tab.key} onClick={() => setEpTab(tab.key)}
                    className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${epTab === tab.key ? 'text-[#1890ff]' : 'text-[rgba(0,0,0,0.65)] hover:text-[#1890ff]'}`}>
                    {tab.label}
                    {epTab === tab.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1890ff]" />}
                  </button>
                ))}
              </div>
            )}

            {/* Tab 0: 基本信息 */}
            {(epTab === 0 || !selectedItem) && (
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-5">
                <h3 className="text-base font-semibold text-slate-800">基本信息</h3>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">接入点编码 *</label>
                  {m === 'edit' ? (
                    <input type="text" value={data.eventPoint || ''} onChange={e => onChange('eventPoint', e.target.value)}
                      disabled={!!selectedItem}
                      className={`w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 ${selectedItem ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
                      placeholder="如：EP00000005" />
                  ) : (
                    <div className="text-sm font-mono text-[#1890ff]">{data.eventPoint}</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">描述</label>
                  {m === 'edit' ? (
                    <textarea value={data.description || ''} onChange={e => onChange('description', e.target.value)} rows={3}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      placeholder="请输入描述" />
                  ) : (
                    <div className="text-sm text-[rgba(0,0,0,0.65)]">{data.description || '-'}</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">启用状态</label>
                  {m === 'edit' ? (
                    <div className="flex items-center gap-3">
                      <StatusToggle enabled={data.status === 1} onChange={v => onChange('status', v ? 1 : 2)} />
                      <span className={`text-sm font-medium ${data.status === 1 ? 'text-green-600' : 'text-slate-500'}`}>{data.status === 1 ? '启用' : '禁用'}</span>
                    </div>
                  ) : (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${data.status === 1 ? 'bg-[#f6ffed] text-[#52c41a] border-[#b7eb8f]' : 'bg-[#f5f5f5] text-[rgba(0,0,0,0.45)] border-[#d9d9d9]'}`}>
                      {data.status === 1 ? '启用' : '禁用'}
                    </span>
                  )}
                </div>
                {m === 'view' && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div><div className="text-xs text-[rgba(0,0,0,0.45)] mb-1">生命周期状态</div><div className="text-sm text-[rgba(0,0,0,0.65)]">{{ PUBLISHED: '已发布', DRAFT: '草稿', ARCHIVED: '已归档', READY: '待发布' }[data.lifecycleState] || data.lifecycleState || '-'}</div></div>
                    <div><div className="text-xs text-[rgba(0,0,0,0.45)] mb-1">更新时间</div><div className="text-sm text-[rgba(0,0,0,0.65)]">{data.updateAt || '-'}</div></div>
                    <div><div className="text-xs text-[rgba(0,0,0,0.45)] mb-1">创建时间</div><div className="text-sm text-[rgba(0,0,0,0.65)]">{data.createAt || '-'}</div></div>
                    <div><div className="text-xs text-[rgba(0,0,0,0.45)] mb-1">操作人</div><div className="text-sm text-[rgba(0,0,0,0.65)]">{data.operator || '-'}</div></div>
                  </div>
                )}
                {changeNoteEl}
              </div>
            )}

            {/* Tab 1: 属性提取配置 */}
            {epTab === 1 && selectedItem && (
              <ExtractionConfig
                eventPointCode={epCode}
                extractions={m === 'edit' && pendingExtractions !== null ? pendingExtractions : epExtractions}
                standardProperties={properties}
                onChange={(list) => {
                  if (m === 'edit') setPendingExtractions(list)
                  else onSaveExtractions(epCode, list)
                }}
                readOnly={m === 'view'}
              />
            )}

            {/* Tab 2: 场景编排 */}
            {epTab === 2 && selectedItem && (
              <SceneOrchestration
                eventPointCode={epCode}
                sceneFeatures={m === 'edit' && pendingSceneFeatures !== null ? pendingSceneFeatures : epScenes}
                availableFeatures={features}
                availableProperties={m === 'edit' && pendingExtractions !== null ? pendingExtractions.map(e => ({ propertyName: e.propertyName, propertyDesc: e.propertyDesc })) : extractedProps}
                onChange={(scenes) => {
                  if (m === 'edit') setPendingSceneFeatures(scenes)
                  else onSaveSceneFeatures(epCode, scenes)
                }}
                readOnly={m === 'view'}
              />
            )}
          </div>
        )}
        extraSections={({ data }) => {
          if (epTab !== 0) return null
          const related = activations.filter(a => a.eventPoint === data.eventPoint)
          if (related.length === 0) return null
          return (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
              <h3 className="text-base font-semibold text-slate-800 mb-4">关联策略</h3>
              <table className="w-full" style={{ tableLayout: 'auto' }}>
                <thead>
                  <tr className="bg-[#fafafa] border-b border-[#f0f0f0]">
                    <th className="px-3 py-2 text-left text-xs font-medium text-[rgba(0,0,0,0.65)]">策略名称</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-[rgba(0,0,0,0.65)]">优先级</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-[rgba(0,0,0,0.65)]">描述</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-[rgba(0,0,0,0.65)] w-[90px]">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {related.map(a => {
                    const s = getRunStatus(a)
                    return (
                      <tr key={a.id} className="border-b border-[#f0f0f0] hover:bg-[#fafafa]">
                        <td className="px-3 py-2 text-sm font-mono text-[rgba(0,0,0,0.88)]">{a.name}</td>
                        <td className="px-3 py-2 text-sm text-[rgba(0,0,0,0.65)]">{a.priority}</td>
                        <td className="px-3 py-2 text-sm text-[rgba(0,0,0,0.45)]">{a.description}</td>
                        <td className="px-3 py-2 text-center"><span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${s.cls}`}>{s.label}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
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
              <label className="text-xs font-medium text-slate-500">接入点编码</label>
              <div className="mt-1 relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="输入编码" value={filter.code}
                  onChange={e => setFilter({ ...filter, code: e.target.value })}
                  className="w-40 pl-8 pr-3 py-1.5 rounded border border-slate-300 text-sm focus:outline-none focus:border-[#1890ff] focus:ring-1 focus:ring-[#1890ff] transition-colors" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">描述</label>
              <div className="mt-1 relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="输入描述" value={filter.desc}
                  onChange={e => setFilter({ ...filter, desc: e.target.value })}
                  className="w-40 pl-8 pr-3 py-1.5 rounded border border-slate-300 text-sm focus:outline-none focus:border-[#1890ff] focus:ring-1 focus:ring-[#1890ff] transition-colors" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">运行状态</label>
              <select value={filter.lifecycle} onChange={e => setFilter({ ...filter, lifecycle: e.target.value })}
                className="mt-1 block w-28 border border-slate-300 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-[#1890ff]">
                {LC_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
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
            {window.__hasPerm?.('ep:edit') && (
              <button onClick={openNew} className="inline-flex items-center px-4 py-1.5 text-sm font-medium text-[#1890ff] bg-indigo-50 border border-[#1890ff] rounded hover:bg-indigo-100 shadow-sm transition-colors whitespace-nowrap">
                <Plus className="w-4 h-4 mr-1" />新建接入点
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
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">接入点编码</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">描述</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">关联策略数</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 w-[90px]">运行状态</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">更新时间/操作人</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 w-[140px]">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(ep => {
              const s = getRunStatus(ep)
              return (
                <tr key={ep.id} className={`hover:bg-[#f0f7ff] transition-colors group ${selected.has(ep.id) ? 'bg-indigo-50/30' : ''}`}>
                  <td className="px-3 py-3">
                    <input type="checkbox" className="w-4 h-4 text-indigo-600 border-slate-300 rounded"
                      checked={selected.has(ep.id)} onChange={() => toggleRow(ep.id)} />
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-sm font-mono text-[#1890ff] cursor-pointer hover:underline" onClick={() => openView(ep)}>{ep.eventPoint}</div>
                  </td>
                  <td className="px-3 py-3 text-sm text-[rgba(0,0,0,0.65)]">
                    {ep.description || '-'}
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-[#e6f7ff] text-[#1890ff] border border-[#91d5ff]">{getRelatedCount(ep)} 个策略</span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${s.cls}`}>{s.label}</span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-xs text-[rgba(0,0,0,0.65)]">{ep.updateAt}</div>
                    <div className="text-xs text-[rgba(0,0,0,0.45)]">by {ep.operator}</div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-center text-sm font-medium">
                    <div className="flex justify-center gap-2">
                      <button className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors" onClick={() => openView(ep)} title="查看详情">
                        <Eye className="w-4 h-4 mr-1" />查看
                      </button>
                      {window.__hasPerm?.('ep:edit') && (
                        <button className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors" onClick={() => openEdit(ep)} title="编辑接入点">
                          <SquarePen className="w-4 h-4 mr-1" />编辑
                        </button>
                      )}
                      <button className="flex items-center text-slate-400 hover:text-red-600 transition-colors" onClick={() => handleDelete(ep.id)} title="删除接入点">
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
        selectedItems={entryPoints.filter(it => selected.has(it.id))}
        onExecute={executeBatch}
        onClose={() => setBatchModalVisible(false)}
      />
    </div>
  )
}
