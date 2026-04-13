// App.jsx - 壳层，还原自 app.js dce 函数
// 使用 HashRouter 作为路由唯一真源（替代原版 currentPage state）
import { useState } from 'react'
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Database, Layers, Globe, Target, GitBranch, Zap,
  Shield, TriangleAlert, FileText, ShoppingCart, List, Settings, User,
  Menu, Search, BookOpen, Bell, ChevronDown, ChevronRight, ArrowRight,
  CircleCheck, X,
} from 'lucide-react'

import { MENU_CONFIG } from './config/menu'
import { BUILTIN_ROLES, INIT_USERS, MENU_PERM_MAP } from './config/permissions'
import { MOCK_POLICIES } from './config/mock/policies'
import { MOCK_OVERRIDES } from './config/mock/overrides'
import { MOCK_ORDERS, MOCK_DRAFTS } from './config/mock/releases'
import { MOCK_ENTRY_POINTS } from './config/mock/entry-points'
import { MOCK_FEATURES } from './config/mock/features'
import { MOCK_ACTIVATIONS } from './config/mock/activations'
import { MOCK_RULES } from './config/mock/rules'
import { MOCK_EXTRACTIONS } from './config/mock/extractions'
import { MOCK_SCENE_FEATURES } from './config/mock/scene-features'
import { MOCK_PROPERTIES } from './config/mock/properties'
import { AntdToastContainer } from './components/Toast'
import Dashboard from './pages/Dashboard'
import PropertyDictionary from './pages/PropertyDictionary'
import EntryPointList from './pages/EntryPointList'
import FeatureList from './pages/FeatureList'
import ActivationList from './pages/ActivationList'
import RuleList from './pages/RuleList'
import PolicyManager from './pages/PolicyManager'
import Overrides from './pages/Overrides'
import ReleaseCandidates from './pages/ReleaseCandidates'
import ReleaseOrders from './pages/ReleaseOrders'
import UserManagement from './pages/UserManagement'
import RoleManagement from './pages/RoleManagement'

// 图标名称 → lucide-react 组件映射
const ICON_MAP = {
  LayoutDashboard, Database, Layers, Globe, Target, GitBranch, Zap,
  Shield, TriangleAlert, FileText, ShoppingCart, List, Settings, User,
}

// DocModal - 还原自 app.js SH 组件（简化版，去掉 markdown 渲染）
function DocModal({ isOpen, onClose, content }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-3 py-3 border-b border-slate-100">
          <div className="flex items-center space-x-2 text-indigo-600">
            <BookOpen className="w-5 h-5" />
            <h3 className="font-bold text-lg">操作文档</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{content}</pre>
        </div>
        <div className="px-3 py-3 bg-slate-50 border-t border-slate-100 rounded-b-xl flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
            关闭文档
          </button>
        </div>
      </div>
    </div>
  )
}

