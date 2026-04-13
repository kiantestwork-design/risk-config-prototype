// PolicyManager 页面 - 还原自 app.js IN 组件（offset 569865，~54K）
// type prop: 'CIRCUIT_BREAKER' | 'GUARDRAIL'
import { useState, useMemo } from 'react'
import { Search, X, TriangleAlert } from 'lucide-react'
import { AntdConfirmModal } from '../components/EntityEditorShell'

const STATUS_CFG = {
  PUBLISHED: { label: '已发布', cls: 'bg-[#f6ffed] text-[#52c41a] border border-[#b7eb8f]' },
  PENDING_APPROVAL: { label: '待审批', cls: 'bg-[#fff7e6] text-[#fa8c16] border border-[#ffd591]' },
  DRAFT: { label: '草稿', cls: 'bg-[#f5f5f5] text-[rgba(0,0,0,0.45)] border border-[#d9d9d9]' },
  ARCHIVED: { label: '已归档', cls: 'bg-[#f5f5f5] text-[rgba(0,0,0,0.45)] border border-[#d9d9d9]' },
}

function formatScope(scope) {
  if (!scope) return '-'
  if (scope.level === 'FEATURE_SERVICE') return `特征服务: ${scope.targetKey}`
  if (scope.level === 'EVENT_POINT') return `接入点: ${scope.eventPoint}`
  if (scope.level === 'ACTIVATION') return `策略: ${scope.activationName}`
  return scope.level || '-'
}

