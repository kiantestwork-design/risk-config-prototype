// FeatureList 页面 - 还原自 app.js hz 组件（offset 676820，~22K）
import { useState, useMemo, useEffect } from 'react'
import { Search, Eye, SquarePen, Trash2, Plus, Key, Settings } from 'lucide-react'
import MultiSelectFilter from '../components/MultiSelectFilter'
import EntityEditorShell from '../components/EntityEditorShell'
import StatusToggle from '../components/StatusToggle'
import ConditionExpressionEditor from '../components/ConditionExpressionEditor'
import { MOCK_FEATURE_VERSIONS } from '../config/mock/versions'
import BulkActionToolbar from '../components/list/BulkActionToolbar'
import BulkConfirmModal, { checkEligibility } from '../components/list/BulkConfirmModal'

function getRunStatus(item) {
  if (item.lifecycleState === 'PUBLISHED' && item.status === 1) return { label: '运行中', cls: 'bg-[#f6ffed] text-[#52c41a] border border-[#b7eb8f]' }
  if (item.lifecycleState === 'PUBLISHED' && item.status === 2) return { label: '已停用', cls: 'bg-[#f5f5f5] text-[rgba(0,0,0,0.45)] border border-[#d9d9d9]' }
  return { label: '未发布', cls: 'bg-[#fff7e6] text-[#fa8c16] border border-[#ffd591]' }
}

const TYPE_LABELS = {
  DirectStorage: '直接存储', HistoryStorage: '历史存储', Aggregation: '聚合特征',
  StatefulStorage: '状态存储', ExternalDataSource: '外部数据源', OfflineStorage: '离线存储',
}
const TYPE_COLORS = {
  HistoryStorage: 'bg-blue-50 text-blue-700 border-blue-200',
  DirectStorage: 'bg-purple-50 text-purple-700 border-purple-200',
  Aggregation: 'bg-orange-50 text-orange-700 border-orange-200',
  StatefulStorage: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ExternalDataSource: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  OfflineStorage: 'bg-amber-50 text-amber-700 border-amber-200',
}

