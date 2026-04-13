// UserManagement 页面 - 还原自 app.js UserMgmt（offset 1206030，~10K）
import { useState } from 'react'
import { ArrowLeft, Search } from 'lucide-react'

export default function UserManagement({ roles, users, onUpdateUsers }) {
  const [mode, setMode] = useState('LIST')
  const [editingUser, setEditingUser] = useState(null)
  const [form, setForm] = useState({ username: '', displayName: '', email: '', roleId: roles.length ? roles[0].id : 1, status: 1 })
  const [searchFilter, setSearchFilter] = useState({ username: '', role: 'ALL', status: 'ALL' })
  const [appliedFilter, setAppliedFilter] = useState({ username: '', role: 'ALL', status: 'ALL' })

  const applyFilter = () => setAppliedFilter({ ...searchFilter })

  const openNew = () => {
    const empty = { username: '', displayName: '', email: '', roleId: roles.length ? roles[0].id : 1, status: 1 }
    setForm(empty)
    setEditingUser(null)
    setMode('EDIT')
  }

  const openEdit = (user) => {
    setForm({ username: user.username, displayName: user.displayName, email: user.email, roleId: user.roleId, status: user.status })
    setEditingUser(user)
    setMode('EDIT')
  }

  const handleDelete = (user) => {
    if (user.id === 1) return
    if (confirm(`确定要删除用户【${user.displayName}】吗？`)) {
      onUpdateUsers(users.filter(u => u.id !== user.id))
    }
  }

  const handleSave = () => {
    if (!form.username.trim()) { alert('用户名不能为空'); return }
    if (editingUser) {
      onUpdateUsers(users.map(u => u.id === editingUser.id ? { ...editingUser, ...form } : u))
    } else {
      const newId = users.length ? Math.max(...users.map(u => u.id)) + 1 : 1
      const newUser = { id: newId, ...form, createAt: new Date().toISOString().replace('T', ' ').slice(0, 19), lastLoginAt: '-' }
      onUpdateUsers([...users, newUser])
    }
    setMode('LIST')
  }

  const filteredUsers = users.filter(u => {
    if (appliedFilter.username && !u.username.toLowerCase().includes(appliedFilter.username.toLowerCase()) && !u.displayName.includes(appliedFilter.username)) return false
    if (appliedFilter.role !== 'ALL' && u.roleId !== Number(appliedFilter.role)) return false
    if (appliedFilter.status !== 'ALL' && u.status !== Number(appliedFilter.status)) return false
    return true
  })

  const getRoleName = (roleId) => (roles.find(r => r.id === roleId) || {}).displayName || '未知角色'

  if (mode === 'EDIT') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setMode('LIST')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h2 className="text-xl font-bold text-slate-800">{editingUser ? '编辑用户' : '新建用户'}</h2>
          </div>
          <button onClick={handleSave} className="px-4 py-2 bg-[#1890ff] text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors shadow-sm">保存</button>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">用户名 *</label>
            <input type="text" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} disabled={!!editingUser}
              className={`w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${editingUser ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
              placeholder="请输入用户名" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">显示名</label>
            <input type="text" value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="请输入显示名" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">邮箱</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="请输入邮箱" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">角色</label>
            <select value={form.roleId} onChange={e => setForm({ ...form, roleId: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
              {roles.map(r => <option key={r.id} value={r.id}>{r.displayName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">状态</label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setForm({ ...form, status: form.status === 1 ? 2 : 1 })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${form.status === 1 ? 'bg-[#1890ff]' : 'bg-slate-300'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm ${form.status === 1 ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className={`text-sm font-medium ${form.status === 1 ? 'text-green-600' : 'text-slate-500'}`}>{form.status === 1 ? '启用' : '禁用'}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">用户管理</h2>
        {window.__hasPerm?.('user:edit') && (
          <button onClick={openNew} className="px-4 py-2 bg-[#1890ff] text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors shadow-sm">新建用户</button>
        )}
      </div>

      {/* 筛选栏 */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 flex flex-wrap items-center gap-3">
        <input type="text" placeholder="搜索用户名/显示名" value={searchFilter.username}
          onChange={e => setSearchFilter({ ...searchFilter, username: e.target.value })}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-52" />
        <select value={searchFilter.role} onChange={e => setSearchFilter({ ...searchFilter, role: e.target.value })}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
          <option value="ALL">全部角色</option>
          {roles.map(r => <option key={r.id} value={r.id}>{r.displayName}</option>)}
        </select>
        <select value={searchFilter.status} onChange={e => setSearchFilter({ ...searchFilter, status: e.target.value })}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
          <option value="ALL">全部状态</option>
          <option value="1">启用</option>
          <option value="2">禁用</option>
        </select>
        <button onClick={applyFilter} className="px-4 py-2 bg-[#1890ff] text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-1">
          <Search className="w-4 h-4" />查询
        </button>
      </div>

      {/* 表格 */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full" style={{ tableLayout: 'auto' }}>
          <thead className="bg-[#fafafa]">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">用户信息</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">邮箱</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">角色</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">最近登录</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 w-[90px]">状态</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 w-[100px]">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.map(user => (
              <tr key={user.id} className="hover:bg-[#fafafa] transition-colors">
                <td className="px-3 py-3">
                  <div className="text-sm font-medium text-[rgba(0,0,0,0.88)]">{user.displayName}</div>
                  <div className="text-xs text-[rgba(0,0,0,0.45)] font-mono">{user.username}</div>
                </td>
                <td className="px-3 py-3 text-sm text-[rgba(0,0,0,0.65)]">{user.email}</td>
                <td className="px-3 py-3">
                  <span className="inline-flex px-2 py-0.5 rounded text-xs bg-[#e6f7ff] text-[#1890ff] border border-[#91d5ff]">{getRoleName(user.roleId)}</span>
                </td>
                <td className="px-3 py-3 text-xs text-[rgba(0,0,0,0.45)]">{user.lastLoginAt}</td>
                <td className="px-3 py-3 text-center">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${user.status === 1 ? 'bg-[#f6ffed] text-[#52c41a] border border-[#b7eb8f]' : 'bg-[#f5f5f5] text-[rgba(0,0,0,0.45)] border border-[#d9d9d9]'}`}>
                    {user.status === 1 ? '启用' : '禁用'}
                  </span>
                </td>
                <td className="px-3 py-3 text-center w-[100px]">
                  {window.__hasPerm?.('user:edit') && (
                    <div className="inline-flex items-center gap-2">
                      <button className="text-xs text-[#1890ff] hover:text-[#40a9ff] transition-colors" onClick={() => openEdit(user)}>编辑</button>
                      {user.id !== 1 && <button className="text-xs text-[#ff4d4f] hover:text-[#ff7875] transition-colors" onClick={() => handleDelete(user)}>删除</button>}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-sm text-[rgba(0,0,0,0.25)]">暂无数据</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
