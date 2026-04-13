// 场景卡片组件 - 接入点详情 Tab 2
import { useState } from 'react'
import { Plus, Trash2, Check, X, ChevronDown, ChevronUp } from 'lucide-react'
import SearchSelect from './SearchSelect'
import ConfirmPopover from './ConfirmPopover'

const ACTION_COLORS = {
  READ: 'bg-blue-50 text-blue-700 border-blue-200',
  WRITE: 'bg-green-50 text-green-700 border-green-200',
  DELETE: 'bg-red-50 text-red-700 border-red-200',
}

const EMPTY_FORM = { featureId: '', action: 'READ', propertyMapping: '', conditionExpression: '' }

export default function SceneCard({ sceneName, sceneCode, sceneColor, features = [], availableFeatures = [], availableProperties = [], onChange, readOnly }) {
  const [expanded, setExpanded] = useState(true)
  const [addMode, setAddMode] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const featureOptions = availableFeatures.map(f => ({ value: String(f.id), label: `${f.description || f.name} (${f.name})` }))
  const propertyOptions = availableProperties.map(p => ({ value: p.propertyName || p.name, label: `${p.propertyDesc || p.description} (${p.propertyName || p.name})` }))

  const handleAdd = () => { setAddMode(true); setForm(EMPTY_FORM) }
  const handleCancel = () => { setAddMode(false); setForm(EMPTY_FORM) }

  const handleSave = () => {
    if (!form.featureId) return
    const ft = availableFeatures.find(f => String(f.id) === form.featureId)
    if (!ft) return
    const newItem = {
      id: `sf-${Date.now()}`,
      featureId: ft.id,
      featureName: ft.name,
      featureDesc: ft.description,
      action: form.action,
      propertyMapping: form.propertyMapping,
      conditionExpression: form.conditionExpression,
    }
    onChange([...features, newItem])
    setAddMode(false)
    setForm(EMPTY_FORM)
  }

  const handleDelete = (id) => { onChange(features.filter(f => f.id !== id)) }

  const colorMap = { PRE: 'border-l-blue-500 bg-blue-50/30', PROCESS: 'border-l-green-500 bg-green-50/30', POST: 'border-l-orange-500 bg-orange-50/30' }
  const tagColorMap = { PRE: 'bg-blue-100 text-blue-700', PROCESS: 'bg-green-100 text-green-700', POST: 'bg-orange-100 text-orange-700' }

  return (
    <div className={`rounded-lg border border-slate-200 shadow-sm overflow-hidden border-l-4 ${colorMap[sceneCode] || 'border-l-slate-400'}`}>
      {/* 卡片头 */}
      <div className="flex items-center justify-between px-4 py-3 bg-white cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold px-2 py-0.5 rounded ${tagColorMap[sceneCode] || 'bg-slate-100 text-slate-600'}`}>{sceneCode}</span>
          <span className="text-sm font-semibold text-slate-800">{sceneName}</span>
          <span className="text-xs text-[rgba(0,0,0,0.45)]">{features.length} 个特征</span>
        </div>
        <div className="flex items-center gap-2">
          {!readOnly && !addMode && expanded && (
            <button onClick={(e) => { e.stopPropagation(); handleAdd() }}
              className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-[#1890ff] bg-blue-50 border border-[#1890ff] rounded hover:bg-blue-100 transition-colors"
              title="添加特征">
              <Plus className="w-3 h-3 mr-1" />添加
            </button>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {/* 卡片内容 */}
      {expanded && (
        <div className="border-t border-slate-100">
          <table className="w-full" style={{ tableLayout: 'auto' }}>
            <thead className="bg-[#fafafa]">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[rgba(0,0,0,0.65)]">特征信息</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-[rgba(0,0,0,0.65)] w-20">动作</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[rgba(0,0,0,0.65)] w-32">提取属性</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[rgba(0,0,0,0.65)]">进入条件</th>
                {!readOnly && <th className="px-3 py-2 text-center text-xs font-semibold text-[rgba(0,0,0,0.65)] w-16">操作</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f0]">
              {features.map(item => (
                <tr key={item.id} className="hover:bg-[#fafafa] transition-colors">
                  <td className="px-3 py-2.5">
                    <div className="text-sm font-mono text-[#1890ff]">{item.featureName}</div>
                    <div className="text-xs text-[rgba(0,0,0,0.45)]">{item.featureDesc}</div>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs border font-medium ${ACTION_COLORS[item.action] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                      {item.action}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    {item.propertyMapping ? (
                      <code className="text-xs font-mono bg-slate-50 px-1.5 py-0.5 rounded text-slate-700">{item.propertyMapping}</code>
                    ) : <span className="text-xs text-[rgba(0,0,0,0.25)]">—</span>}
                  </td>
                  <td className="px-3 py-2.5">
                    {item.conditionExpression ? (
                      <code className="text-xs font-mono bg-amber-50 px-1.5 py-0.5 rounded text-amber-800 border border-amber-200">{item.conditionExpression}</code>
                    ) : <span className="text-xs text-[rgba(0,0,0,0.25)]">无条件</span>}
                  </td>
                  {!readOnly && (
                    <td className="px-3 py-2.5 text-center">
                      <ConfirmPopover message="确定移除？" onConfirm={() => handleDelete(item.id)}>
                        <button className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </ConfirmPopover>
                    </td>
                  )}
                </tr>
              ))}

              {/* 内联添加表单 */}
              {addMode && (
                <tr className="bg-[#fafafa]" style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.04)' }}>
                  <td className="px-3 py-3">
                    <SearchSelect value={form.featureId} onChange={v => setForm({ ...form, featureId: v })}
                      options={featureOptions} placeholder="选择特征" />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <select value={form.action} onChange={e => setForm({ ...form, action: e.target.value })}
                      className="border border-[#d9d9d9] rounded px-2 h-8 text-xs bg-white focus:border-[#1890ff] outline-none">
                      <option value="READ">READ</option>
                      <option value="WRITE">WRITE</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    <SearchSelect value={form.propertyMapping} onChange={v => setForm({ ...form, propertyMapping: v })}
                      options={propertyOptions} placeholder="选择属性" />
                  </td>
                  <td className="px-3 py-3">
                    <input type="text" value={form.conditionExpression} onChange={e => setForm({ ...form, conditionExpression: e.target.value })}
                      placeholder="如：fact.trade_amount > 0"
                      className="w-full border border-[#d9d9d9] rounded px-2 h-8 text-xs font-mono bg-white focus:border-[#1890ff] outline-none" />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex justify-center gap-1.5">
                      <button onClick={handleSave} disabled={!form.featureId}
                        className="text-[#52c41a] hover:text-green-700 disabled:text-slate-300 disabled:cursor-not-allowed"><Check className="w-4 h-4" /></button>
                      <button onClick={handleCancel} className="text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              )}

              {features.length === 0 && !addMode && (
                <tr><td colSpan={readOnly ? 4 : 5} className="px-3 py-6 text-center text-xs text-[rgba(0,0,0,0.25)]">暂无特征绑定</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
