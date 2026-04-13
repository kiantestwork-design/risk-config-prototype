// PropertyDictionary 页面 - 还原自 app.js PropertyDictionaryPage（offset 1237623，~26K）
import { useState, useMemo } from 'react'
import { MOCK_PROPERTIES } from '../config/mock/properties'
import FieldTypeTag from '../components/FieldTypeTag'
import ValidateTag, { PD_VALIDATE_TYPES } from '../components/ValidateTag'
import StatusToggle from '../components/StatusToggle'
import SearchSelect from '../components/SearchSelect'
import MultiSelectFilter from '../components/MultiSelectFilter'
import ConfirmPopover from '../components/ConfirmPopover'

const PD_FIELD_TYPES = [
  { value: 'STRING', label: '字符串 STRING' },
  { value: 'INTEGER', label: '整数 INTEGER' },
  { value: 'LONG', label: '长整数 LONG' },
  { value: 'DOUBLE', label: '浮点数 DOUBLE' },
  { value: 'BOOLEAN', label: '布尔 BOOLEAN' },
  { value: 'LIST', label: '列表 LIST' },
  { value: 'JSON', label: 'JSON 对象' },
]

const EMPTY_FORM = { name: '', description: '', fieldType: 'STRING', validateType: '', validateArgs: '' }

function PdInlineForm({ form, setForm, onSave, onCancel, isEdit, errors, setErrors }) {
  const needsArgs = form.validateType === 'LENGTH' || form.validateType === 'REGEX'
  const argsPlaceholder = form.validateType === 'LENGTH' ? '请输入目标长度' : form.validateType === 'REGEX' ? '请输入正则表达式' : ''

  return (
    <div className="bg-[#fafafa] px-4 py-4" style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.04)' }}>
      <div className="grid grid-cols-3 gap-x-4 gap-y-3">
        {/* 属性名 */}
        <div>
          <label className="block text-xs text-[rgba(0,0,0,0.65)] mb-1">标准属性名</label>
          <input
            type="text"
            className={`w-full border rounded-md px-3 h-8 text-sm font-mono outline-none transition-colors ${isEdit ? 'bg-[#f5f5f5] cursor-not-allowed border-[#d9d9d9]' : 'bg-white border-[#d9d9d9] focus:border-[#1890ff] focus:shadow-[0_0_0_2px_rgba(24,144,255,0.2)]'} ${errors.name ? 'border-[#ff4d4f]' : ''}`}
            placeholder="如：user_id"
            value={form.name}
            onChange={e => { setForm({ ...form, name: e.target.value }); setErrors({ ...errors, name: undefined }) }}
            readOnly={isEdit}
          />
          {errors.name && <div className="text-xs text-[#ff4d4f] mt-0.5">{errors.name}</div>}
        </div>
        {/* 中文描述 */}
        <div>
          <label className="block text-xs text-[rgba(0,0,0,0.65)] mb-1">中文描述</label>
          <input
            type="text"
            className={`w-full border rounded-md px-3 h-8 text-sm outline-none bg-white transition-colors border-[#d9d9d9] focus:border-[#1890ff] focus:shadow-[0_0_0_2px_rgba(24,144,255,0.2)] ${errors.description ? 'border-[#ff4d4f]' : ''}`}
            placeholder="如：用户ID"
            value={form.description}
            onChange={e => { setForm({ ...form, description: e.target.value }); setErrors({ ...errors, description: undefined }) }}
          />
          {errors.description && <div className="text-xs text-[#ff4d4f] mt-0.5">{errors.description}</div>}
        </div>
        {/* 字段类型 */}
        <div>
          <label className="block text-xs text-[rgba(0,0,0,0.65)] mb-1">字段类型</label>
          <SearchSelect value={form.fieldType} onChange={v => setForm({ ...form, fieldType: v })} options={PD_FIELD_TYPES} placeholder="选择字段类型" />
        </div>
        {/* 校验类型 */}
        <div>
          <label className="block text-xs text-[rgba(0,0,0,0.65)] mb-1">校验类型</label>
          <SearchSelect
            value={form.validateType}
            onChange={v => { setForm({ ...form, validateType: v, validateArgs: '' }); setErrors({ ...errors, validateArgs: undefined }) }}
            options={PD_VALIDATE_TYPES}
            placeholder="选择校验类型"
          />
        </div>
        {/* 校验参数 */}
        {form.validateType !== '' && (
          <div>
            <label className="block text-xs text-[rgba(0,0,0,0.65)] mb-1">校验参数</label>
            <input
              type="text"
              className={`w-full border rounded-md px-3 h-8 text-sm outline-none transition-colors ${!needsArgs ? 'bg-[#f5f5f5] cursor-not-allowed border-[#d9d9d9]' : 'bg-white border-[#d9d9d9] focus:border-[#1890ff] focus:shadow-[0_0_0_2px_rgba(24,144,255,0.2)]'} ${errors.validateArgs ? 'border-[#ff4d4f]' : ''}`}
              placeholder={argsPlaceholder}
              value={form.validateArgs}
              onChange={e => { setForm({ ...form, validateArgs: e.target.value }); setErrors({ ...errors, validateArgs: undefined }) }}
              disabled={!needsArgs}
            />
            {errors.validateArgs && <div className="text-xs text-[#ff4d4f] mt-0.5">{errors.validateArgs}</div>}
          </div>
        )}
        {/* 操作按钮 */}
        <div className={`flex items-end justify-end gap-2 ${form.validateType !== '' ? '' : 'col-start-3'}`}>
          <button className="h-8 px-4 text-sm rounded-md border border-[#d9d9d9] bg-white text-[rgba(0,0,0,0.65)] hover:border-[#1890ff] hover:text-[#1890ff] transition-colors" onClick={onCancel}>取消</button>
          <button className="h-8 px-4 text-sm rounded-md bg-[#1890ff] text-white border-none hover:bg-[#40a9ff] transition-colors" onClick={onSave}>保存</button>
        </div>
      </div>
    </div>
  )
}

