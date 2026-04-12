// 版本历史 Mock 数据 - 还原自 app.js lz 数组（offset 592376）
// 注意：原始数据使用了 {...rn[n]} 展开运算符引用接入点数据
// 这里直接展开为完整数据

const EP1_BASE = { id: 1, eventPoint: 'EP00000001', description: '用户交易事件接入点', status: 1, lifecycleState: 'PUBLISHED', createAt: '2025-01-15 10:30:00', updateAt: '2025-03-28 14:30:00', operator: '张三' }
const EP2_BASE = { id: 2, eventPoint: 'EP00000002', description: '用户登录事件接入点', status: 1, lifecycleState: 'PUBLISHED', createAt: '2025-01-20 09:00:00', updateAt: '2025-03-27 10:15:00', operator: '李四' }
const EP3_BASE = { id: 3, eventPoint: 'EP00000003', description: '提现申请事件接入点', status: 2, lifecycleState: 'DRAFT', createAt: '2025-03-01 11:00:00', updateAt: '2025-03-29 09:00:00', operator: '王五' }
const EP4_BASE = { id: 4, eventPoint: 'EP00000000', description: 'warmUp 预热接入点', status: 1, lifecycleState: 'PUBLISHED', createAt: '2025-01-10 08:00:00', updateAt: '2025-02-15 16:00:00', operator: 'admin' }

export const MOCK_VERSIONS = [
  { id: 'ep-v3', eventPointId: 1, version: 3, content: { ...EP1_BASE }, commitMessage: '更新描述信息', editor: '张三', createAt: '2025-03-28 14:30:00' },
  { id: 'ep-v2', eventPointId: 1, version: 2, content: { ...EP1_BASE, description: '用户交易事件接入点（旧版）', lifecycleState: 'ARCHIVED', updateAt: '2025-02-15 10:00:00' }, commitMessage: '启用接入点', editor: 'admin', createAt: '2025-02-15 10:00:00' },
  { id: 'ep-v1', eventPointId: 1, version: 1, content: { ...EP1_BASE, description: '交易事件接入点（初始版）', status: 2, lifecycleState: 'ARCHIVED', updateAt: '2025-01-15 10:30:00' }, commitMessage: '初始创建', editor: '张三', createAt: '2025-01-15 10:30:00' },
  { id: 'ep2-v3', eventPointId: 2, version: 3, content: { ...EP2_BASE, description: '用户登录事件接入点（调优中）', lifecycleState: 'DRAFT', updateAt: '2025-03-29 08:30:00' }, commitMessage: '调整登录风控参数', editor: '李四', createAt: '2025-03-29 08:30:00' },
  { id: 'ep2-v2', eventPointId: 2, version: 2, content: { ...EP2_BASE }, commitMessage: '发布登录接入点', editor: '李四', createAt: '2025-03-27 10:15:00' },
  { id: 'ep2-v1', eventPointId: 2, version: 1, content: { ...EP2_BASE, description: '登录事件接入点（初始版）', status: 2, lifecycleState: 'ARCHIVED', updateAt: '2025-01-20 09:00:00' }, commitMessage: '初始创建', editor: '李四', createAt: '2025-01-20 09:00:00' },
  { id: 'ep3-v1', eventPointId: 3, version: 1, content: { ...EP3_BASE }, commitMessage: '初始创建提现接入点', editor: '王五', createAt: '2025-03-01 11:00:00' },
  { id: 'ep4-v3', eventPointId: 4, version: 3, content: { ...EP4_BASE, description: '预热接入点（优化配置）', lifecycleState: 'DRAFT', updateAt: '2025-03-10 14:00:00' }, commitMessage: '优化预热策略配置', editor: 'admin', createAt: '2025-03-10 14:00:00' },
  { id: 'ep4-v2', eventPointId: 4, version: 2, content: { ...EP4_BASE }, commitMessage: '发布预热接入点', editor: 'admin', createAt: '2025-02-15 16:00:00' },
  { id: 'ep4-v1', eventPointId: 4, version: 1, content: { ...EP4_BASE, description: 'warmUp 预热接入点（初始版）', status: 2, lifecycleState: 'ARCHIVED', updateAt: '2025-01-10 08:00:00' }, commitMessage: '初始创建', editor: 'admin', createAt: '2025-01-10 08:00:00' },
]
