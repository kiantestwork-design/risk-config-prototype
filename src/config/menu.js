// 菜单配置 - 还原自 app.js gE 数组
// icon 字段为字符串，在 App.jsx 中映射为 lucide-react 组件
export const MENU_CONFIG = [
  { key: 'dashboard', label: '监控大盘', icon: 'LayoutDashboard' },
  {
    key: 'data-config', label: '数据配置', icon: 'Database',
    children: [
      { key: 'property-dictionary', label: '标准属性字典', icon: 'Layers' },
      { key: 'event-points', label: '接入点管理', icon: 'Globe' },
      { key: 'feature-list', label: '特征管理', icon: 'Layers' },
    ]
  },
  {
    key: 'decision-config', label: '决策配置', icon: 'Target',
    children: [
      { key: 'activations', label: '策略管理', icon: 'GitBranch' },
      { key: 'rules', label: '规则管理', icon: 'Zap' },
    ]
  },
  {
    key: 'risk-control', label: '风控策略', icon: 'Shield',
    children: [
      { key: 'circuit-breakers', label: '服务熔断策略', icon: 'Zap' },
      { key: 'guardrails', label: '业务护栏策略', icon: 'Shield' },
      { key: 'overrides', label: '手动干预管理', icon: 'TriangleAlert' },
    ]
  },
  {
    key: 'release-management', label: '发布管理', icon: 'FileText',
    children: [
      { key: 'release-candidates', label: '待发布清单', icon: 'ShoppingCart' },
      { key: 'release-orders', label: '发布单列表', icon: 'List' },
    ]
  },
  {
    key: 'system', label: '系统管理', icon: 'Settings',
    children: [
      { key: 'user-management', label: '用户管理', icon: 'User' },
      { key: 'role-management', label: '角色管理', icon: 'Shield' },
    ]
  },
]
