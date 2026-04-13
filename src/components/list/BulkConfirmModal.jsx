import { Rocket, CirclePlay, CircleStop, Trash2 } from 'lucide-react'

const BATCH_CONFIG = {
  RELEASE: {
    title: '批量提交待发布确认',
    icon: <Rocket className="w-5 h-5 text-indigo-600" />,
    infoBox: '仅 <strong>草稿 (Draft)</strong> 状态可以提交至待发布清单。其他状态将被自动忽略。',
    confirmText: '确认提交',
    confirmBtnClass: 'bg-indigo-600 hover:bg-indigo-700',
  },
  ENABLE: {
    title: '批量启用确认',
    icon: <CirclePlay className="w-5 h-5 text-green-600" />,
    infoBox: '批量启用将为选中项生成新的 <strong>草稿 (Draft)</strong>，并将状态置为启用。已启用项自动跳过。',
    confirmText: '确认启用',
    confirmBtnClass: 'bg-green-600 hover:bg-green-700',
  },
  DISABLE: {
    title: '批量禁用确认',
    icon: <CircleStop className="w-5 h-5 text-slate-600" />,
    infoBox: '批量禁用将为选中项生成新的 <strong>草稿 (Draft)</strong>，并将状态置为禁用。已禁用项自动跳过。',
    confirmText: '确认禁用',
    confirmBtnClass: 'bg-slate-600 hover:bg-slate-700',
  },
  DELETE: {
    title: '批量删除确认',
    icon: <Trash2 className="w-5 h-5 text-red-600" />,
    infoBox: '仅 <strong>草稿 (Draft)</strong> 状态将被删除。已上线或归档版本将被保留。',
    confirmText: '确认删除',
    confirmBtnClass: 'bg-red-600 hover:bg-red-700',
  },
}

export function checkEligibility(item, actionType) {
  switch (actionType) {
    case 'RELEASE':
      return item.lifecycleState === 'DRAFT' ? { eligible: true } : { eligible: false, reason: `非草稿状态 (${item.lifecycleState})` }
    case 'ENABLE':
      return item.status === 2 ? { eligible: true } : { eligible: false, reason: '已处于启用状态' }
    case 'DISABLE':
      return item.status === 1 ? { eligible: true } : { eligible: false, reason: '已处于禁用状态' }
    case 'DELETE':
      return item.lifecycleState === 'DRAFT' ? { eligible: true } : { eligible: false, reason: `非草稿状态 (${item.lifecycleState})，不可直接删除` }
    default:
      return { eligible: false }
  }
}

export default function BulkConfirmModal({ visible, action, selectedItems, onExecute, onClose }) {
  if (!visible || !action) return null
  const cfg = BATCH_CONFIG[action]
  if (!cfg) return null

  const eligibleItems = selectedItems.filter(it => checkEligibility(it, action).eligible)
  const eligibleCount = eligibleItems.length

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-[560px] max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          {cfg.icon}
          <h3 className="text-lg font-semibold text-slate-900">{cfg.title}</h3>
        </div>
        <div className="px-6 py-4">
          <div className="bg-blue-50 border border-blue-100 p-3 rounded-md text-sm text-blue-800 mb-4" dangerouslySetInnerHTML={{ __html: cfg.infoBox }} />
          <p className="text-sm text-slate-700 mb-3">
            已选择 <strong>{selectedItems.length}</strong> 个项目，其中 <strong className="text-green-600">{eligibleCount}</strong> 个符合操作条件。
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {selectedItems.map(it => {
              const check = checkEligibility(it, action)
              return (
                <div key={it.id} className={`flex items-center justify-between px-3 py-2 rounded text-sm ${check.eligible ? 'bg-green-50 border border-green-100' : 'bg-slate-50 border border-slate-100'}`}>
                  <span className="font-mono text-slate-700">{it.name || it.eventPoint || it.id}</span>
                  {check.eligible
                    ? <span className="text-green-600 text-xs">可操作</span>
                    : <span className="text-slate-400 text-xs">{check.reason}</span>}
                </div>
              )
            })}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors">取消</button>
          <button onClick={() => onExecute(eligibleItems)} disabled={eligibleCount === 0}
            className={`px-4 py-2 text-sm text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${cfg.confirmBtnClass}`}>
            {cfg.confirmText} ({eligibleCount})
          </button>
        </div>
      </div>
    </div>
  )
}
