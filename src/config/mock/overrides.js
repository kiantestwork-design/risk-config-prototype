// 手动干预 Mock 数据 - 还原自 app.js nz 数组（offset 574790）
export const MOCK_OVERRIDES = [
  {
    id: 'OVR-001',
    scope: { level: 'ACTIVATION', activationName: 'warmUp' },
    manualState: 'MANUAL_OPEN',
    ttlSeconds: 600,
    operator: 'sre_oncall',
    remark: 'warmUp 预热策略异常，紧急阻断所有请求',
    createdAt: '2025-05-14 15:00:00',
  },
]
