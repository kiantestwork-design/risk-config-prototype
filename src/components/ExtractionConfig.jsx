// 属性提取配置组件 - 接入点详情 Tab 1
import { useState } from 'react'
import { Plus, SquarePen, Trash2, Check, X } from 'lucide-react'
import FieldTypeTag from './FieldTypeTag'
import ValidateTag from './ValidateTag'
import ConfirmPopover from './ConfirmPopover'
import SearchSelect from './SearchSelect'

const EMPTY_FORM = { propertyId: '', fieldName: '' }

export default function ExtractionConfig({ eventPointCode, extractions = [], standardProperties = [], onChange, readOnly }) {
  const [editId, setEditId] = useState(null)
  const [addMode, setAddMode] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const usedPropertyIds = extractions.filter(e => e.id !== editId).map(e => e.propertyId)
  const availableProps = standardProperties.filter(p => !usedPropertyIds.includes(p.id) && p.status === 1)
  const propOptions = availableProps.map(p => ({ value: p.id, label: `${p.description} (${p.name})` }))

  const getProp = (propertyId) => standardProperties.find(p => p.id === propertyId)

  const handleSave = () => {
    if (!form.propertyId || !form.fieldName.trim()) return
    const prop = getProp(form.propertyId)
    if (!prop) return
    if (editId) {
      onChange(extractions.map(e => e.id === editId ? { ...e, propertyId: prop.id, propertyName: prop.name, propertyDesc: prop.description, fieldName: form.fieldName.trim() } : e))
    } else {
      const newItem = { id: `ext-${Date.now()}`, propertyId: prop.id, propertyName: prop.name, propertyDesc: prop.description, fieldName: form.fieldName.trim(), status: 1 }
      onChange([...extractions, newItem])
    }
    setEditId(null)
    setAddMode(false)
    setForm(EMPTY_FORM)
  }

  const handleEdit = (item) => {
    setEditId(item.id)
    setAddMode(false)
    setForm({ propertyId: item.propertyId, fieldName: item.fieldName })
  }

  const handleCancel = () => {
    setEditId(null)
    setAddMode(false)
    setForm(EMPTY_FORM)
  }

  const handleDelete = (id) => {
    onChange(extractions.filter(e => e.id !== id))
  }

  const handleAdd = () => {
    setAddMode(true)
    setEditId(null)
    setForm(EMPTY_FORM)
  }

  const renderInlineForm = () => (
    <tr className="bg-[#fafafa]" style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.04)' }}>
      <td className="px-3 py-3" colSpan={2}>
        <div className="flex gap-3 items-center">
          <div className="w-52">
            <SearchSelect value={form.propertyId} onChange={v => setForm({ ...form, propertyId: v })}
              options={propOptions} placeholder="选择标准属性" />
          </div>
          <input type="text" value={form.fieldName} onChange={e => setForm({ ...form, fieldName: e.target.value })}
            placeholder="提取路径，如：event.properties.amount"
            className="flex-1 border border-[#d9d9d9] rounded-md px-3 h-8 text-sm font-mono bg-white focus:border-[#1890ff] focus:shadow-[0_0_0_2px_rgba(24,144,255,0.2)] outline-none" />
        </div>
      </td>
      <td className="px-3 py-3 text-center text-xs text-[rgba(0,0,0,0.45)]">
        {form.propertyId ? <FieldTypeTag type={getProp(form.propertyId)?.fieldType} /> : '—'}
      </td>
      <td className="px-3 py-3 text-center text-xs text-[rgba(0,0,0,0.45)]">
        {form.propertyId ? <ValidateTag type={getProp(form.propertyId)?.validateType} args={getProp(form.propertyId)?.validateArgs} /> : '—'}
      </td>
      <td className="px-3 py-3 text-center">—</td>
      <td className="px-3 py-3 text-center">
        <div className="flex justify-center gap-2">
          <button onClick={handleSave} disabled={!form.propertyId || !form.fieldName.trim()}
            className="text-[#52c41a] hover:text-green-700 disabled:text-slate-300 disabled:cursor-not-allowed"><Check className="w-4 h-4" /></button>
          <button onClick={handleCancel} className="text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
        </div>
      </td>
    </tr>
  )

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-semibold text-slate-800">属性提取配置</h3>
        {!readOnly && !addMode && !editId && (
          <button onClick={handleAdd}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-[#1890ff] rounded hover:bg-[#40a9ff] shadow-sm transition-colors">
            <Plus className="w-3.5 h-3.5 mr-1" />添加映射
          </button>
        )}
      </div>
      <div className="text-xs text-[rgba(0,0,0,0.45)] mb-3">
        将接入点 <span className="font-mono text-[#1890ff]">{eventPointCode}</span> 的原始 JSON 字段映射到标准属性。字段类型和校验规则继承自属性字典（只读）。
      </div>
      <div className="border border-[#f0f0f0] rounded-lg overflow-hidden">
        <table className="w-full" style={{ tableLayout: 'auto' }}>
          <thead className="bg-[#fafafa]">
            <tr>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-[rgba(0,0,0,0.65)]">标准属性</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-[rgba(0,0,0,0.65)]">提取路径</th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold text-[rgba(0,0,0,0.65)] w-24">字段类型</th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold text-[rgba(0,0,0,0.65)] w-28">校验规则</th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold text-[rgba(0,0,0,0.65)] w-20">状态</th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold text-[rgba(0,0,0,0.65)] w-[100px]">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f0f0]">
            {extractions.map(item => {
              if (editId === item.id) return renderInlineForm()
              const prop = getProp(item.propertyId)
              return (
                <tr key={item.id} className="hover:bg-[#fafafa] transition-colors">
                  <td className="px-3 py-2.5">
                    <div className="text-sm font-mono text-[#1890ff]">{item.propertyName}</div>
                    <div className="text-xs text-[rgba(0,0,0,0.45)]">{item.propertyDesc}</div>
                  </td>
                  <td className="px-3 py-2.5">
                    <code className="text-xs font-mono bg-slate-50 px-1.5 py-0.5 rounded text-slate-700">{item.fieldName}</code>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {prop ? <FieldTypeTag type={prop.fieldType} /> : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {prop ? <ValidateTag type={prop.validateType} args={prop.validateArgs} /> : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs border ${item.status === 1 ? 'bg-[#f6ffed] text-[#52c41a] border-[#b7eb8f]' : 'bg-[#f5f5f5] text-[rgba(0,0,0,0.45)] border-[#d9d9d9]'}`}>
                      {item.status === 1 ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {!readOnly && (
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleEdit(item)} className="text-slate-500 hover:text-[#1890ff] transition-colors" title="编辑">
                          <SquarePen className="w-3.5 h-3.5" />
                        </button>
                        <ConfirmPopover message="确定删除此映射？" onConfirm={() => handleDelete(item.id)}>
                          <button className="text-slate-400 hover:text-red-500 transition-colors" title="删除">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </ConfirmPopover>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
            {addMode && renderInlineForm()}
            {extractions.length === 0 && !addMode && (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-sm text-[rgba(0,0,0,0.25)]">暂无提取映射配置</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
