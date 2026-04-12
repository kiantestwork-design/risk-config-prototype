// EntityEditorShell - 还原自 app.js EntityEditorShell 组件（offset 699073，~115K）
// 包含：查看/编辑模式切换、脏数据检测、版本历史、导航守卫、保存确认弹框
import { useState, useRef, useCallback } from 'react'
import { ArrowLeft, GitBranch, Save, SquarePen, History, X, CircleAlert, TriangleAlert } from 'lucide-react'
import { showToast } from './Toast'

// AntdConfirmModal - 还原自 app.js AntdConfirmModal 组件
export function AntdConfirmModal({ visible, title, content, onOk, onCancel, okText, cancelText, okType }) {
  if (!visible) return null
  const isDanger = okType === 'danger'
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={onCancel}>
      <div
        className="animate-in fade-in zoom-in-95 duration-200"
        style={{ background: '#fff', borderRadius: 8, padding: 24, maxWidth: 416, width: 'calc(100% - 32px)', boxShadow: '0 6px 16px rgba(0,0,0,0.08), 0 3px 6px -4px rgba(0,0,0,0.12), 0 9px 28px 8px rgba(0,0,0,0.05)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ flexShrink: 0, width: 22, height: 22, marginTop: 1 }}>
            {isDanger
              ? <CircleAlert style={{ width: 22, height: 22, color: '#ff4d4f' }} />
              : <TriangleAlert style={{ width: 22, height: 22, color: '#faad14' }} />
            }
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'rgba(0,0,0,0.88)', lineHeight: '24px' }}>{title}</div>
            <div style={{ fontSize: 14, color: 'rgba(0,0,0,0.65)', marginTop: 8, lineHeight: '22px' }}>{content}</div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
          <button
            onClick={onCancel}
            style={{ height: 32, padding: '0 15px', fontSize: 14, fontWeight: 500, color: 'rgba(0,0,0,0.88)', background: '#fff', border: '1px solid #d9d9d9', borderRadius: 6, cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.target.style.color = '#1890ff'; e.target.style.borderColor = '#1890ff' }}
            onMouseLeave={e => { e.target.style.color = 'rgba(0,0,0,0.88)'; e.target.style.borderColor = '#d9d9d9' }}
          >
            {cancelText || '取消'}
          </button>
          <button
            onClick={onOk}
            style={{ height: 32, padding: '0 15px', fontSize: 14, fontWeight: 500, color: '#fff', background: isDanger ? '#ff4d4f' : '#1890ff', border: '1px solid transparent', borderRadius: 6, cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.target.style.background = isDanger ? '#ff7875' : '#40a9ff' }}
            onMouseLeave={e => { e.target.style.background = isDanger ? '#ff4d4f' : '#1890ff' }}
          >
            {okText || '确定'}
          </button>
        </div>
      </div>
    </div>
  )
}

// 版本历史面板
function VersionHistoryPanel({ versions, selectedVersionId, onSelectVersion }) {
  const lsBadge = (state) => {
    const map = {
      DRAFT: { cls: 'bg-slate-100 text-slate-600 border-slate-200', label: '草稿' },
      READY: { cls: 'bg-purple-50 text-purple-600 border-purple-200', label: '待发布' },
      PUBLISHED: { cls: 'bg-green-50 text-green-600 border-green-200', label: '线上' },
      ARCHIVED: { cls: 'bg-orange-50 text-orange-600 border-orange-200', label: '历史' },
    }[state]
    return map ? <span className={`${map.cls} text-[10px] px-1.5 py-0.5 rounded border font-medium`}>{map.label}</span> : null
  }

  if (versions.length === 0) {
    return <div className="text-sm text-slate-400 text-center py-8">暂无历史版本</div>
  }
  return (
    <div className="space-y-2">
      {versions.map(v => (
        <div
          key={v.id}
          className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedVersionId === v.id ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50'}`}
          onClick={() => onSelectVersion(v)}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-800">v{v.version}</span>
              {v.content?.lifecycleState && lsBadge(v.content.lifecycleState)}
            </div>
            <span className="text-[10px] text-slate-400">{v.createAt}</span>
          </div>
          <div className="text-xs text-slate-500 mb-1">{v.commitMessage || '无版本说明'}</div>
          <div className="text-[10px] text-slate-400">{v.editor}</div>
        </div>
      ))}
    </div>
  )
}

