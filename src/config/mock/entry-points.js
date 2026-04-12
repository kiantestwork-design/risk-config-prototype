// 接入点 Mock 数据 - 还原自 app.js rn 数组（offset 581397）
export const MOCK_ENTRY_POINTS = [
  { id: 1, eventPoint: 'EP00000001', description: '用户交易事件接入点', status: 1, lifecycleState: 'PUBLISHED', createAt: '2025-01-15 10:30:00', updateAt: '2025-03-28 14:30:00', operator: '张三' },
  { id: 2, eventPoint: 'EP00000002', description: '用户登录事件接入点', status: 1, lifecycleState: 'PUBLISHED', createAt: '2025-01-20 09:00:00', updateAt: '2025-03-27 10:15:00', operator: '李四' },
  { id: 3, eventPoint: 'EP00000003', description: '提现申请事件接入点', status: 2, lifecycleState: 'DRAFT', createAt: '2025-03-01 11:00:00', updateAt: '2025-03-29 09:00:00', operator: '王五' },
  { id: 4, eventPoint: 'EP00000000', description: 'warmUp 预热接入点', status: 1, lifecycleState: 'PUBLISHED', createAt: '2025-01-10 08:00:00', updateAt: '2025-02-15 16:00:00', operator: 'admin' },
]