function PolicyDetailModal({ policy, onClose, onDelete, type }) {
  if (!policy) return null
  const st = STATUS_CFG[policy.status] || { label: policy.status, cls: 'bg-slate-100 text-slate-600 border-slate-200' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={onClose}>
      <div className="animate-in fade-in zoom-in-95 duration-200 bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(5,5,5,0.06)]">
          <h3 className="text-base font-semibold text-[rgba(0,0,0,0.88)]">{type === 'CIRCUIT_BREAKER' ? '熔断策略' : '业务护栏'}详情</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 transition-colors"><X className="w-4 h-4 text-slate-500" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><div className="text-xs text-[rgba(0,0,0,0.45)] mb-1">策略ID</div><div className="text-sm font-mono">{policy.policyId}</div></div>
            <div><div className="text-xs text-[rgba(0,0,0,0.45)] mb-1">策略名</div><div className="text-sm font-mono">{policy.name}</div></div>
            <div><div className="text-xs text-[rgba(0,0,0,0.45)] mb-1">状态</div><span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${st.cls}`}>{st.label}</span></div>
            <div><div className="text-xs text-[rgba(0,0,0,0.45)] mb-1">生效范围</div><div className="text-sm">{formatScope(policy.scope)}</div></div>
            <div><div className="text-xs text-[rgba(0,0,0,0.45)] mb-1">备注</div><div className="text-sm col-span-2">{policy.remark || '-'}</div></div>
            <div><div className="text-xs text-[rgba(0,0,0,0.45)] mb-1">通知渠道</div><div className="text-sm">{(policy.notifyChannels || []).join(', ') || '-'}</div></div>
          </div>
          {type === 'CIRCUIT_BREAKER' && (
            <div className="border border-slate-100 rounded-lg p-4">
              <div className="text-sm font-semibold text-slate-700 mb-3">熔断配置</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-xs text-[rgba(0,0,0,0.45)]">失败率阈值:</span> {policy.thresholds?.failureRate}%</div>
                <div><span className="text-xs text-[rgba(0,0,0,0.45)]">慢调用率阈值:</span> {policy.thresholds?.slowCallRate}%</div>
                <div><span className="text-xs text-[rgba(0,0,0,0.45)]">慢调用时长:</span> {policy.slowCallDurationMs}ms</div>
                <div><span className="text-xs text-[rgba(0,0,0,0.45)]">最小调用数:</span> {policy.minimumNumberOfCalls}</div>
                <div><span className="text-xs text-[rgba(0,0,0,0.45)]">滑动窗口:</span> {policy.slidingWindowSize}s</div>
                <div><span className="text-xs text-[rgba(0,0,0,0.45)]">等待时长:</span> {policy.waitDurationInOpenState}s</div>
                <div><span className="text-xs text-[rgba(0,0,0,0.45)]">自动恢复:</span> {policy.autoRecover ? '是' : '否'}</div>
                <div><span className="text-xs text-[rgba(0,0,0,0.45)]">降级动作:</span> {policy.degradeAction || '-'}</div>
              </div>
            </div>
          )}
          {type === 'GUARDRAIL' && (
            <div className="border border-slate-100 rounded-lg p-4">
              <div className="text-sm font-semibold text-slate-700 mb-3">护栏配置</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-xs text-[rgba(0,0,0,0.45)]">指标类型:</span> {policy.metricType || '-'}</div>
                <div><span className="text-xs text-[rgba(0,0,0,0.45)]">观测维度:</span> {policy.dimension || '-'}</div>
                <div><span className="text-xs text-[rgba(0,0,0,0.45)]">时间窗口:</span> {policy.windowSeconds}s</div>
                <div><span className="text-xs text-[rgba(0,0,0,0.45)]">阈值:</span> {policy.threshold}</div>
                <div><span className="text-xs text-[rgba(0,0,0,0.45)]">最小样本:</span> {policy.minSamples}</div>
                <div><span className="text-xs text-[rgba(0,0,0,0.45)]">冷却时间:</span> {policy.coolDownSeconds}s</div>
                <div className="col-span-2"><span className="text-xs text-[rgba(0,0,0,0.45)]">触发动作:</span> {(policy.actions || []).join(', ') || '-'}</div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div><div className="text-xs text-[rgba(0,0,0,0.45)] mb-1">最后更新</div><div className="text-sm">{policy.updatedAt || '-'}</div></div>
            <div><div className="text-xs text-[rgba(0,0,0,0.45)] mb-1">操作人</div><div className="text-sm">{policy.operator || '-'}</div></div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[rgba(5,5,5,0.06)] flex justify-between">
          {window.__hasPerm?.('policy:edit') && (
            <button onClick={() => onDelete(policy.policyId)} className="h-8 px-4 text-sm font-medium text-[#ff4d4f] border border-[#ff4d4f] rounded bg-white hover:bg-red-50 transition-colors">删除</button>
          )}
          <button onClick={onClose} className="h-8 px-4 text-sm font-medium text-[rgba(0,0,0,0.88)] border border-[#d9d9d9] rounded bg-white hover:border-[#1890ff] hover:text-[#1890ff] transition-colors ml-auto">关闭</button>
        </div>
      </div>
    </div>
  )
}

export default function PolicyManager({ type, policies, onSavePolicies, onDeletePolicy }) {
  const [search, setSearch] = useState('')
  const [selectedPolicy, setSelectedPolicy] = useState(null)
  const [deleteConfirmPolicy, setDeleteConfirmPolicy] = useState(null)

  const filtered = useMemo(() => policies.filter(p => {
    if (p.type !== type) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.policyId.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [policies, type, search])

  const typeLabel = type === 'CIRCUIT_BREAKER' ? '熔断策略' : '业务护栏'

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input type="text" placeholder={`搜索${typeLabel}名称、ID...`} value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64" />
        </div>
        <div className="flex-1" />
        {window.__hasPerm?.('policy:edit') && (
          <button
            onClick={() => {
              const newId = type === 'CIRCUIT_BREAKER' ? `CB-${Date.now()}` : `GR-${Date.now()}`
              const newPolicy = { policyId: newId, name: '', type, status: 'DRAFT', scope: { level: 'FEATURE_SERVICE', targetKey: '' }, notifyChannels: [], remark: '', updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19), operator: 'admin' }
              onSavePolicies(newPolicy)
              alert(`已创建草稿策略 ${newId}，请在详情中完善配置。`)
            }}
            className="px-4 py-2 bg-[#1890ff] text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors shadow-sm">新建{typeLabel}</button>
        )}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full" style={{ tableLayout: 'auto' }}>
          <thead className="bg-[#fafafa]">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">策略信息</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">生效范围</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 w-[90px]">状态</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">最后更新</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 w-[100px]">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(p => {
              const st = STATUS_CFG[p.status] || { label: p.status, cls: 'bg-slate-100 text-slate-600 border-slate-200' }
              return (
                <tr key={p.policyId} className="hover:bg-[#fafafa] transition-colors">
                  <td className="px-3 py-3">
                    <div className="text-sm font-mono text-[#1890ff] cursor-pointer hover:underline" onClick={() => setSelectedPolicy(p)}>{p.name || p.policyId}</div>
                    <div className="text-xs text-[rgba(0,0,0,0.45)] mt-0.5 font-mono">{p.policyId}</div>
                  </td>
                  <td className="px-3 py-3 text-sm text-[rgba(0,0,0,0.65)]">{formatScope(p.scope)}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${st.cls}`}>{st.label}</span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-xs text-[rgba(0,0,0,0.65)]">{p.updatedAt}</div>
                    <div className="text-xs text-[rgba(0,0,0,0.45)]">by {p.operator}</div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="inline-flex items-center gap-2">
                      <button className="text-xs text-[#1890ff] hover:text-[#40a9ff] transition-colors" onClick={() => setSelectedPolicy(p)}>查看</button>
                      {window.__hasPerm?.('policy:edit') && (
                        <button className="text-xs text-[#ff4d4f] hover:text-[#ff7875] transition-colors" onClick={() => setDeleteConfirmPolicy(p)}>删除</button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-sm text-[rgba(0,0,0,0.25)]">暂无数据</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <PolicyDetailModal
        policy={selectedPolicy}
        type={type}
        onClose={() => setSelectedPolicy(null)}
        onDelete={(id) => { setSelectedPolicy(null); setDeleteConfirmPolicy(policies.find(p => p.policyId === id)) }}
      />

      <AntdConfirmModal
        visible={!!deleteConfirmPolicy}
        title="确认删除"
        content={`确定要删除策略【${deleteConfirmPolicy?.name || deleteConfirmPolicy?.policyId}】吗？该操作不可恢复。`}
        okType="danger"
        okText="删除"
        onOk={() => { onDeletePolicy(deleteConfirmPolicy.policyId); setDeleteConfirmPolicy(null) }}
        onCancel={() => setDeleteConfirmPolicy(null)}
      />
    </div>
  )
}
