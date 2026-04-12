// 权限配置 - 还原自 app.js PropertyDictionaryPage 区段（offset ~1237623）

export const PERM_GROUPS = [
  { key: 'data-config', label: '数据配置', perms: [
    { key: 'ep:view', label: '接入点 - 查看' },
    { key: 'ep:edit', label: '接入点 - 编辑' },
    { key: 'feature:view', label: '特征 - 查看' },
    { key: 'feature:edit', label: '特征 - 编辑' },
  ]},
  { key: 'decision-config', label: '决策配置', perms: [
    { key: 'activation:view', label: '策略 - 查看' },
    { key: 'activation:edit', label: '策略 - 编辑' },
    { key: 'rule:view', label: '规则 - 查看' },
    { key: 'rule:edit', label: '规则 - 编辑' },
  ]},
  { key: 'risk-control', label: '风控策略', perms: [
    { key: 'policy:view', label: '策略 - 查看' },
    { key: 'policy:edit', label: '策略 - 编辑' },
  ]},
  { key: 'release-management', label: '发布管理', perms: [
    { key: 'release:view', label: '发布 - 查看' },
    { key: 'release:approve', label: '发布 - 审批' },
  ]},
  { key: 'system', label: '系统管理', perms: [
    { key: 'user:view', label: '用户 - 查看' },
    { key: 'user:edit', label: '用户 - 编辑' },
    { key: 'role:view', label: '角色 - 查看' },
    { key: 'role:edit', label: '角色 - 编辑' },
  ]},
]

export const ALL_PERMS = PERM_GROUPS.flatMap(g => g.perms.map(p => p.key))

export const BUILTIN_ROLES = [
  { id: 1, name: 'admin', displayName: '管理员', description: '拥有系统全部权限', permissions: [...ALL_PERMS], isBuiltin: true },
  { id: 2, name: 'release_manager', displayName: '发布经理', description: '可查看所有配置，审批发布单', permissions: ALL_PERMS.filter(p => p.endsWith(':view') || p === 'release:approve'), isBuiltin: true },
  { id: 3, name: 'developer', displayName: '开发者', description: '可编辑风控配置，不可审批发布', permissions: ALL_PERMS.filter(p => p !== 'release:approve' && p !== 'user:edit' && p !== 'role:edit'), isBuiltin: true },
  { id: 4, name: 'viewer', displayName: '观察者', description: '只读权限，仅可查看', permissions: ALL_PERMS.filter(p => p.endsWith(':view')), isBuiltin: true },
]

export const INIT_USERS = [
  { id: 1, username: 'admin', displayName: '系统管理员', email: 'admin@example.com', roleId: 1, status: 1, createAt: '2025-01-01 00:00:00', lastLoginAt: '2025-03-28 09:30:00' },
  { id: 2, username: 'zhang.san', displayName: '张三', email: 'zhang.san@example.com', roleId: 3, status: 1, createAt: '2025-01-15 10:00:00', lastLoginAt: '2025-03-28 14:20:00' },
  { id: 3, username: 'li.si', displayName: '李四', email: 'li.si@example.com', roleId: 2, status: 1, createAt: '2025-02-01 09:00:00', lastLoginAt: '2025-03-27 16:45:00' },
  { id: 4, username: 'wang.wu', displayName: '王五', email: 'wang.wu@example.com', roleId: 4, status: 2, createAt: '2025-03-01 11:00:00', lastLoginAt: '2025-03-20 10:00:00' },
]

export const MENU_PERM_MAP = {
  'property-dictionary': 'feature:view',
  'event-points': 'ep:view',
  'feature-list': 'feature:view',
  activations: 'activation:view',
  rules: 'rule:view',
  'circuit-breakers': 'policy:view',
  guardrails: 'policy:view',
  overrides: 'policy:view',
  'release-candidates': 'release:view',
  'release-orders': 'release:view',
  'user-management': 'user:view',
  'role-management': 'role:view',
}

export const EDIT_PERM_MAP = {
  'property-dictionary': 'feature:edit',
  'event-points': 'ep:edit',
  'feature-list': 'feature:edit',
  activations: 'activation:edit',
  rules: 'rule:edit',
  'user-management': 'user:edit',
  'role-management': 'role:edit',
}