// EntityEditorShell 主组件
// Props:
//   entityName  - 实体名称（如"接入点"）
//   item        - 当前实体数据（null 表示新建）
//   isNew       - 是否新建
//   fields      - 字段定义数组 [{key, label, required, defaultValue}]（可选，与 renderForm 二选一）
//   onSave      - 保存回调 fn(data) => savedItem | void
//   onBack      - 返回回调
//   versions    - 版本历史数组（可选）
//   renderForm  - 自定义表单渲染 fn({data, onChange, mode, changeNoteEl}) => JSX
//   extraSections - 额外分区渲染 fn({data, mode}) => JSX（可选）
//   initialMode - 初始模式（'view' | 'edit'）
export default function EntityEditorShell({ entityName, item, isNew, fields, onSave, onBack, versions = [], renderForm, extraSections, initialMode }) {
  const _init = item || (fields ? fields.reduce((acc, f) => ({ ...acc, [f.key]: f.defaultValue || '' }), {}) : {})
  const [mode, setMode] = useState(initialMode || (isNew ? 'edit' : 'view'))
  const [displayed, setDisplayed] = useState(_init)
  const [edited, setEdited] = useState(_init)
  const baseline = useRef(isNew || initialMode === 'edit' ? JSON.stringify(_init) : '')
  const [selectedVersion, setSelectedVersion] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingNav, setPendingNav] = useState(null)
  const [changeNote, setChangeNote] = useState(isNew ? '初始创建' : '')

  const isDirty = useCallback(() => JSON.stringify(edited) !== baseline.current, [edited])

  const onChange = useCallback((key, value) => {
    setEdited(prev => ({ ...prev, [key]: value }))
  }, [])

  const guardNav = useCallback((fn) => {
    if (isDirty()) { setPendingNav(() => fn) } else { fn() }
  }, [isDirty])

  const handleEdit = useCallback(() => {
    const data = { ...displayed }
    setEdited(data)
    baseline.current = JSON.stringify(data)
    setSelectedVersion(null)
    setChangeNote('')
    setMode('edit')
  }, [displayed])

  const handleCancel = useCallback(() => {
    if (isNew) { isDirty() ? setPendingNav(() => onBack) : onBack(); return }
    guardNav(() => setMode('view'))
  }, [isNew, isDirty, guardNav, onBack])

  const handleBack = useCallback(() => {
    mode === 'edit' ? guardNav(onBack) : onBack()
  }, [mode, guardNav, onBack])

  const handleSaveClick = useCallback(() => {
    if (fields) {
      for (const f of fields) {
        if (f.required && !String(edited[f.key] || '').trim()) {
          alert('请填写' + f.label); return
        }
      }
    }
    setShowConfirm(true)
  }, [edited, fields])

  const doSave = useCallback(() => {
    const data = { ...edited, updateAt: new Date().toISOString().replace('T', ' ').slice(0, 19) }
    if (changeNote) data._changeNote = changeNote
    const saved = onSave(data)
    if (saved) setDisplayed(saved); else setDisplayed(data)
    setShowConfirm(false)
    showToast({ type: 'success', message: entityName + (isNew ? '创建成功' : '保存成功'), description: entityName + '已成功' + (isNew ? '创建' : '保存') + '。' })
    baseline.current = JSON.stringify(saved || data)
    setChangeNote('')
    if (!isNew) setMode('view')
  }, [edited, onSave, entityName, isNew, changeNote])

  const handleLoadVersion = useCallback((v) => {
    const fn = () => {
      setSelectedVersion(v.id)
      const content = { ...v.content, id: displayed.id }
      if (mode === 'edit') { setEdited(content); baseline.current = JSON.stringify(content); setChangeNote('') }
      else { setDisplayed(content) }
    }
    mode === 'edit' ? guardNav(fn) : fn()
  }, [mode, displayed.id, guardNav])

  const changeNoteEl = mode === 'edit' ? (
    <div className="border-t border-slate-200 pt-6 mt-6">
      <label className="block text-sm font-semibold text-slate-800 mb-2">版本说明</label>
      <textarea
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[80px]"
        placeholder="简要描述本次变更的内容或原因..."
        value={changeNote}
        onChange={e => setChangeNote(e.target.value)}
      />
    </div>
  ) : null

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={handleBack} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
              {mode === 'edit' && isNew ? '新建' + entityName : (
                <span className="font-mono">{displayed.name || displayed.eventPoint || displayed.id || entityName}</span>
              )}
              {mode === 'edit' && (
                <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-xs border border-slate-200 flex items-center">
                  <GitBranch className="w-3 h-3 mr-1" />编辑中
                </span>
              )}
            </h2>
            {mode !== 'edit' && displayed.description && (
              <div className="text-sm text-slate-500 mt-0.5">{displayed.description}</div>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          {mode === 'edit' ? (
            <>
              <button type="button" onClick={handleCancel} className="px-5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors">
                取消
              </button>
              <button type="button" onClick={handleSaveClick} className="flex items-center px-5 py-2 text-sm font-bold text-white bg-indigo-600 border border-transparent rounded hover:bg-indigo-700 shadow-sm transition-colors">
                <Save className="w-4 h-4 mr-2" />保存
              </button>
            </>
          ) : (
            <button onClick={handleEdit} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors shadow-sm font-medium">
              <SquarePen className="w-4 h-4 mr-2" />编辑
            </button>
          )}
        </div>
      </div>

      {/* 主体 */}
      <div className="flex gap-6">
        <div className="flex-1 space-y-6 min-w-0">
          {renderForm && renderForm({ data: mode === 'edit' ? edited : displayed, onChange, mode, changeNoteEl })}
          {extraSections && extraSections({ data: mode === 'edit' ? edited : displayed, mode })}
        </div>
        {/* 版本历史面板 */}
        {versions && versions.length > 0 && !isNew && (
          <div className="w-[260px] shrink-0 border-l border-slate-200 pl-6">
            <div className="sticky top-6">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
                <History className="w-4 h-4 text-slate-500" />历史版本
              </h3>
              <VersionHistoryPanel versions={versions} selectedVersionId={selectedVersion} onSelectVersion={handleLoadVersion} />
            </div>
          </div>
        )}
      </div>

      {/* 导航守卫弹框 */}
      <AntdConfirmModal
        visible={!!pendingNav}
        title="确认"
        content="有未保存的修改，确定要放弃吗？"
        okType="danger"
        okText="确定"
        onOk={() => { const fn = pendingNav; setPendingNav(null); fn?.() }}
        onCancel={() => setPendingNav(null)}
      />

      {/* 保存确认弹框 */}
      <AntdConfirmModal
        visible={showConfirm}
        title="确认保存"
        content={`确定要保存对该${entityName}的所有更改吗？`}
        onOk={doSave}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  )
}
