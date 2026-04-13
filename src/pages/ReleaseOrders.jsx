// ReleaseOrders 页面 - 还原自 app.js Rz 组件（offset 996694，~209K）
import { useState, useMemo } from 'react'
import { Search, X, CircleCheck, CircleAlert } from 'lucide-react'
import { AntdConfirmModal } from '../components/EntityEditorShell'

const STATUS_CFG = {
  PENDING: { label: '待审核', cls: 'bg-[#fff7e6] text-[#fa8c16] border border-[#ffd591]' },
  APPROVED: { label: '已审核 (待发布)', cls: 'bg-[#e6f7ff] text-[#1890ff] border border-[#91d5ff]' },
  PUBLISHED: { label: '线上', cls: 'bg-[#f6ffed] text-[#52c41a] border border-[#b7eb8f]' },
  REJECTED: { label: '已驳回', cls: 'bg-[#fff2f0] text-[#ff4d4f] border border-[#ffccc7]' },
}
const TYPE_LABELS = { FEATURE: '特征', POLICY: '策略', ACTIVATION: '激活策略', RULE: '规则', ENTRY_POINT: '接入点' }
const TYPE_COLORS = {
  FEATURE: 'bg-blue-50 text-blue-700 border-blue-200',
  POLICY: 'bg-purple-50 text-purple-700 border-purple-200',
  ACTIVATION: 'bg-orange-50 text-orange-700 border-orange-200',
  RULE: 'bg-green-50 text-green-700 border-green-200',
  ENTRY_POINT: 'bg-cyan-50 text-cyan-700 border-cyan-200',
}

