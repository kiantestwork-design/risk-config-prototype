// Overrides 页面 - 还原自 app.js uz 组件（offset 623561，~53K）
import { useState } from 'react'
import { TriangleAlert, Trash2, Clock } from 'lucide-react'
import { AntdConfirmModal } from '../components/EntityEditorShell'

const MANUAL_STATE_CFG = {
  MANUAL_OPEN: { label: '强制熔断', cls: 'bg-[#fff2f0] text-[#ff4d4f] border border-[#ffccc7]', barCls: 'bg-[#ff4d4f]' },
  MANUAL_PASS: { label: '强制放行', cls: 'bg-[#f6ffed] text-[#52c41a] border border-[#b7eb8f]', barCls: 'bg-[#52c41a]' },
}

function formatScope(scope) {
  if (!scope) return '全局'
  if (scope.level === 'ACTIVATION') return `策略: ${scope.activationName}`
  if (scope.level === 'FEATURE_SERVICE') return `特征服务: ${scope.targetKey}`
  if (scope.level === 'EVENT_POINT') return `接入点: ${scope.eventPoint}`
  return scope.level || '全局'
}

function formatTTL(seconds) {
  if (!seconds || seconds <= 0) return '永久有效'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m > 0) return `${m}分${s > 0 ? s + '秒' : ''}后过期`
  return `${s}秒后过期`
}

export default function Overrides({ overrides, onDeleteOverride, onAddOverride }) {
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [newFormVisible, setNewFormVisible] = useState(false)
  const [newForm, setNewForm] = useState({ scope: { level: 'ACTIVATION', activationName: '' }, manualState: 'MANUAL_OPEN', ttlSeconds: 600, remark: '' })

  const handleAddOverride = () => {
    const newOv = {
      id: `OVR-${Date.now()}`,
      scope: { ...newForm.scope },
      manualState: newForm.manualState,
      ttlSeconds: newForm.ttlSeconds,
      remark: newForm.remark,
      operator: '当前用户',
    }
    if (onAddOverride) onAddOverride(newOv)
    setNewFormVisible(false)
    setNewForm({ scope: { level: 'ACTIVATION', activationName: '' }, manualState: 'MANUAL_OPEN', ttlSeconds: 600, remark: '' })
  }

  return (
    <div className="space-y-6">
      {/* War Room 警告横幅 */}
      <div className="bg-[#fff7e6] border border-[#ffe58f] rounded-lg px-6 py-4 flex items-center gap-4">
        <TriangleAlert className="w-5 h-5 text-[#faad14] flex-shrink-0" />
        <div className="flex-1">
          <div className="font-semibold text-[rgba(0,0,0,0.88)] text-sm">手动干预管理（War Room）</div>
          <div className="text-xs text-[rgba(0,0,0,0.65)] mt-1">
            此页面用于紧急人工干预，强制覆盖策略运行状态。操作将立即生效，请谨慎使用。
          </div>
        </div>
        <button
          onClick={() => setNewFormVisible(true)}
          className="flex-shrink-0 h-8 px-4 text-sm font-medium rounded bg-[#faad14] text-white border-none hover:bg-[#d48806] transition-colors"
        >
          + 新增干预
        </button>
      </div>

      {/* 新增表单 */}
      {newFormVisible && (
        <div className="bg-white rounded-lg border border-[#ffe58f] shadow-sm p-6 space-y-4">
          <h3 className="text-base font-semibold text-[rgba(0,0,0,0.88)]">新增手动干预配置</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">干预层级</label>
              <select value={newForm.scope.level} onChange={e => setNewForm({ ...newForm, scope: { ...newForm.scope, level: e.target.value } })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="ACTIVATION">策略级别</option>
                <option value="FEATURE_SERVICE">特征服务级别</option>
                <option value="EVENT_POINT">接入点级别</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">干预状态</label>
              <select value={newForm.manualState} onChange={e => setNewForm({ ...newForm, manualState: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="MANUAL_OPEN">强制熔断</option>
                <option value="MANUAL_PASS">强制放行</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">目标名称</label>
              <input type="text" value={newForm.scope.activationName || ''} placeholder="如：warmUp"
                onChange={e => setNewForm({ ...newForm, scope: { ...newForm.scope, activationName: e.target.value, targetKey: e.target.value, eventPoint: e.target.value } })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">有效时长（秒）</label>
              <input type="number" value={newForm.ttlSeconds} onChange={e => setNewForm({ ...newForm, ttlSeconds: e.target.value === '' ? null : parseInt(e.target.value) })} min={0}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">备注（操作原因）</label>
              <textarea value={newForm.remark} onChange={e => setNewForm({ ...newForm, remark: e.target.value })} rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="请说明本次干预的原因..." />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setNewFormVisible(false)} className="h-8 px-4 text-sm font-medium text-[rgba(0,0,0,0.88)] border border-[#d9d9d9] rounded bg-white hover:border-[#1890ff] hover:text-[#1890ff] transition-colors">取消</button>
            <button onClick={handleAddOverride} className="h-8 px-4 text-sm font-medium text-white bg-[#faad14] border-none rounded hover:bg-[#d48806] transition-colors">确认干预</button>
          </div>
        </div>
      )}

      {/* 干预卡片网格 */}
      {overrides.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-12 text-center">
          <div className="text-[rgba(0,0,0,0.25)] text-sm">当前无手动干预配置</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {overrides.map(ov => {
            const cfg = MANUAL_STATE_CFG[ov.manualState] || { label: ov.manualState, cls: 'bg-slate-100 text-slate-600 border-slate-200', barCls: 'bg-slate-400' }
            return (
              <div key={ov.id} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className={`h-1.5 ${cfg.barCls}`} />
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-sm font-semibold text-[rgba(0,0,0,0.88)]">{formatScope(ov.scope)}</div>
                      <div className="text-xs font-mono text-[rgba(0,0,0,0.45)] mt-0.5">{ov.id}</div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${cfg.cls} whitespace-nowrap`}>{cfg.label}</span>
                  </div>
                  <div className="bg-[#fffbe6] rounded p-3 mb-3 italic text-xs text-[rgba(0,0,0,0.65)]">
                    {ov.remark || '无备注'}
                  </div>
                  <div className="flex items-center justify-between text-xs text-[rgba(0,0,0,0.45)]">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatTTL(ov.ttlSeconds)}</span>
                    </div>
                    <span>by {ov.operator}</span>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => setDeleteTarget(ov)}
                      className="flex items-center gap-1 text-xs text-[rgba(0,0,0,0.45)] hover:text-[#ff4d4f] transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />移除干预
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <AntdConfirmModal
        visible={!!deleteTarget}
        title="确认移除干预"
        content={`确定要立即移除对【${deleteTarget ? formatScope(deleteTarget.scope) : ''}】的手动干预吗？`}
        okType="danger"
        okText="确认移除"
        onOk={() => { onDeleteOverride(deleteTarget.id); setDeleteTarget(null) }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