// 内部 App 组件（在 HashRouter 内部使用 hooks）
function AppInner() {
  const navigate = useNavigate()
  const location = useLocation()

  // 当前激活的页面 key（从 location 推导）
  const currentPage = location.pathname.replace(/^\//, '') || 'dashboard'

  // 顶层 state - 还原自 dce 函数
  const [expandedMenus, setExpandedMenus] = useState(['data-config', 'decision-config', 'risk-control', 'release-management', 'system'])
  const [policies, setPolicies] = useState(MOCK_POLICIES)
  const [overrides, setOverrides] = useState(MOCK_OVERRIDES)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [docModalOpen, setDocModalOpen] = useState(false)
  const [orders, setOrders] = useState(MOCK_ORDERS)
  const [drafts, setDrafts] = useState(MOCK_DRAFTS)
  const [releaseResultModal, setReleaseResultModal] = useState({ isOpen: false, order: null })
  const [users, setUsers] = useState(INIT_USERS)
  const [roles, setRoles] = useState(BUILTIN_ROLES)
  const [currentUser, setCurrentUser] = useState(INIT_USERS[0])
  const [userSelectorOpen, setUserSelectorOpen] = useState(false)

  // 额外顶层 state（spec 3.1 要求，供跨页面共享）
  const [entryPoints, setEntryPoints] = useState(MOCK_ENTRY_POINTS)
  const [features, setFeatures] = useState(MOCK_FEATURES)
  const [activations, setActivations] = useState(MOCK_ACTIVATIONS)
  const [rules, setRules] = useState(MOCK_RULES)
  const [extractions, setExtractions] = useState(MOCK_EXTRACTIONS)
  const [sceneFeatures, setSceneFeatures] = useState(MOCK_SCENE_FEATURES)
  const [properties] = useState(MOCK_PROPERTIES)

  // 权限检查
  const hasPerm = (perm) => {
    const role = roles.find(r => r.id === currentUser.roleId)
    return role ? role.permissions.includes(perm) : false
  }
  window.__hasPerm = hasPerm

  // 跨页面回调 - 还原自 dce 函数
  const onSavePolicies = (policy) => {
    setPolicies(prev => {
      const idx = prev.findIndex(p => p.policyId === policy.policyId)
      if (idx >= 0) { const next = [...prev]; next[idx] = policy; return next }
      return [...prev, policy]
    })
  }
  const onDeletePolicy = (policyId) => {
    if (confirm('确定要删除该策略吗？该操作不可恢复。')) {
      setPolicies(prev => prev.filter(p => p.policyId !== policyId))
    }
  }
  const onDeleteOverride = (id) => {
    if (confirm('确定要立即移除该手动干预配置吗？')) {
      setOverrides(prev => prev.filter(o => o.id !== id))
    }
  }
  const onAddOverride = (ov) => {
    setOverrides(prev => [ov, ...prev])
  }
  const onCreateOrder = (order) => {
    setOrders(prev => [order, ...prev])
    setReleaseResultModal({ isOpen: true, order })
  }
  const onUpdateOrder = (updatedOrder) => {
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o))
  }
  const onAddToDrafts = (draft) => {
    const exists = drafts.some(d => d.type === draft.type && d.targetId.toString() === draft.targetId.toString())
    if (exists) {
      alert(`【${draft.targetName}】已在待发布清单中，无需重复添加`)
      return
    }
    setDrafts(prev => [draft, ...prev])
    alert(`已将【${draft.targetName}】加入待发布清单`)
  }
  const onSaveEntryPoint = (ep) => {
    setEntryPoints(prev => {
      const idx = prev.findIndex(e => e.id === ep.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = ep; return next }
      return [...prev, ep]
    })
  }
  const onSaveFeature = (ft) => {
    setFeatures(prev => {
      const idx = prev.findIndex(f => f.id === ft.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = ft; return next }
      return [...prev, ft]
    })
  }
  const onSaveActivation = (act) => {
    setActivations(prev => {
      const idx = prev.findIndex(a => a.id === act.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = act; return next }
      return [...prev, act]
    })
  }
  const onSaveRule = (rule) => {
    setRules(prev => {
      const idx = prev.findIndex(r => r.id === rule.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = rule; return next }
      return [...prev, rule]
    })
  }

  const onSaveExtractions = (epCode, list) => {
    setExtractions(prev => ({ ...prev, [epCode]: list }))
  }
  const onSaveSceneFeatures = (epCode, scenes) => {
    setSceneFeatures(prev => ({ ...prev, [epCode]: scenes }))
  }

  const onDeleteEntryPoint = (id) => {
    setEntryPoints(prev => prev.filter(ep => ep.id !== id))
  }
  const onBatchUpdateEntryPoints = (ids, changes) => {
    setEntryPoints(prev => prev.map(ep => ids.includes(ep.id) ? { ...ep, ...changes } : ep))
  }
  const onBatchDeleteEntryPoints = (ids) => {
    setEntryPoints(prev => prev.filter(ep => !ids.includes(ep.id)))
  }

  // 菜单导航
  const handleMenuClick = (item) => {
    if (item.children) {
      setExpandedMenus(prev => prev.includes(item.key)
        ? prev.filter(k => k !== item.key)
        : [...prev, item.key])
    } else {
      navigate('/' + item.key)
      setSidebarOpen(false)
    }
  }

  // 面包屑 - 还原自 dce 函数 k()
  const renderBreadcrumb = () => {
    let groupLabel = '', pageLabel = ''
    MENU_CONFIG.forEach(item => {
      if (item.key === currentPage) { pageLabel = item.label }
      else if (item.children) {
        const child = item.children.find(c => c.key === currentPage)
        if (child) { groupLabel = item.label; pageLabel = child.label }
      }
    })
    return (
      <nav className="flex text-sm text-slate-500 mb-4" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <span className="hover:text-slate-700">风控配置平台</span>
          </li>
          {groupLabel && (
            <li>
              <div className="flex items-center">
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <span className="ml-1 text-slate-500 md:ml-2">{groupLabel}</span>
              </div>
            </li>
          )}
          <li aria-current="page">
            <div className="flex items-center">
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <span className="ml-1 text-slate-900 font-medium md:ml-2">{pageLabel}</span>
            </div>
          </li>
        </ol>
      </nav>
    )
  }

  // 动态渲染页面组件（避免循环导入，使用延迟导入）
  const renderPage = () => {
    // 将在 Task 5-16 中补充每个页面的导入
    return null
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex font-sans">
      {/* 侧边栏 */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-[#001529] text-slate-300 transition-transform duration-300 ease-in-out transform
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:flex-shrink-0 flex flex-col shadow-xl
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center px-6 bg-[#002140] shadow-sm">
          <div className="flex items-center gap-2 font-bold text-white text-xl tracking-tight">
            <Shield className="w-6 h-6 text-[#1890ff]" />
            <span>风控<span className="text-[#1890ff]">配置平台</span></span>
          </div>
        </div>

        {/* 菜单 */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1">
            {MENU_CONFIG.map(item => {
              // 权限过滤
              let visibleItem = item
              if (item.children) {
                const visibleChildren = item.children.filter(c => !MENU_PERM_MAP[c.key] || hasPerm(MENU_PERM_MAP[c.key]))
                if (visibleChildren.length === 0) return null
                visibleItem = { ...item, children: visibleChildren }
              } else if (MENU_PERM_MAP[item.key] && !hasPerm(MENU_PERM_MAP[item.key])) {
                return null
              }

              const isActive = visibleItem.key === currentPage
              const isExpanded = expandedMenus.includes(visibleItem.key)
              const hasChildren = visibleItem.children && visibleItem.children.length > 0
              const IconComp = ICON_MAP[visibleItem.icon]

              return (
                <li key={visibleItem.key}>
                  <div
                    onClick={() => handleMenuClick(visibleItem)}
                    className={`
                      flex items-center justify-between px-6 py-3 cursor-pointer transition-colors select-none
                      ${!hasChildren && isActive ? 'bg-[#1890ff] text-white' : 'hover:text-white text-slate-400 hover:bg-[#ffffff15]'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      {IconComp && <IconComp className={`w-4 h-4 ${!hasChildren && isActive ? 'text-white' : ''}`} />}
                      <span className="text-sm font-medium">{visibleItem.label}</span>
                    </div>
                    {hasChildren && <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />}
                  </div>
                  {hasChildren && isExpanded && (
                    <ul className="bg-[#000c17] py-2">
                      {visibleItem.children.map(child => {
                        const isChildActive = child.key === currentPage
                        return (
                          <li key={child.key}>
                            <div
                              onClick={() => handleMenuClick(child)}
                              className={`
                                flex items-center px-6 pl-12 py-2.5 cursor-pointer text-sm transition-colors
                                ${isChildActive ? 'bg-[#1890ff] text-white' : 'text-slate-400 hover:text-white hover:bg-[#ffffff15]'}
                              `}
                            >
                              <span className="flex-1">{child.label}</span>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>

        {/* 底部用户切换 */}
        <div className="relative p-4 border-t border-[#ffffff15] bg-[#001529]">
          <div
            onClick={() => setUserSelectorOpen(!userSelectorOpen)}
            className="flex items-center gap-3 px-2 cursor-pointer hover:bg-[#ffffff10] rounded-lg py-2 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[#1890ff] flex items-center justify-center text-white font-bold text-xs shadow-md">
              {currentUser.displayName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{currentUser.displayName}</p>
              <p className="text-xs text-slate-500 truncate">
                {(roles.find(r => r.id === currentUser.roleId) || {}).displayName || currentUser.roleId}
              </p>
            </div>
            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${userSelectorOpen ? 'rotate-180' : ''}`} />
          </div>
          {userSelectorOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1 mx-2 bg-[#002140] rounded-lg shadow-xl border border-[#ffffff15] overflow-hidden">
              <div className="py-1 max-h-60 overflow-y-auto">
                {users.filter(u => u.status === 1).map(u => (
                  <div
                    key={u.id}
                    onClick={() => { setCurrentUser(u); setUserSelectorOpen(false) }}
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${u.id === currentUser.id ? 'bg-[#1890ff20] text-[#1890ff]' : 'text-slate-300 hover:bg-[#ffffff10] hover:text-white'}`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${u.id === currentUser.id ? 'bg-[#1890ff] text-white' : 'bg-[#ffffff20] text-slate-300'}`}>
                      {u.displayName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{u.displayName}</p>
                      <p className="text-xs opacity-60 truncate">{(roles.find(r => r.id === u.roleId) || {}).displayName || ''}</p>
                    </div>
                    {u.id === currentUser.id && <div className="w-2 h-2 rounded-full bg-[#1890ff]" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* 顶栏 */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 z-20">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 -ml-2 text-slate-600" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden md:flex items-center text-slate-500 text-sm gap-2">
              <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-xs border border-green-200">生产环境</span>
              <span className="text-slate-300">|</span>
              <span>v2.5.0</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative hidden sm:block">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="全局搜索..."
                className="pl-9 pr-4 py-1.5 bg-slate-100 border-none rounded-md text-sm focus:ring-2 focus:ring-[#1890ff] w-48 transition-all focus:w-64 outline-none"
              />
            </div>
            <button onClick={() => setDocModalOpen(true)} className="text-slate-500 hover:text-[#1890ff] transition-colors" title="文档">
              <BookOpen className="w-5 h-5" />
            </button>
            <button className="relative text-slate-500 hover:text-[#1890ff] transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
            </button>
          </div>
        </header>

        {/* 内容区 */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-[1600px] mx-auto">
            {renderBreadcrumb()}
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-[#000000d9]">
                {MENU_CONFIG.flatMap(item => item.children ? item.children : item).find(item => item.key === currentPage)?.label}
              </h1>
            </div>
            <div className="animate-in fade-in duration-300 slide-in-from-bottom-2">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/property-dictionary" element={<PropertyDictionary />} />
                <Route path="/event-points" element={<EntryPointList entryPoints={entryPoints} onSaveEntryPoint={onSaveEntryPoint} onDeleteEntryPoint={onDeleteEntryPoint} onBatchUpdateEntryPoints={onBatchUpdateEntryPoints} onBatchDeleteEntryPoints={onBatchDeleteEntryPoints} onAddToDrafts={onAddToDrafts} activations={activations} properties={properties} features={features} extractions={extractions} sceneFeatures={sceneFeatures} onSaveExtractions={onSaveExtractions} onSaveSceneFeatures={onSaveSceneFeatures} />} />
                <Route path="/feature-list" element={<FeatureList features={features} onSaveFeature={onSaveFeature} onAddToDrafts={onAddToDrafts} entryPoints={entryPoints} />} />
                <Route path="/activations" element={<ActivationList activations={activations} onSaveActivation={onSaveActivation} onAddToDrafts={onAddToDrafts} entryPoints={entryPoints} rules={rules} />} />
                <Route path="/rules" element={<RuleList rules={rules} onSaveRule={onSaveRule} onAddToDrafts={onAddToDrafts} activations={activations} />} />
                <Route path="/circuit-breakers" element={<PolicyManager type="CIRCUIT_BREAKER" policies={policies} onSavePolicies={onSavePolicies} onDeletePolicy={onDeletePolicy} />} />
                <Route path="/guardrails" element={<PolicyManager type="GUARDRAIL" policies={policies} onSavePolicies={onSavePolicies} onDeletePolicy={onDeletePolicy} />} />
                <Route path="/overrides" element={<Overrides overrides={overrides} onDeleteOverride={onDeleteOverride} onAddOverride={onAddOverride} />} />
                <Route path="/release-candidates" element={<ReleaseCandidates drafts={drafts} onCreateOrder={onCreateOrder} />} />
                <Route path="/release-orders" element={<ReleaseOrders orders={orders} onUpdateOrder={onUpdateOrder} />} />
                <Route path="/user-management" element={<UserManagement roles={roles} users={users} onUpdateUsers={setUsers} />} />
                <Route path="/role-management" element={<RoleManagement roles={roles} users={users} onUpdateRoles={setRoles} />} />
              </Routes>
            </div>
          </div>
        </main>
      </div>

      {/* 文档弹窗 */}
      <DocModal isOpen={docModalOpen} onClose={() => setDocModalOpen(false)} content="此页面暂无详细操作文档。" />

      {/* 发布单创建成功弹窗 */}
      {releaseResultModal.isOpen && releaseResultModal.order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 flex flex-col items-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CircleCheck className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">发布单创建成功！</h3>
            <p className="text-sm text-slate-500 mb-6 text-center">您的变更请求已生成，请前往发布单列表跟踪审批进度。</p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 w-full mb-6">
              <div className="text-xs text-slate-400 mb-1 uppercase tracking-wide">发布单号</div>
              <div className="font-mono font-bold text-lg text-slate-800 select-all">{releaseResultModal.order.id}</div>
              <div className="text-sm text-slate-600 mt-2 truncate">{releaseResultModal.order.title}</div>
            </div>
            <div className="flex w-full gap-3">
              <button
                onClick={() => setReleaseResultModal({ isOpen: false, order: null })}
                className="flex-1 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
              >
                返回待发布清单
              </button>
              <button
                onClick={() => { setReleaseResultModal({ isOpen: false, order: null }); navigate('/release-orders') }}
                className="flex-1 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
              >
                进入发布单列表<ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        </div>
      )}

      <AntdToastContainer />
    </div>
  )
}


export default function App() {
  return (
    <HashRouter>
      <AppInner />
    </HashRouter>
  )
}