function OrderDetailPanel({ order, onClose, onApprove, onReject, onPublish }) {
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [auditConfirm, setAuditConfirm] = useState(null) // { type: 'approve'|'publish' }
  if (!order) return null
  const st = STATUS_CFG[order.status] || { label: order.status, cls: 'bg-slate-100 text-slate-600 border-slate-200' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={onClose}>
      <div className="animate-in fade-in zoom-in-95 duration-200 bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(5,5,5,0.06)]">
          <div>
            <h3 className="text-base font-semibold text-[rgba(0,0,0,0.88)]">{order.title}</h3>
            <div className="text-xs font-mono text-[rgba(0,0,0,0.45)] mt-0.5">{order.id}</div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100"><X className="w-4 h-4 text-slate-500" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* 基本信息 */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div><div className="text-xs text-[rgba(0,0,0,0.45)] mb-1">状态</div><span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${st.cls}`}>{st.label}</span></div>
            <div><div className="text-xs text-[rgba(0,0,0,0.45)] mb-1">申请人</div>{order.applicant || '-'}</div>
            <div><div className="text-xs text-[rgba(0,0,0,0.45)] mb-1">申请时间</div>{order.applyTime || '-'}</div>
            {order.approver && <div><div className="text-xs text-[rgba(0,0,0,0.45)] mb-1">审批人</div>{order.approver}</div>}
            {order.finishTime && <div><div className="text-xs text-[rgba(0,0,0,0.45)] mb-1">完成时间</div>{order.finishTime}</div>}
          </div>
          {order.description && (
            <div className="bg-slate-50 rounded-lg p-3 text-sm text-[rgba(0,0,0,0.65)]">{order.description}</div>
          )}
          {/* 发布内容 */}
          <div>
            <div className="text-sm font-semibold text-slate-700 mb-2">发布内容（{order.items?.length || 0}项）</div>
            <div className="space-y-2">
              {(order.items || []).map((item, i) => (
                <div key={i} className="border border-slate-100 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs border whitespace-nowrap ${TYPE_COLORS[item.type] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>{TYPE_LABELS[item.type] || item.type}</span>
                    <span className="text-sm font-medium text-[rgba(0,0,0,0.88)]">{item.targetName}</span>
                    {item.relatedKeys && <span className="text-xs font-mono text-[rgba(0,0,0,0.45)]">{item.relatedKeys}</span>}
                  </div>
                  {item.changeSummary && <div className="text-xs text-[rgba(0,0,0,0.65)] ml-1">{item.changeSummary}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* 审批/发布面板 */}
          {order.status === 'PENDING' && window.__hasPerm?.('release:approve') && (
            <div className="border border-[#ffe58f] bg-[#fffbe6] rounded-lg p-4">
              <div className="text-sm font-semibold text-[rgba(0,0,0,0.88)] mb-3">审批操作</div>
              {showRejectInput ? (
                <div className="space-y-3">
                  <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={2} placeholder="请填写驳回原因..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                  <div className="flex gap-2">
                    <button onClick={() => setShowRejectInput(false)} className="h-8 px-4 text-sm font-medium text-[rgba(0,0,0,0.88)] border border-[#d9d9d9] rounded bg-white hover:border-[#1890ff] hover:text-[#1890ff] transition-colors">取消</button>
                    <button onClick={() => onReject(order, rejectReason)} className="h-8 px-4 text-sm font-medium text-white bg-[#ff4d4f] border-none rounded hover:bg-[#ff7875] transition-colors">确认驳回</button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setAuditConfirm({ type: 'approve' })} className="h-8 px-4 text-sm font-medium text-white bg-[#1890ff] border-none rounded hover:bg-[#40a9ff] transition-colors">审批通过</button>
                  <button onClick={() => setShowRejectInput(true)} className="h-8 px-4 text-sm font-medium text-[#ff4d4f] border border-[#ff4d4f] rounded bg-white hover:bg-red-50 transition-colors">驳回</button>
                </div>
              )}
            </div>
          )}
          {order.status === 'APPROVED' && window.__hasPerm?.('release:approve') && (
            <div className="border border-[#b7eb8f] bg-[#f6ffed] rounded-lg p-4">
              <div className="text-sm font-semibold text-[rgba(0,0,0,0.88)] mb-3">发布操作</div>
              <button onClick={() => setAuditConfirm({ type: 'publish' })} className="h-8 px-4 text-sm font-medium text-white bg-[#52c41a] border-none rounded hover:bg-[#73d13d] transition-colors">执行发布</button>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-[rgba(5,5,5,0.06)] flex justify-end">
          <button onClick={onClose} className="h-8 px-4 text-sm font-medium text-[rgba(0,0,0,0.88)] border border-[#d9d9d9] rounded bg-white hover:border-[#1890ff] hover:text-[#1890ff] transition-colors">关闭</button>
        </div>
      </div>

      <AntdConfirmModal
        visible={!!auditConfirm}
        title={auditConfirm?.type === 'approve' ? '确认审批通过' : '确认执行发布'}
        content={auditConfirm?.type === 'approve' ? `确定审批通过发布单【${order.id}】吗？` : `确定将发布单【${order.id}】的内容发布到生产环境吗？`}
        onOk={() => { auditConfirm?.type === 'approve' ? onApprove(order) : onPublish(order); setAuditConfirm(null) }}
        onCancel={() => setAuditConfirm(null)}
      />
    </div>
  )
}

export default function ReleaseOrders({ orders, onUpdateOrder }) {
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [filter, setFilter] = useState({ orderId: '', keyword: '', status: 'ALL' })
  const [applied, setApplied] = useState({ orderId: '', keyword: '', status: 'ALL' })
  const [toast, setToast] = useState(null)

  const filtered = useMemo(() => orders.filter(o => {
    if (applied.orderId && !o.id.toLowerCase().includes(applied.orderId.toLowerCase())) return false
    if (applied.keyword && !o.title.toLowerCase().includes(applied.keyword.toLowerCase())) return false
    if (applied.status !== 'ALL' && o.status !== applied.status) return false
    return true
  }), [orders, applied])

  const showToast = (type, title) => {
    setToast({ type, title })
    setTimeout(() => setToast(null), 3000)
  }

  const handleApprove = (order) => {
    onUpdateOrder({ ...order, status: 'APPROVED', approver: 'admin', approveTime: new Date().toISOString().replace('T', ' ').slice(0, 19) })
    setSelectedOrder(null)
    showToast('success', `发布单 ${order.id} 已审批通过`)
  }

  const handleReject = (order, reason) => {
    onUpdateOrder({ ...order, status: 'REJECTED', approver: 'admin', rejectReason: reason, finishTime: new Date().toISOString().replace('T', ' ').slice(0, 19) })
    setSelectedOrder(null)
    showToast('info', `发布单 ${order.id} 已驳回`)
  }

  const handlePublish = (order) => {
    onUpdateOrder({ ...order, status: 'PUBLISHED', finishTime: new Date().toISOString().replace('T', ' ').slice(0, 19) })
    setSelectedOrder(null)
    showToast('success', `发布单 ${order.id} 已成功发布`)
  }

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border animate-in fade-in slide-in-from-top-2 duration-200 ${toast.type === 'success' ? 'bg-white border-[#b7eb8f]' : 'bg-white border-[#91d5ff]'}`}>
          {toast.type === 'success' ? <CircleCheck className="w-4 h-4 text-[#52c41a]" /> : <CircleAlert className="w-4 h-4 text-[#1890ff]" />}
          <span className="text-sm text-[rgba(0,0,0,0.88)]">{toast.title}</span>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 flex flex-wrap items-center gap-3">
        <input type="text" placeholder="发布单号" value={filter.orderId}
          onChange={e => setFilter({ ...filter, orderId: e.target.value })}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-40" />
        <input type="text" placeholder="搜索标题" value={filter.keyword}
          onChange={e => setFilter({ ...filter, keyword: e.target.value })}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48" />
        <select value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
          <option value="ALL">全部状态</option>
          {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <button onClick={() => setApplied({ ...filter })} className="px-4 py-2 bg-[#1890ff] text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-1">
          <Search className="w-4 h-4" />查询
        </button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full" style={{ tableLayout: 'auto' }}>
          <thead className="bg-[#fafafa]">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">发布单号</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">标题/描述</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">发布内容</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 w-[120px]">状态</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">更新时间/操作人</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 w-[100px]">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(o => {
              const st = STATUS_CFG[o.status] || { label: o.status, cls: 'bg-slate-100 text-slate-600 border-slate-200' }
              return (
                <tr key={o.id} className="hover:bg-[#fafafa] transition-colors">
                  <td className="px-3 py-3">
                    <div className="text-sm font-mono text-[#1890ff] cursor-pointer hover:underline" onClick={() => setSelectedOrder(o)}>{o.id}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-sm font-medium text-[rgba(0,0,0,0.88)]">{o.title}</div>
                    {o.description && <div className="text-xs text-[rgba(0,0,0,0.45)] mt-0.5 truncate max-w-[240px]" title={o.description}>{o.description}</div>}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(o.items || []).map((item, i) => (
                        <span key={i} className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs border whitespace-nowrap ${TYPE_COLORS[item.type] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>{item.targetName}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${st.cls}`}>{st.label}</span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-xs text-[rgba(0,0,0,0.65)]">{o.finishTime || o.applyTime}</div>
                    <div className="text-xs text-[rgba(0,0,0,0.45)]">by {o.approver || o.applicant}</div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <button className="text-xs text-[#1890ff] hover:text-[#40a9ff] transition-colors" onClick={() => setSelectedOrder(o)}>查看详情</button>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-sm text-[rgba(0,0,0,0.25)]">暂无数据</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <OrderDetailPanel
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        onPublish={handlePublish}
      />
    </div>
  )
}
