// ReleaseCandidates 页面 - 还原自 app.js Pz 组件（offset 980808，~16K）
import { useState, useMemo } from 'react'
import { Search, X } from 'lucide-react'

const TYPE_LABELS = {
  FEATURE: '特征',
  POLICY: '策略',
  ACTIVATION: '激活策略',
  RULE: '规则',
  ENTRY_POINT: '接入点',
}
const TYPE_COLORS = {
  FEATURE: 'bg-blue-50 text-blue-700 border-blue-200',
  POLICY: 'bg-purple-50 text-purple-700 border-purple-200',
  ACTIVATION: 'bg-orange-50 text-orange-700 border-orange-200',
  RULE: 'bg-green-50 text-green-700 border-green-200',
  ENTRY_POINT: 'bg-cyan-50 text-cyan-700 border-cyan-200',
}

function CreateOrderModal({ selectedDrafts, onConfirm, onCancel }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={onCancel}>
      <div className="animate-in fade-in zoom-in-95 duration-200 bg-white rounded-lg shadow-2xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(5,5,5,0.06)]">
          <h3 className="text-base font-semibold text-[rgba(0,0,0,0.88)]">生成发布单</h3>
          <button onClick={onCancel} className="p-1 rounded hover:bg-slate-100"><X className="w-4 h-4 text-slate-500" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">发布单标题 *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="如：用户特征优化 v2 上线" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">变更说明</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="简要描述本次发布包含的变更..." />
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-xs text-[rgba(0,0,0,0.45)] mb-2">已选发布项（{selectedDrafts.length}）</div>
            <div className="space-y-1">
              {selectedDrafts.map(d => (
                <div key={d.id} className="flex items-center gap-2 text-xs">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded border whitespace-nowrap ${TYPE_COLORS[d.type] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>{TYPE_LABELS[d.type] || d.type}</span>
                  <span className="font-mono text-[rgba(0,0,0,0.65)]">{d.targetName}</span>
                  <span className="text-[rgba(0,0,0,0.45)]">{d.version}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[rgba(5,5,5,0.06)] flex justify-end gap-3">
          <button onClick={onCancel} className="h-8 px-4 text-sm font-medium text-[rgba(0,0,0,0.88)] border border-[#d9d9d9] rounded bg-white hover:border-[#1890ff] hover:text-[#1890ff] transition-colors">取消</button>
          <button onClick={() => { if (!title.trim()) { alert('请填写发布单标题'); return } onConfirm({ title, description }) }} className="h-8 px-4 text-sm font-medium text-white bg-[#1890ff] border-none rounded hover:bg-[#40a9ff] transition-colors">确认生成</button>
        </div>
      </div>
    </div>
  )
}

export default function ReleaseCandidates({ drafts, onCreateOrder }) {
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState({ name: '', type: 'ALL' })
  const [applied, setApplied] = useState({ name: '', type: 'ALL' })

  const filtered = useMemo(() => drafts.filter(d => {
    if (applied.name && !d.targetName.toLowerCase().includes(applied.name.toLowerCase()) && !d.targetId.toString().includes(applied.name)) return false
    if (applied.type !== 'ALL' && d.type !== applied.type) return false
    return true
  }), [drafts, applied])

  const allSelected = filtered.length > 0 && filtered.every(d => selectedIds.has(d.id))
  const someSelected = filtered.some(d => selectedIds.has(d.id))

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(prev => { const next = new Set(prev); filtered.forEach(d => next.delete(d.id)); return next })
    } else {
      setSelectedIds(prev => { const next = new Set(prev); filtered.forEach(d => next.add(d.id)); return next })
    }
  }

  const toggle = (id) => {
    setSelectedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }

  const selectedDrafts = drafts.filter(d => selectedIds.has(d.id))

  const handleCreateOrder = ({ title, description }) => {
    const newOrder = {
      id: `REL-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Date.now()).slice(-3)}`,
      title,
      description,
      items: selectedDrafts.map(d => ({ type: d.type, targetId: d.targetId, targetName: d.targetName, relatedKeys: d.relatedKeys, changeSummary: d.changeSummary })),
      status: 'PENDING',
      applicant: 'admin',
      applyTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
    }
    onCreateOrder(newOrder)
    setSelectedIds(new Set())
    setShowModal(false)
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 flex flex-wrap items-center gap-3">
        <input type="text" placeholder="搜索目标名称或ID" value={filter.name}
          onChange={e => setFilter({ ...filter, name: e.target.value })}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-52" />
        <select value={filter.type} onChange={e => setFilter({ ...filter, type: e.target.value })}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
          <option value="ALL">全部类型</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button onClick={() => setApplied({ ...filter })} className="px-4 py-2 bg-[#1890ff] text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-1">
          <Search className="w-4 h-4" />查询
        </button>
        <div className="flex-1" />
        <span className="text-sm text-[rgba(0,0,0,0.45)]">已选 {selectedIds.size} 项</span>
        <button
          onClick={() => { if (selectedIds.size === 0) { alert('请先选择要发布的内容'); return } setShowModal(true) }}
          disabled={selectedIds.size === 0}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors shadow-sm ${selectedIds.size > 0 ? 'bg-[#1890ff] text-white hover:bg-blue-600' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
        >生成发布单</button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full" style={{ tableLayout: 'auto' }}>
          <thead className="bg-[#fafafa]">
            <tr>
              <th className="px-3 py-3 w-[48px]">
                <input type="checkbox" checked={allSelected} ref={el => { if (el) el.indeterminate = someSelected && !allSelected }} onChange={toggleAll}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">类型</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">版本</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">目标名称/ID</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">关联接入点/键</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">变更摘要</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">更新时间/操作人</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(d => (
              <tr key={d.id} className={`hover:bg-[#fafafa] transition-colors ${selectedIds.has(d.id) ? 'bg-blue-50' : ''}`}>
                <td className="px-3 py-3 text-center">
                  <input type="checkbox" checked={selectedIds.has(d.id)} onChange={() => toggle(d.id)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                </td>
                <td className="px-3 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border whitespace-nowrap ${TYPE_COLORS[d.type] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>{TYPE_LABELS[d.type] || d.type}</span>
                </td>
                <td className="px-3 py-3">
                  <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{d.version}</span>
                </td>
                <td className="px-3 py-3">
                  <div className="text-sm font-medium text-[rgba(0,0,0,0.88)]">{d.targetName}</div>
                  <div className="text-xs font-mono text-[rgba(0,0,0,0.45)]">{d.targetId}</div>
                </td>
                <td className="px-3 py-3 text-xs font-mono text-[rgba(0,0,0,0.65)]">{d.relatedKeys || '-'}</td>
                <td className="px-3 py-3 text-sm text-[rgba(0,0,0,0.65)] max-w-xs">
                  <div className="truncate" title={d.changeSummary}>{d.changeSummary}</div>
                </td>
                <td className="px-3 py-3">
                  <div className="text-xs text-[rgba(0,0,0,0.65)]">{d.updatedAt}</div>
                  <div className="text-xs text-[rgba(0,0,0,0.45)]">by {d.editor}</div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-sm text-[rgba(0,0,0,0.25)]">暂无待发布内容</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <CreateOrderModal
          selectedDrafts={selectedDrafts}
          onConfirm={handleCreateOrder}
          onCancel={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