export default function FeatureList({ features, onSaveFeature, onAddToDrafts, entryPoints = [] }) {
  const [items, setItems] = useState(features)
  useEffect(() => { setItems(features) }, [features])
  const [mode, setMode] = useState('LIST')
  const [selectedItem, setSelectedItem] = useState(null)
  const [initialMode, setInitialMode] = useState('view')
  const [filter, setFilter] = useState({ name: '', type: 'ALL', lifecycle: 'ALL', status: 'ALL', eventPoints: [] })
  const [applied, setApplied] = useState({ name: '', type: 'ALL', lifecycle: 'ALL', status: 'ALL', eventPoints: [] })
  // 选中集合 + 批量操作
  const [selected, setSelected] = useState(new Set())
  const [batchModalVisible, setBatchModalVisible] = useState(false)
  const [batchAction, setBatchAction] = useState('RELEASE')

  const allEpOpts = useMemo(() => [...new Set(items.flatMap(ft => ft.eventPoints || []))].filter(Boolean).map(ep => ({ value: ep, label: ep })), [items])

  const filtered = useMemo(() => items.filter(ft => {
    if (applied.name && !ft.name.toLowerCase().includes(applied.name.toLowerCase()) && !ft.description.toLowerCase().includes(applied.name.toLowerCase())) return false
    if (applied.type !== 'ALL' && ft.type !== applied.type) return false
    if (applied.status !== 'ALL') {
      if (applied.status === 'ENABLED' && ft.status !== 1) return false
      if (applied.status === 'DISABLED' && ft.status !== 2) return false
    }
    if (applied.eventPoints.length > 0 && !(ft.eventPoints || []).some(ep => applied.eventPoints.includes(ep))) return false
    if (applied.lifecycle !== 'ALL') {
      const s = getRunStatus(ft)
      if (applied.lifecycle === 'RUNNING' && s.label !== '运行中') return false
      if (applied.lifecycle === 'STOPPED' && s.label !== '已停用') return false
      if (applied.lifecycle === 'UNPUBLISHED' && s.label !== '未发布') return false
    }
    return true
  }), [items, applied])

  const openView = (ft) => { setSelectedItem(ft); setInitialMode('view'); setMode('EDITOR') }
  const openEdit = (ft) => { setSelectedItem(ft); setInitialMode('edit'); setMode('EDITOR') }
  const openNew = () => { setSelectedItem(null); setInitialMode('edit'); setMode('EDITOR') }

  const handleSave = (data) => {
    let saved
    if (selectedItem) {
      saved = { ...selectedItem, ...data }
      setItems(prev => prev.map(ft => ft.id === saved.id ? saved : ft))
    } else {
      const newId = Date.now()
      saved = { id: newId, name: data.name || '', description: data.description || '', type: data.type || 'DirectStorage', writeSource: 'REALTIME', valueType: 'STRING', status: data.status ?? 1, lifecycleState: 'DRAFT', eventPoints: data.eventPoints || [], dependentFeatures: [], conditionExpression: { logic: 'AND', groups: [] }, compositeKeyJsonPaths: '[]', calculationConfig: '{}', includeCurrentEvent: false, updateAt: data.updateAt || '', operator: data.operator || '' }
      setItems(prev => [...prev, saved])
    }
    onSaveFeature(saved)
    return saved
  }

  const handleDelete = (id) => {
    if (confirm('确定要删除该特征吗？此操作不可恢复。')) {
      setItems(prev => prev.filter(ft => ft.id !== id))
      const next = new Set(selected); next.delete(id); setSelected(next)
    }
  }

  const handleSelectAll = (e) => {
    e.target.checked ? setSelected(new Set(filtered.map(ft => ft.id))) : setSelected(new Set())
  }
  const toggleRow = (id) => {
    const next = new Set(selected); next.has(id) ? next.delete(id) : next.add(id); setSelected(next)
  }

  const openBatchModal = (action) => { setBatchAction(action); setBatchModalVisible(true) }
  const executeBatch = (eligibleItems) => {
    if (batchAction === 'RELEASE') {
      eligibleItems.forEach(it => {
        onAddToDrafts({ id: `DFT-${Date.now()}-${it.id}`, type: 'FEATURE', targetId: String(it.id), targetName: it.name, version: 'vNext', relatedKeys: (it.eventPoints || []).join(', '), updatedAt: new Date().toISOString(), editor: 'current_user', changeSummary: '批量加入发布清单' })
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
    const featureVersions = selectedItem ? MOCK_FEATURE_VERSIONS.filter(v => v.featureId === selectedItem.id) : []
    return (
      <EntityEditorShell
        entityName="特征"
        item={selectedItem}
        isNew={!selectedItem}
        initialMode={initialMode}
        onBack={() => setMode('LIST')}
        onSave={handleSave}
        versions={featureVersions}
        renderForm={({ data, onChange, mode: m, changeNoteEl }) => {
          const cfg = (() => { try { return typeof data.calculationConfig === 'string' ? JSON.parse(data.calculationConfig || '{}') : (data.calculationConfig || {}) } catch { return {} } })()
          const setCfg = (k, v) => { const next = { ...cfg, [k]: v }; if (v === '' || v === null || v === undefined) delete next[k]; onChange('calculationConfig', JSON.stringify(next)) }
          const tp = data.type || 'DirectStorage'
          let compositeKeys = []
          try { compositeKeys = JSON.parse(data.compositeKeyJsonPaths || '[]') } catch { compositeKeys = [] }
          const setKeys = (v) => { onChange('compositeKeyJsonPaths', JSON.stringify(v)) }

          const fe = (v) => {
            const map = { PUBLISHED: '已发布', DRAFT: '草稿', ARCHIVED: '已归档', READY: '待发布', REALTIME: '实时', OFFLINE: '离线',
              DirectStorage: '直接存储', HistoryStorage: '历史存储', Aggregation: '聚合特征', StatefulStorage: '状态存储',
              ExternalDataSource: '外部数据源', OfflineStorage: '离线存储', 1: '启用', 2: '禁用' }
            return map[v] || v || '-'
          }

          return m === 'view' ? (
            /* ========== 查看模式 ========== */
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
                <h3 className="font-semibold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Settings className="w-5 h-5 text-indigo-500" />当前展示版本配置
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-8 text-sm">
                  <div className="space-y-1.5"><span className="text-slate-500 block text-xs">特征名</span><span className="font-medium text-slate-900 font-mono select-all bg-slate-50 px-1 rounded">{data.name}</span></div>
                  <div className="space-y-1.5"><span className="text-slate-500 block text-xs">特征描述</span><span className="font-medium text-slate-900">{data.description}</span></div>
                  <div className="space-y-1.5"><span className="text-slate-500 block text-xs">生命周期状态</span><span className="font-medium text-slate-900">{fe(data.lifecycleState)}</span></div>
                  <div className="space-y-1.5"><span className="text-slate-500 block text-xs">启用状态</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${data.status === 1 ? 'bg-green-50 text-green-700 border-green-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${data.status === 1 ? 'bg-green-500' : 'bg-slate-400'}`} />
                      {fe(data.status)}
                    </span>
                  </div>
                  <div className="space-y-1.5"><span className="text-slate-500 block text-xs">特征类型</span><span className="font-medium text-slate-900">{fe(tp)}</span></div>
                  <div className="space-y-1.5"><span className="text-slate-500 block text-xs">数据来源</span><span className="font-medium text-slate-900">{fe(data.writeSource)}</span></div>
                  <div className="space-y-1.5"><span className="text-slate-500 block text-xs">数据类型</span><span className="font-medium text-slate-900 font-mono">{fe(data.valueType)}</span></div>
                  <div className="space-y-1.5"><span className="text-slate-500 block text-xs">包含当前事件</span><span className="font-medium text-slate-900">{data.includeCurrentEvent ? '是 (Yes)' : '否 (No)'}</span></div>
                  <div className="col-span-2 md:col-span-4 space-y-1.5"><span className="text-slate-500 block text-xs">事件接入点</span>
                    <div className="flex flex-wrap gap-2">{(data.eventPoints || []).length > 0 ? (data.eventPoints || []).map(ep => <span key={ep} className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs border border-slate-200 font-mono">{ep}</span>) : <span className="text-slate-400">-</span>}</div>
                  </div>
                  <div className="col-span-2 md:col-span-4 space-y-1.5 pt-2 border-t border-slate-50"><span className="text-slate-500 block text-xs">最后更新</span><span className="font-medium text-slate-700 font-mono text-xs">{data.updateAt || '-'}</span></div>
                </div>
              </div>
              <ConditionExpressionEditor value={data.conditionExpression || { logic: 'AND', groups: [] }} onChange={() => {}} readOnly label="前置条件表达式" />
            </div>
          ) : (
            /* ========== 编辑模式 ========== */
            <div className="space-y-6">
              {/* 区块一：基本信息 */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">基本信息</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[800px]">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">特征名 (Name) <span className="text-red-500">*</span></label>
                    <input type="text" value={data.name || ''} onChange={e => onChange('name', e.target.value)}
                      disabled={!!selectedItem}
                      className={`w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${selectedItem ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                      placeholder="如：user_txn_count_24h" />
                    <p className="mt-1 text-xs text-slate-400">系统唯一标识，创建后不可修改。</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">特征描述 <span className="text-red-500">*</span></label>
                    <input type="text" value={data.description || ''} onChange={e => onChange('description', e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">启用状态</label>
                    <div className="flex items-center gap-4">
                      <StatusToggle enabled={data.status === 1} onChange={v => onChange('status', v ? 1 : 2)} />
                      <span className={`text-sm font-medium ${data.status === 1 ? 'text-indigo-600' : 'text-slate-500'}`}>{data.status === 1 ? '启用' : '禁用'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">数据类型</label>
                    <select value={data.valueType || 'STRING'} onChange={e => onChange('valueType', e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                      <option value="STRING">STRING</option><option value="INTEGER">INTEGER</option><option value="LIST">LIST</option><option value="DOUBLE">DOUBLE</option><option value="BOOLEAN">BOOLEAN</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 区块二：数据源与计算配置 */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="w-1 h-5 bg-indigo-500 rounded-full inline-block" />数据源与计算配置
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[800px]">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">特征类型</label>
                    <select value={tp} onChange={e => onChange('type', e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                      <option value="DirectStorage">直接存储 DirectStorage</option>
                      <option value="HistoryStorage">历史存储 HistoryStorage</option>
                      <option value="Aggregation">聚合 Aggregation</option>
                      <option value="StatefulStorage">状态存储 StatefulStorage</option>
                      <option value="ExternalDataSource">外部数据源 ExternalDataSource</option>
                      <option value="OfflineStorage">离线存储 OfflineStorage</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">数据来源</label>
                    <select value={data.writeSource || 'REALTIME'} onChange={e => onChange('writeSource', e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                      <option value="REALTIME">实时 (REALTIME)</option><option value="OFFLINE">离线 (OFFLINE)</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">触发事件接入点</label>
                    <input type="text" value={(data.eventPoints || []).join(', ')} placeholder="多个接入点以逗号分隔"
                      onChange={e => onChange('eventPoints', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                    <p className="text-xs text-slate-400 mt-1">支持多个接入点，以逗号分隔。</p>
                  </div>
                </div>
              </div>

              {/* 区块三：核心逻辑配置 */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-6">
                <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="w-1 h-5 bg-indigo-500 rounded-full inline-block" />核心逻辑配置
                </h3>
                <ConditionExpressionEditor value={data.conditionExpression || { logic: 'AND', groups: [] }} onChange={v => onChange('conditionExpression', v)} label="前置条件表达式" />
                <p className="text-xs text-slate-400 -mt-4">满足条件时才会执行特征提取。</p>

                {/* 复合键维度 + 参数配置 并排 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  {/* 复合键维度配置 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Key className="w-4 h-4 text-indigo-500" />复合键维度配置 (Key)
                      </label>
                      <button type="button" onClick={() => setKeys([...compositeKeys, { key: '', defaultValue: '' }])}
                        className="text-xs flex items-center text-white bg-indigo-500 hover:bg-indigo-600 px-2 py-1 rounded">
                        <Plus className="w-3 h-3 mr-1" /> 添加维度
                      </button>
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {compositeKeys.length === 0 ? (
                        <div className="text-xs text-slate-400 text-center py-4 border border-dashed border-slate-300 rounded">无维度配置</div>
                      ) : compositeKeys.map((dim, idx) => (
                        <div key={idx} className="flex gap-2 items-start bg-white p-2 rounded border border-slate-200">
                          <div className="flex-1 space-y-1">
                            <input type="text" placeholder="提取路径 (Key)" className="w-full text-xs border border-slate-300 rounded px-2 py-1"
                              value={dim.key} onChange={e => { const next = [...compositeKeys]; next[idx] = { ...next[idx], key: e.target.value }; setKeys(next) }} />
                            <input type="text" placeholder="默认值 (Default)" className="w-full text-xs border border-slate-300 rounded px-2 py-1 text-slate-600"
                              value={dim.defaultValue} onChange={e => { const next = [...compositeKeys]; next[idx] = { ...next[idx], defaultValue: e.target.value }; setKeys(next) }} />
                          </div>
                          <button type="button" onClick={() => { const next = [...compositeKeys]; next.splice(idx, 1); setKeys(next) }}
                            className="text-slate-400 hover:text-red-500 mt-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-2">定义特征的聚合维度或存储主键。</p>
                  </div>

                  {/* 参数配置面板 - 按 type 联动 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <Settings className="w-4 h-4 text-indigo-500" />参数配置 ({fe(tp)})
                    </label>
                    <div className="space-y-3">
                      {/* DirectStorage */}
                      {tp === 'DirectStorage' && <>
                        <div><label className="block text-xs font-medium text-slate-500 mb-1">数值提取路径</label>
                          <input type="text" className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 font-mono" value={cfg.valueJsonPath || ''} onChange={e => setCfg('valueJsonPath', e.target.value)} /></div>
                        <div><label className="block text-xs font-medium text-slate-500 mb-1">TTL (秒)</label>
                          <input type="number" className="w-full text-xs border border-slate-300 rounded px-2 py-1.5" value={cfg.ttlSeconds ?? ''} onChange={e => setCfg('ttlSeconds', e.target.value === '' ? null : Number(e.target.value))} /></div>
                        <div><label className="block text-xs font-medium text-slate-500 mb-1">写入模式</label>
                          <select className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 bg-white" value={cfg.writeMode || 'ALWAYS'} onChange={e => setCfg('writeMode', e.target.value)}>
                            {['ALWAYS', 'SET_IF_ABSENT', 'INCREMENT', 'DECREMENT'].map(v => <option key={v} value={v}>{v}</option>)}
                          </select></div>
                      </>}

                      {/* HistoryStorage - 存储模式切换 */}
                      {tp === 'HistoryStorage' && <>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-2">存储模式</label>
                          <div className="grid grid-cols-2 gap-2 mb-1">
                            <div className={`border-2 rounded-lg p-2 text-center cursor-pointer ${!cfg.storageMode || cfg.storageMode === 'FIXED_SIZE' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white'}`}
                              onClick={() => setCfg('storageMode', 'FIXED_SIZE')}>
                              <div className="text-xs font-semibold text-slate-700">固定容量</div>
                              <div className="text-xs text-slate-400 mt-0.5">保留最近 N 条</div>
                            </div>
                            <div className={`border-2 rounded-lg p-2 text-center cursor-pointer ${cfg.storageMode === 'TIME_WINDOW' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white'}`}
                              onClick={() => setCfg('storageMode', 'TIME_WINDOW')}>
                              <div className="text-xs font-semibold text-slate-700">时间窗口</div>
                              <div className="text-xs text-slate-400 mt-0.5">保留最近 N 秒内</div>
                            </div>
                          </div>
                        </div>
                        {cfg.storageMode === 'TIME_WINDOW' ? <>
                          <div><label className="block text-xs font-medium text-slate-500 mb-1">时间窗口 (秒)</label>
                            <input type="number" className="w-full text-xs border border-slate-300 rounded px-2 py-1.5" value={cfg.timeWindowSeconds ?? ''} onChange={e => setCfg('timeWindowSeconds', e.target.value === '' ? null : Number(e.target.value))} /></div>
                          <div><label className="block text-xs font-medium text-slate-500 mb-1">时间戳路径 (选填，空=系统时间)</label>
                            <input type="text" className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 font-mono" value={cfg.timestampJsonPath || ''} onChange={e => setCfg('timestampJsonPath', e.target.value)} /></div>
                        </> : (
                          <div><label className="block text-xs font-medium text-slate-500 mb-1">历史记录大小</label>
                            <input type="number" className="w-full text-xs border border-slate-300 rounded px-2 py-1.5" value={cfg.historySize ?? ''} onChange={e => setCfg('historySize', e.target.value === '' ? null : Number(e.target.value))} /></div>
                        )}
                        <div><label className="block text-xs font-medium text-slate-500 mb-1">数值提取路径</label>
                          <input type="text" className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 font-mono" value={cfg.valueJsonPath || ''} onChange={e => setCfg('valueJsonPath', e.target.value)} /></div>
                        <div><label className="block text-xs font-medium text-slate-500 mb-1">TTL (秒)</label>
                          <input type="number" className="w-full text-xs border border-slate-300 rounded px-2 py-1.5" value={cfg.ttlSeconds ?? ''} onChange={e => setCfg('ttlSeconds', e.target.value === '' ? null : Number(e.target.value))} /></div>
                        <div><label className="block text-xs font-medium text-slate-500 mb-1">写入模式</label>
                          <select className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 bg-white" value={cfg.writeMode || 'ALWAYS'} onChange={e => setCfg('writeMode', e.target.value)}>
                            {['ALWAYS', 'SET_IF_ABSENT'].map(v => <option key={v} value={v}>{v}</option>)}
                          </select></div>
                      </>}

                      {/* Aggregation */}
                      {tp === 'Aggregation' && <>
                        <div><label className="block text-xs font-medium text-slate-500 mb-1">聚合方法</label>
                          <input type="text" list="calc-methods" className="w-full text-xs border border-slate-300 rounded px-2 py-1.5" value={cfg.method || ''} onChange={e => setCfg('method', e.target.value)} />
                          <datalist id="calc-methods">{['COUNT', 'SUM', 'AVG', 'MAX', 'MIN'].map(v => <option key={v} value={v} />)}</datalist></div>
                        <div><label className="block text-xs font-medium text-slate-500 mb-1">来源特征</label>
                          <input type="text" className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 font-mono" value={cfg.sourceFeatureName || ''} onChange={e => setCfg('sourceFeatureName', e.target.value)} /></div>
                        <div><label className="block text-xs font-medium text-slate-500 mb-1">时间窗口 (秒)</label>
                          <input type="number" className="w-full text-xs border border-slate-300 rounded px-2 py-1.5" value={cfg.timeWindowSeconds ?? ''} onChange={e => setCfg('timeWindowSeconds', e.target.value === '' ? null : Number(e.target.value))} /></div>
                        <div><label className="block text-xs font-medium text-slate-500 mb-1">时间戳提取路径 (选填，空=系统时间)</label>
                          <input type="text" className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 font-mono" value={cfg.timestampJsonPath || ''} onChange={e => setCfg('timestampJsonPath', e.target.value)} /></div>
                      </>}

                      {/* OfflineStorage */}
                      {tp === 'OfflineStorage' && <>
                        <div><label className="block text-xs font-medium text-slate-500 mb-1">来源表名</label>
                          <input type="text" className="w-full text-xs border border-slate-300 rounded px-2 py-1.5" value={cfg.sourceTable || ''} onChange={e => setCfg('sourceTable', e.target.value)} /></div>
                        <div><label className="block text-xs font-medium text-slate-500 mb-1">来源字段</label>
                          <input type="text" className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 font-mono" value={cfg.sourceColumn || ''} onChange={e => setCfg('sourceColumn', e.target.value)} /></div>
                        <div><label className="block text-xs font-medium text-slate-500 mb-1">主键列</label>
                          <input type="text" className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 font-mono" value={cfg.entityIdColumn || ''} onChange={e => setCfg('entityIdColumn', e.target.value)} /></div>
                        <div><label className="block text-xs font-medium text-slate-500 mb-1">日期分区列</label>
                          <input type="text" className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 font-mono" value={cfg.datePartitionColumn || ''} onChange={e => setCfg('datePartitionColumn', e.target.value)} /></div>
                        <div><label className="block text-xs font-medium text-slate-500 mb-1">分区日期策略</label>
                          <select className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 bg-white" value={cfg.datePartitionValueStrategy || 'YESTERDAY'} onChange={e => setCfg('datePartitionValueStrategy', e.target.value)}>
                            {['TODAY', 'YESTERDAY'].map(v => <option key={v} value={v}>{v}</option>)}
                          </select></div>
                        <div><label className="block text-xs font-medium text-slate-500 mb-1">分区日期格式</label>
                          <select className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 bg-white" value={cfg.datePartitionFormat || 'YYYY_MM_DD'} onChange={e => setCfg('datePartitionFormat', e.target.value)}>
                            {['YYYY_MM_DD', 'YYYYMMDD', 'YYYY_MM', 'YYYYMM'].map(v => <option key={v} value={v}>{v}</option>)}
                          </select></div>
                        <div><label className="block text-xs font-medium text-slate-500 mb-1">分区回退天数</label>
                          <input type="number" className="w-full text-xs border border-slate-300 rounded px-2 py-1.5" value={cfg.datePartitionFallbackDays ?? ''} onChange={e => setCfg('datePartitionFallbackDays', e.target.value === '' ? null : Number(e.target.value))} /></div>
                        <div><label className="block text-xs font-medium text-slate-500 mb-1">写入模式</label>
                          <select className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 bg-white" value={cfg.writeMode || 'ALWAYS'} onChange={e => setCfg('writeMode', e.target.value)}>
                            {['ALWAYS', 'SET_IF_ABSENT'].map(v => <option key={v} value={v}>{v}</option>)}
                          </select></div>
                      </>}

                      {/* StatefulStorage - 完整状态转换配置 */}
                      {tp === 'StatefulStorage' && <>
                        <div><label className="block text-xs font-medium text-slate-500 mb-1">TTL (秒，每次状态变更刷新，默认 172800)</label>
                          <input type="number" className="w-full text-xs border border-slate-300 rounded px-2 py-1.5" value={cfg.ttlSeconds ?? ''} onChange={e => setCfg('ttlSeconds', e.target.value === '' ? null : Number(e.target.value))} /></div>
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-medium text-slate-500">状态转换配置</label>
                            <button type="button" onClick={() => { const t = [...(cfg.transitions || []), { type: 'ENTER', conditionScript: '', idJsonPath: '', valueJsonPath: '' }]; setCfg('transitions', t) }}
                              className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"><Plus className="w-3 h-3" />添加转换</button>
                          </div>
                          {(cfg.transitions || []).length === 0 ? (
                            <div className="text-xs text-slate-400 text-center py-3 border border-dashed border-slate-300 rounded">暂无转换配置，点击"添加转换"</div>
                          ) : (cfg.transitions || []).map((tr, tidx) => (
                            <div key={tidx} className={`border rounded-lg p-3 mb-2 ${tr.type === 'ENTER' ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
                              <div className="flex justify-between items-center mb-2">
                                <select className="text-xs border border-slate-300 rounded px-2 py-1 bg-white font-semibold" value={tr.type}
                                  onChange={e => { const next = [...(cfg.transitions || [])]; next[tidx] = { ...next[tidx], type: e.target.value }; setCfg('transitions', next) }}>
                                  {['ENTER', 'EXIT'].map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                                <button type="button" onClick={() => { const next = (cfg.transitions || []).filter((_, i) => i !== tidx); setCfg('transitions', next) }}
                                  className="text-xs text-red-500 hover:text-red-700">删除</button>
                              </div>
                              <div className="space-y-2">
                                <div><label className="block text-xs text-slate-500 mb-1">触发条件</label>
                                  <input type="text" className="w-full text-xs border border-slate-300 rounded px-2 py-1 font-mono" value={tr.conditionScript || ''}
                                    onChange={e => { const next = [...(cfg.transitions || [])]; next[tidx] = { ...next[tidx], conditionScript: e.target.value }; setCfg('transitions', next) }} /></div>
                                <div><label className="block text-xs text-slate-500 mb-1">ID 路径</label>
                                  <input type="text" className="w-full text-xs border border-slate-300 rounded px-2 py-1 font-mono" value={tr.idJsonPath || ''}
                                    onChange={e => { const next = [...(cfg.transitions || [])]; next[tidx] = { ...next[tidx], idJsonPath: e.target.value }; setCfg('transitions', next) }} /></div>
                                {tr.type === 'ENTER' && (
                                  <div><label className="block text-xs text-slate-500 mb-1">金额路径 (ENTER 专用)</label>
                                    <input type="text" className="w-full text-xs border border-slate-300 rounded px-2 py-1 font-mono" value={tr.valueJsonPath || ''}
                                      onChange={e => { const next = [...(cfg.transitions || [])]; next[tidx] = { ...next[tidx], valueJsonPath: e.target.value }; setCfg('transitions', next) }} /></div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>}

                      {/* ExternalDataSource - 完整协议+参数映射+常量 */}
                      {tp === 'ExternalDataSource' && <>
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className="block text-xs font-medium text-slate-500 mb-1">协议</label>
                            <select className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 bg-white" value={cfg.protocol || 'dubbo'} onChange={e => setCfg('protocol', e.target.value)}>
                              {['dubbo', 'http'].map(v => <option key={v} value={v}>{v}</option>)}
                            </select></div>
                          <div><label className="block text-xs font-medium text-slate-500 mb-1">方法名</label>
                            <input type="text" className="w-full text-xs border border-slate-300 rounded px-2 py-1.5" value={cfg.method || ''} onChange={e => setCfg('method', e.target.value)} /></div>
                        </div>

                        {/* 协议特定配置 */}
                        <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                          <div className="text-xs font-medium text-slate-500 mb-2">{(cfg.protocol || 'dubbo') === 'dubbo' ? 'Dubbo 配置' : 'HTTP 配置'}</div>
                          {cfg.protocol === 'http' ? <>
                            <div className="mb-2"><label className="block text-xs text-slate-500 mb-1">URL</label>
                              <input type="text" className="w-full text-xs border border-slate-300 rounded px-2 py-1 font-mono bg-white" value={(cfg.protocolConfig || {}).url || ''}
                                onChange={e => setCfg('protocolConfig', { ...cfg.protocolConfig, url: e.target.value })} /></div>
                            <div className="grid grid-cols-2 gap-2">
                              <div><label className="block text-xs text-slate-500 mb-1">HTTP 方法</label>
                                <select className="w-full text-xs border border-slate-300 rounded px-2 py-1 bg-white" value={(cfg.protocolConfig || {}).httpMethod || 'POST'}
                                  onChange={e => setCfg('protocolConfig', { ...cfg.protocolConfig, httpMethod: e.target.value })}>
                                  {['GET', 'POST'].map(v => <option key={v} value={v}>{v}</option>)}
                                </select></div>
                              <div><label className="block text-xs text-slate-500 mb-1">连接超时 (ms)</label>
                                <input type="number" className="w-full text-xs border border-slate-300 rounded px-2 py-1 bg-white" value={(cfg.protocolConfig || {}).connectTimeoutMs || ''}
                                  onChange={e => setCfg('protocolConfig', { ...cfg.protocolConfig, connectTimeoutMs: parseInt(e.target.value) || 0 })} /></div>
                            </div>
                          </> : <>
                            <div className="mb-2"><label className="block text-xs text-slate-500 mb-1">接口名</label>
                              <input type="text" className="w-full text-xs border border-slate-300 rounded px-2 py-1 font-mono bg-white" value={(cfg.protocolConfig || {}).interface || ''}
                                onChange={e => setCfg('protocolConfig', { ...cfg.protocolConfig, interface: e.target.value })} /></div>
                            <div><label className="block text-xs text-slate-500 mb-1">重试次数</label>
                              <input type="number" className="w-full text-xs border border-slate-300 rounded px-2 py-1 bg-white" value={(cfg.protocolConfig || {}).retries || 0}
                                onChange={e => setCfg('protocolConfig', { ...cfg.protocolConfig, retries: parseInt(e.target.value) || 0 })} /></div>
                          </>}
                        </div>

                        {/* 参数映射 */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs font-medium text-slate-500">参数映射 (参数名 → riskFact JsonPath)</label>
                            <button type="button" onClick={() => setCfg('paramMapping', [...(cfg.paramMapping || []), { k: '', v: '' }])}
                              className="text-xs text-indigo-600 hover:text-indigo-800">添加</button>
                          </div>
                          <div className="border border-slate-200 rounded overflow-hidden">
                            {(cfg.paramMapping || []).length === 0 ? (
                              <div className="text-xs text-slate-400 text-center py-2">无参数映射</div>
                            ) : (
                              <table className="w-full">
                                <thead><tr className="bg-slate-50"><th className="text-xs text-slate-400 font-normal text-left px-2 py-1">参数名</th><th className="text-xs text-slate-400 font-normal text-left px-2 py-1">JsonPath</th><th className="w-6"></th></tr></thead>
                                <tbody>{(cfg.paramMapping || []).map((pr, pi) => (
                                  <tr key={pi} className="border-t border-slate-100">
                                    <td className="px-2 py-1"><input type="text" className="w-full text-xs border border-slate-200 rounded px-1 py-0.5" value={pr.k}
                                      onChange={e => { const next = [...(cfg.paramMapping || [])]; next[pi] = { ...next[pi], k: e.target.value }; setCfg('paramMapping', next) }} /></td>
                                    <td className="px-2 py-1"><input type="text" className="w-full text-xs border border-slate-200 rounded px-1 py-0.5 font-mono" value={pr.v}
                                      onChange={e => { const next = [...(cfg.paramMapping || [])]; next[pi] = { ...next[pi], v: e.target.value }; setCfg('paramMapping', next) }} /></td>
                                    <td className="px-1"><button type="button" onClick={() => setCfg('paramMapping', (cfg.paramMapping || []).filter((_, i) => i !== pi))}
                                      className="text-xs text-red-400 hover:text-red-600">&times;</button></td>
                                  </tr>
                                ))}</tbody>
                              </table>
                            )}
                          </div>
                        </div>

                        {/* 常量参数 */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs font-medium text-slate-500">常量参数</label>
                            <button type="button" onClick={() => setCfg('constants', [...(cfg.constants || []), { k: '', v: '' }])}
                              className="text-xs text-indigo-600 hover:text-indigo-800">添加</button>
                          </div>
                          <div className="border border-slate-200 rounded overflow-hidden">
                            {(cfg.constants || []).length === 0 ? (
                              <div className="text-xs text-slate-400 text-center py-2">无常量参数</div>
                            ) : (
                              <table className="w-full">
                                <thead><tr className="bg-slate-50"><th className="text-xs text-slate-400 font-normal text-left px-2 py-1">Key</th><th className="text-xs text-slate-400 font-normal text-left px-2 py-1">Value</th><th className="w-6"></th></tr></thead>
                                <tbody>{(cfg.constants || []).map((cr, ci) => (
                                  <tr key={ci} className="border-t border-slate-100">
                                    <td className="px-2 py-1"><input type="text" className="w-full text-xs border border-slate-200 rounded px-1 py-0.5" value={cr.k}
                                      onChange={e => { const next = [...(cfg.constants || [])]; next[ci] = { ...next[ci], k: e.target.value }; setCfg('constants', next) }} /></td>
                                    <td className="px-2 py-1"><input type="text" className="w-full text-xs border border-slate-200 rounded px-1 py-0.5" value={cr.v}
                                      onChange={e => { const next = [...(cfg.constants || [])]; next[ci] = { ...next[ci], v: e.target.value }; setCfg('constants', next) }} /></td>
                                    <td className="px-1"><button type="button" onClick={() => setCfg('constants', (cfg.constants || []).filter((_, i) => i !== ci))}
                                      className="text-xs text-red-400 hover:text-red-600">&times;</button></td>
                                  </tr>
                                ))}</tbody>
                              </table>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div><label className="block text-xs font-medium text-slate-500 mb-1">结果提取路径</label>
                            <input type="text" className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 font-mono" value={cfg.resultPath || ''} onChange={e => setCfg('resultPath', e.target.value)} /></div>
                          <div><label className="block text-xs font-medium text-slate-500 mb-1">超时 (ms)</label>
                            <input type="number" className="w-full text-xs border border-slate-300 rounded px-2 py-1.5" value={cfg.timeoutMs ?? 5000} onChange={e => setCfg('timeoutMs', e.target.value === '' ? null : Number(e.target.value))} /></div>
                          <div><label className="block text-xs font-medium text-slate-500 mb-1">降级值 (超时或异常时返回)</label>
                            <input type="text" className="w-full text-xs border border-slate-300 rounded px-2 py-1.5" value={cfg.fallbackValue != null ? String(cfg.fallbackValue) : ''} onChange={e => setCfg('fallbackValue', e.target.value)} /></div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="retryOnError" className="rounded text-indigo-600 w-4 h-4" checked={!!cfg.retryOnError} onChange={e => setCfg('retryOnError', e.target.checked)} />
                          <label htmlFor="retryOnError" className="text-xs text-slate-600 cursor-pointer">异常时重试一次 (retryOnError，超时不重试)</label>
                        </div>
                      </>}
                    </div>
                  </div>
                </div>

                {/* 包含当前事件 */}
                <div className="flex items-center space-x-2 pt-2 bg-slate-50 p-3 rounded">
                  <input type="checkbox" id="includeEvent" className="rounded text-indigo-600 w-4 h-4" checked={!!data.includeCurrentEvent} onChange={e => onChange('includeCurrentEvent', e.target.checked)} />
                  <label htmlFor="includeEvent" className="text-sm text-slate-700 font-medium select-none cursor-pointer">计算结果包含当前触发事件的数据</label>
                </div>

                {changeNoteEl}
              </div>
            </div>
          )
        }}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* 批量操作条 */}
      <BulkActionToolbar selectedCount={selected.size} onAction={openBatchModal} onClear={() => setSelected(new Set())} />

      {/* 筛选栏（选中时隐藏）- legacy 布局还原 */}
      {selected.size === 0 && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <div className="flex flex-wrap gap-x-6 gap-y-4 items-end">
            <div>
              <label className="text-xs font-medium text-slate-500">接入点</label>
              <div className="mt-1 w-44">
                <MultiSelectFilter value={filter.eventPoints} onChange={v => setFilter({ ...filter, eventPoints: v })} options={allEpOpts} placeholder="全部接入点" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">特征类型</label>
              <select value={filter.type} onChange={e => setFilter({ ...filter, type: e.target.value })}
                className="mt-1 block w-32 border border-slate-300 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-[#1890ff]">
                <option value="ALL">全部类型</option>
                <option value="HistoryStorage">历史存储</option>
                <option value="DirectStorage">直接存储</option>
                <option value="Aggregation">聚合</option>
                <option value="StatefulStorage">状态存储</option>
                <option value="ExternalDataSource">外部数据源</option>
                <option value="OfflineStorage">离线存储</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">特征名</label>
              <div className="mt-1 relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="输入特征标识" value={filter.name}
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
            {window.__hasPerm?.('feature:edit') && (
              <button onClick={openNew} className="inline-flex items-center px-4 py-1.5 text-sm font-medium text-[#1890ff] bg-indigo-50 border border-[#1890ff] rounded hover:bg-indigo-100 shadow-sm transition-colors whitespace-nowrap">
                <Plus className="w-4 h-4 mr-1" />新建特征
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
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">特征信息</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">类型</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">接入点</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500">来源</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 w-[90px]">运行状态</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">更新时间/操作人</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 w-[140px]">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(ft => {
              const s = getRunStatus(ft)
              return (
                <tr key={ft.id} className={`hover:bg-[#f0f7ff] transition-colors group ${selected.has(ft.id) ? 'bg-indigo-50/30' : ''}`}>
                  <td className="px-3 py-3">
                    <input type="checkbox" className="w-4 h-4 text-indigo-600 border-slate-300 rounded"
                      checked={selected.has(ft.id)} onChange={() => toggleRow(ft.id)} />
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-sm font-mono text-[#1890ff] cursor-pointer hover:underline" onClick={() => openView(ft)}>{ft.name}</div>
                    <div className="text-xs text-[rgba(0,0,0,0.45)] mt-0.5">{ft.description}</div>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${TYPE_COLORS[ft.type] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>{ft.type}</span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(ft.eventPoints || []).map(ep => (
                        <span key={ep} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-slate-100 text-slate-600 font-mono whitespace-nowrap">{ep}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs ${ft.writeSource === 'REALTIME' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1 ${ft.writeSource === 'REALTIME' ? 'bg-green-500' : 'bg-orange-500'}`} />
                      {ft.writeSource === 'REALTIME' ? '实时' : '离线'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${s.cls}`}>{s.label}</span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-xs text-[rgba(0,0,0,0.65)]">{ft.updateAt}</div>
                    <div className="text-xs text-[rgba(0,0,0,0.45)]">by {ft.operator}</div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-center text-sm font-medium">
                    <div className="flex justify-center gap-2">
                      <button className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors" onClick={() => openView(ft)} title="查看详情">
                        <Eye className="w-4 h-4 mr-1" />查看
                      </button>
                      {window.__hasPerm?.('feature:edit') && (
                        <button className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors" onClick={() => openEdit(ft)} title="编辑特征">
                          <SquarePen className="w-4 h-4 mr-1" />编辑
                        </button>
                      )}
                      <button className="flex items-center text-slate-400 hover:text-red-600 transition-colors" onClick={() => handleDelete(ft.id)} title="删除特征">
                        <Trash2 className="w-4 h-4 mr-1" />删除
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-3 py-8 text-center text-sm text-[rgba(0,0,0,0.25)]">暂无数据</td></tr>
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