export default function PropertyDictionary() {
  const [items, setItems] = useState(MOCK_PROPERTIES.map(p => ({ ...p })))
  const [searchText, setSearchText] = useState('')
  const [typeFilter, setTypeFilter] = useState([])
  const [showNew, setShowNew] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [errors, setErrors] = useState({})
  const [newForm, setNewForm] = useState({ ...EMPTY_FORM })
  const [editForm, setEditForm] = useState({ ...EMPTY_FORM })

  const filtered = useMemo(() => items.filter(item => {
    const matchText = !searchText || item.name.toLowerCase().includes(searchText.toLowerCase()) || item.description.toLowerCase().includes(searchText.toLowerCase())
    const matchType = typeFilter.length === 0 || typeFilter.includes(item.fieldType)
    return matchText && matchType
  }), [items, searchText, typeFilter])

  const validateForm = (form, isEdit) => {
    const errs = {}
    if (!form.name.trim()) errs.name = '属性名不能为空'
    else if (!/^[a-z][a-z0-9_]*$/.test(form.name)) errs.name = '属性名必须以小写字母开头，只能包含小写字母、数字和下划线'
    else if (!isEdit && items.some(i => i.name === form.name)) errs.name = '属性名已存在'
    if (!form.description.trim()) errs.description = '描述不能为空'
    if (form.validateType === 'LENGTH') {
      if (!form.validateArgs || !/^\d+$/.test(form.validateArgs) || parseInt(form.validateArgs) <= 0) errs.validateArgs = '请输入正整数'
    }
    if (form.validateType === 'REGEX' && form.validateArgs) {
      try { new RegExp(form.validateArgs) } catch { errs.validateArgs = '无效的正则表达式' }
    }
    return errs
  }

  const startEdit = (item) => {
    setShowNew(false)
    setEditingId(item.id)
    setEditForm({ name: item.name, description: item.description, fieldType: item.fieldType, validateType: item.validateType, validateArgs: item.validateArgs })
    setErrors({})
  }

  const saveNew = () => {
    const errs = validateForm(newForm, false)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    const newItem = { id: String(Date.now()), ...newForm, status: 1, refCount: 0 }
    setItems([...items, newItem])
    setShowNew(false)
    setNewForm({ ...EMPTY_FORM })
    setErrors({})
  }

  const saveEdit = () => {
    const errs = validateForm(editForm, true)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setItems(items.map(i => i.id === editingId ? { ...i, description: editForm.description, fieldType: editForm.fieldType, validateType: editForm.validateType, validateArgs: editForm.validateArgs } : i))
    setEditingId(null)
    setErrors({})
  }

  const handleDelete = (id) => {
    setItems(items.filter(i => i.id !== id))
    setDeleteConfirmId(null)
  }

  return (
    <div>
      {/* 工具栏 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 max-w-xs">
            <input
              type="text"
              className="w-full border border-[#d9d9d9] rounded-md px-3 h-8 text-sm outline-none bg-white focus:border-[#1890ff] focus:shadow-[0_0_0_2px_rgba(24,144,255,0.2)] transition-colors"
              placeholder="搜索属性名或描述"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
          </div>
          <div className="w-64">
            <MultiSelectFilter value={typeFilter} onChange={setTypeFilter} options={PD_FIELD_TYPES} placeholder="筛选字段类型" />
          </div>
        </div>
        <button
          className="h-8 px-4 text-sm rounded-md bg-[#1890ff] text-white border-none hover:bg-[#40a9ff] transition-colors flex items-center gap-1"
          onClick={() => { setEditingId(null); setShowNew(true); setNewForm({ ...EMPTY_FORM }); setErrors({}) }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新增标准属性
        </button>
      </div>

      {/* 表格 */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full" style={{ tableLayout: 'auto' }}>
          <thead>
            <tr className="bg-[#fafafa] border-b border-[#f0f0f0]">
              <th className="px-3 py-3 text-left text-xs font-medium text-[rgba(0,0,0,0.65)]">属性信息</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-[rgba(0,0,0,0.65)]">字段类型</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-[rgba(0,0,0,0.65)]">校验规则</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-[rgba(0,0,0,0.65)]">引用数</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-[rgba(0,0,0,0.65)] w-[90px]">状态</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-[rgba(0,0,0,0.65)] w-[100px]">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => (
              <>
                <tr key={item.id} className={`border-b border-[#f0f0f0] hover:bg-[#fafafa] transition-colors ${editingId === item.id ? 'editing-row' : ''}`}>
                  <td className="px-3 py-3">
                    <div className="text-sm font-mono text-[#1890ff] cursor-pointer hover:underline">{item.name}</div>
                    <div className="text-xs text-[rgba(0,0,0,0.45)] mt-0.5">{item.description}</div>
                  </td>
                  <td className="px-3 py-3"><FieldTypeTag type={item.fieldType} /></td>
                  <td className="px-3 py-3"><ValidateTag type={item.validateType} args={item.validateArgs} /></td>
                  <td className="px-3 py-3"><span className="text-xs text-[rgba(0,0,0,0.45)]">{item.refCount} 个接入点</span></td>
                  <td className="px-3 py-3 text-center">
                    {item.refCount > 0 && item.status === 1 ? (
                      <span className="inline-flex items-center gap-1 text-xs text-[rgba(0,0,0,0.45)]" title={`被 ${item.refCount} 处引用，无法禁用`}>
                        <StatusToggle enabled={true} onChange={() => {}} />
                        <span className="text-[10px] text-orange-500">锁定</span>
                      </span>
                    ) : (
                      <StatusToggle enabled={item.status === 1} onChange={v => setItems(items.map(i => i.id === item.id ? { ...i, status: v ? 1 : 0 } : i))} />
                    )}
                  </td>
                  <td className="px-3 py-3 text-center w-[100px]">
                    <div className="relative inline-flex items-center gap-2">
                      <button className="text-xs text-[#1890ff] hover:text-[#40a9ff] transition-colors" onClick={() => startEdit(item)}>编辑</button>
                      {item.refCount > 0 ? (
                        <span className="text-xs text-[rgba(0,0,0,0.25)] cursor-not-allowed" title={`被 ${item.refCount} 处引用，无法删除`}>删除</span>
                      ) : (
                        <>
                          <button className="text-xs text-[#ff4d4f] hover:text-[#ff7875] transition-colors" onClick={() => setDeleteConfirmId(item.id)}>删除</button>
                          <ConfirmPopover
                            visible={deleteConfirmId === item.id}
                            onConfirm={() => handleDelete(item.id)}
                            onCancel={() => setDeleteConfirmId(null)}
                            message="确认删除该属性？"
                          />
                        </>
                      )}
                    </div>
                  </td>
                </tr>
                {/* 内联编辑行 */}
                <tr key={item.id + '-edit'}>
                  <td colSpan={6} className="p-0">
                    <div className={`expand-section ${editingId === item.id ? 'open' : ''}`}>
                      <div className="expand-inner">
                        {editingId === item.id && (
                          <PdInlineForm
                            form={editForm}
                            setForm={setEditForm}
                            onSave={saveEdit}
                            onCancel={() => { setEditingId(null); setErrors({}) }}
                            isEdit={true}
                            errors={errors}
                            setErrors={setErrors}
                          />
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              </>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-sm text-[rgba(0,0,0,0.25)]">暂无数据</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* 新增行（内联展开） */}
        <div className={`expand-section ${showNew ? 'open' : ''}`}>
          <div className="expand-inner">
            {showNew && (
              <PdInlineForm
                form={newForm}
                setForm={setNewForm}
                onSave={saveNew}
                onCancel={() => { setShowNew(false); setErrors({}); setNewForm({ ...EMPTY_FORM }) }}
                isEdit={false}
                errors={errors}
                setErrors={setErrors}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
