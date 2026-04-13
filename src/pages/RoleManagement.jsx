// RoleManagement 页面 - 还原自 app.js RoleMgmt（offset ~1217000）
import { useState } from 'react'
import { ArrowLeft, FileText, SquarePen, Trash2 } from 'lucide-react'
import { PERM_GROUPS } from '../config/permissions'

export default function RoleManagement({ roles, users, onUpdateRoles }) {
  const [mode, setMode] = useState('LIST')
  const [editingRole, setEditingRole] = useState(null)
  const [isReadonly, setIsReadonly] = useState(false)
  const [form, setForm] = useState({ name: '', displayName: '', description: '', permissions: [], isBuiltin: false })

  const getUserCount = (roleId) => users.filter(u => u.roleId === roleId).length

  const openNew = () => {
    setForm({ name: '', displayName: '', description: '', permissions: [], isBuiltin: false })
    setEditingRole(null)
    setIsReadonly(false)
    setMode('EDIT')
  }

  const openView = (role) => {
    setForm({ name: role.name, displayName: role.displayName, description: role.description, permissions: [...role.permissions], isBuiltin: role.isBuiltin })
    setEditingRole(role)
    setIsReadonly(true)
    setMode('EDIT')
  }

  const openEdit = (role) => {
    setForm({ name: role.name, displayName: role.displayName, description: role.description, permissions: [...role.permissions], isBuiltin: role.isBuiltin })
    setEditingRole(role)
    setIsReadonly(false)
    setMode('EDIT')
  }

  const handleDelete = (role) => {
    if (confirm(`确定要删除角色【${role.displayName}】吗？`)) {
      onUpdateRoles(roles.filter(r => r.id !== role.id))
    }
  }

  const handleSave = () => {
    if (!form.name.trim()) { alert('角色名不能为空'); return }
    if (!form.displayName.trim()) { alert('显示名不能为空'); return }
    if (editingRole) {
      onUpdateRoles(roles.map(r => r.id === editingRole.id ? { ...editingRole, displayName: form.displayName, description: form.description, permissions: [...form.permissions] } : r))
    } else {
      const newId = roles.length ? Math.max(...roles.map(r => r.id)) + 1 : 1
      onUpdateRoles([...roles, { id: newId, name: form.name, displayName: form.displayName, description: form.description, permissions: [...form.permissions], isBuiltin: false }])
    }
    setMode('LIST')
  }

  const togglePerm = (permKey) => {
    const has = form.permissions.includes(permKey)
    setForm({ ...form, permissions: has ? form.permissions.filter(p => p !== permKey) : [...form.permissions, permKey] })
  }

  const toggleGroup = (group) => {
    const groupKeys = group.perms.map(p => p.key)
    const allSelected = groupKeys.every(k => form.permissions.includes(k))
    if (allSelected) {
      setForm({ ...form, permissions: form.permissions.filter(k => !groupKeys.includes(k)) })
    } else {
      const merged = new Set([...form.permissions, ...groupKeys])
      setForm({ ...form, permissions: [...merged] })
    }
  }

  if (mode === 'EDIT') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setMode('LIST')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h2 className="text-xl font-bold text-slate-800">{isReadonly ? '查看角色' : editingRole ? '编辑角色' : '新建角色'}</h2>
          </div>
          {!isReadonly && (
            <button onClick={handleSave} className="px-4 py-2 bg-[#1890ff] text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors shadow-sm">保存</button>
          )}
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-5">
          <h3 className="text-base font-semibold text-slate-800 mb-2">基本信息</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">角色名 *</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              disabled={!!editingRole || isReadonly}
              className={`w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${!!editingRole || isReadonly ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
              placeholder="请输入角色名" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">显示名 *</label>
            <input type="text" value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })}
              disabled={isReadonly}
              className={`w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${isReadonly ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
              placeholder="请输入显示名" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">描述</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              disabled={isReadonly} rows={3}
              className={`w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none ${isReadonly ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
              placeholder="请输入角色描述" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-5">
          <h3 className="text-base font-semibold text-slate-800 mb-2">权限配置</h3>
          {PERM_GROUPS.map(group => {
            const allSelected = group.perms.every(p => form.permissions.includes(p.key))
            return (
              <div key={group.key} className="border border-slate-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-slate-700">{group.label}</h4>
                  {!isReadonly && (
                    <button onClick={() => toggleGroup(group)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                      {allSelected ? '取消' : '全选'}
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {group.perms.map(perm => (
                    <label key={perm.key} className={`flex items-center gap-2 text-sm ${isReadonly ? 'text-slate-400 cursor-not-allowed' : 'text-slate-600 cursor-pointer'}`}>
                      <input type="checkbox" checked={form.permissions.includes(perm.key)}
                        onChange={() => togglePerm(perm.key)} disabled={isReadonly}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                      <span>{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">角色管理</h2>
        {window.__hasPerm?.('role:edit') && (
          <button onClick={openNew} className="px-4 py-2 bg-[#1890ff] text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors shadow-sm">新建角色</button>
        )}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full" style={{ tableLayout: 'auto' }}>
          <thead className="bg-[#fafafa]">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">显示名</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">角色名</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">描述</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">权限数量</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">关联用户数</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">类型</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 w-[100px]">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {roles.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400">暂无角色数据</td></tr>
            ) : roles.map(role => (
              <tr key={role.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-3 py-3 text-sm font-medium text-slate-800">{role.displayName}</td>
                <td className="px-3 py-3 text-sm font-mono text-slate-600">{role.name}</td>
                <td className="px-3 py-3 text-sm text-slate-600">{role.description}</td>
                <td className="px-3 py-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">{role.permissions.length} 项权限</span>
                </td>
                <td className="px-3 py-3 text-sm text-slate-600">{getUserCount(role.id)} 人</td>
                <td className="px-3 py-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${role.isBuiltin ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                    {role.isBuiltin ? '内置' : '自定义'}
                  </span>
                </td>
                <td className="px-3 py-3 text-center">
                  <div className="inline-flex items-center gap-2">
                    <button onClick={() => openView(role)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="查看">
                      <FileText className="w-4 h-4" />
                    </button>
                    {!role.isBuiltin && window.__hasPerm?.('role:edit') && (
                      <button onClick={() => openEdit(role)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="编辑">
                        <SquarePen className="w-4 h-4" />
                      </button>
                    )}
                    {!role.isBuiltin && (
                      <button onClick={() => handleDelete(role)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="删除">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
