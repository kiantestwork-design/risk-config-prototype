// 规则选择弹框 - 策略编辑页关联规则
import { useState, useMemo, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'

const PAGE_SIZE = 5

export default function RulePickerModal({ visible, rules = [], existingRuleIds = [], onConfirm, onClose }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [page, setPage] = useState(1)
  const overlayRef = useRef(null)

  useEffect(() => {
    if (visible) { setSelected(new Set()); setSearch(''); setPage(1) }
  }, [visible])

  const available = useMemo(() => rules.filter(r => !existingRuleIds.includes(r.id)), [rules, existingRuleIds])
  const filtered = useMemo(() => available.filter(r =>
    !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase())
  ), [available, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const allPageSelected = paged.length > 0 && paged.every(r => selected.has(r.id))
  const somePageSelected = paged.some(r => selected.has(r.id))

  const toggleAll = () => {
    const next = new Set(selected)
    if (allPageSelected) { paged.forEach(r => next.delete(r.id)) }
    else { paged.forEach(r => next.add(r.id)) }
    setSelected(next)
  }

  const toggleRow = (id) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={e => { if (e.target === overlayRef.current) onClose() }}>
      <div ref={overlayRef} className="absolute inset-0 bg-[rgba(0,0,0,0.45)]" />
      <div className="relative bg-white rounded-lg shadow-[0_6px_16px_rgba(0,0,0,0.08),0_3px_6px_-4px_rgba(0,0,0,0.12),0_9px_28px_8px_rgba(0,0,0,0.05)] w-full max-w-[640px] max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(5,5,5,0.06)]">
          <h3 className="text-base font-semibold text-[rgba(0,0,0,0.88)]">选择规则</h3>
          <button onClick={onClose} className="text-[rgba(0,0,0,0.45)] hover:text-[rgba(0,0,0,0.88)] transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {/* Search */}
        <div className="px-6 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="搜索规则名称或描述"
              className="w-full pl-9 pr-3 h-8 border border-[#d9d9d9] rounded-md text-sm focus:border-[#1890ff] focus:shadow-[0_0_0_2px_rgba(24,144,255,0.2)] outline-none" />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto px-6">
          <table className="w-full" style={{ tableLayout: 'auto' }}>
            <thead className="bg-[#fafafa] sticky top-0">
              <tr>
                <th className="px-3 py-2.5 w-10">
                  <input type="checkbox" className="w-4 h-4 text-indigo-600 border-slate-300 rounded"
                    checked={allPageSelected} ref={el => { if (el) el.indeterminate = somePageSelected && !allPageSelected }}
                    onChange={(e) => { e.stopPropagation(); toggleAll() }} />
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-[rgba(0,0,0,0.65)]">规则信息</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-[rgba(0,0,0,0.65)] w-[90px]">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f0]">
              {paged.map(r => (
                <tr key={r.id} className={`hover:bg-[#fafafa] transition-colors cursor-pointer ${selected.has(r.id) ? 'bg-blue-50/30' : ''}`} onClick={() => toggleRow(r.id)}>
                  <td className="px-3 py-2.5">
                    <input type="checkbox" className="w-4 h-4 text-indigo-600 border-slate-300 rounded"
                      checked={selected.has(r.id)} onChange={(e) => { e.stopPropagation(); toggleRow(r.id) }} />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="text-sm font-mono text-[#1890ff]">{r.name}</div>
                    <div className="text-xs text-[rgba(0,0,0,0.45)]">{r.description}</div>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs border ${r.status === 1 ? 'bg-[#f6ffed] text-[#52c41a] border-[#b7eb8f]' : 'bg-[#f5f5f5] text-[rgba(0,0,0,0.45)] border-[#d9d9d9]'}`}>
                      {r.status === 1 ? '启用' : '禁用'}
                    </span>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr><td colSpan={3} className="px-3 py-8 text-center text-sm text-[rgba(0,0,0,0.25)]">{available.length === 0 ? '没有可添加的规则' : '无匹配结果'}</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 py-2 px-6 border-t border-[#f0f0f0]">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-2 py-1 text-xs border border-[#d9d9d9] rounded disabled:opacity-40 hover:border-[#1890ff] hover:text-[#1890ff] transition-colors">上一页</button>
            <span className="text-xs text-[rgba(0,0,0,0.45)] leading-7">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-2 py-1 text-xs border border-[#d9d9d9] rounded disabled:opacity-40 hover:border-[#1890ff] hover:text-[#1890ff] transition-colors">下一页</button>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[rgba(5,5,5,0.06)]">
          <span className="text-xs text-[rgba(0,0,0,0.45)]">共 {available.length} 条可选 · 已选 {selected.size} 条</span>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="h-8 px-4 text-sm border border-[#d9d9d9] rounded-md text-[rgba(0,0,0,0.88)] hover:text-[#1890ff] hover:border-[#1890ff] transition-colors">取消</button>
            <button onClick={() => onConfirm([...selected])} disabled={selected.size === 0}
              className="h-8 px-4 text-sm bg-[#1890ff] text-white rounded-md hover:bg-[#40a9ff] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              确认添加 ({selected.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
