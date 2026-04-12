// 发布单 & 待发布草稿 Mock 数据 - 还原自 app.js iz/oz 数组

// 发布单列表（iz）
export const MOCK_ORDERS = [
  {
    id: 'REL-20251101-002',
    title: '双11大促策略集调整 - 第一波',
    items: [
      { type: 'POLICY', targetId: 'GR-2025-033', targetName: 'guard_ep01_pass_rate', relatedKeys: 'EP00000001', changeSummary: '收紧护栏阈值，从下降60%改为下降40%，提高敏感度。' },
      { type: 'FEATURE', targetId: '102', targetName: 'user_login_count_1h', relatedKeys: 'EP00000002', changeSummary: '新增登录聚合特征，用于防暴力破解。' },
    ],
    status: 'PENDING',
    applicant: 'risk_ops',
    applyTime: '2025-11-01 09:15:00',
    description: '针对双11大促流量高峰的防御策略调整，包含一条护栏策略收紧和一个新特征上线。',
  },
  {
    id: 'REL-20251101-003',
    title: '修复交易金额解析异常',
    items: [
      { type: 'FEATURE', targetId: '1', targetName: 'user_transaction_history', relatedKeys: 'EP00000001', changeSummary: 'Hotfix: 修复 JsonPath 路径错误导致的金额为空问题。' },
    ],
    status: 'APPROVED',
    applicant: 'dev_user',
    approver: 'admin_lead',
    applyTime: '2025-11-01 10:30:00',
    description: '紧急修复线上 Bug，已在 Staging 环境验证通过。',
  },
  {
    id: 'REL-20251028-001',
    title: '用户交易特征与规则联合发布',
    items: [
      { type: 'FEATURE', targetId: 'user_transaction_history', targetName: '用户交易记录历史存储', relatedKeys: 'EP00000001', changeSummary: '优化了交易ID的提取逻辑，修复空指针问题。' },
    ],
    status: 'PUBLISHED',
    applicant: 'dev_user',
    approver: 'admin',
    applyTime: '2025-10-28 10:00:00',
    finishTime: '2025-10-28 10:30:00',
    description: '本次发布包含特征修复及相关联的规则更新，旨在解决线上NPE问题并加强大额风控。',
  },
  {
    id: 'REL-20251030-999',
    title: '测试用的废弃策略',
    items: [
      { type: 'POLICY', targetId: 'CB-FAKE-001', targetName: 'test_circuit_breaker', changeSummary: '测试熔断配置' },
    ],
    status: 'REJECTED',
    applicant: 'intern_user',
    approver: 'admin',
    applyTime: '2025-10-30 14:00:00',
    finishTime: '2025-10-30 14:05:00',
    description: '测试单，请忽略。',
  },
]

// 待发布草稿（oz）
export const MOCK_DRAFTS = [
  {
    id: 'DFT-001',
    type: 'FEATURE',
    targetId: '101',
    targetName: 'user_recent_trade_time_7d_rt',
    version: 'v4',
    relatedKeys: 'EP00000001',
    changeSummary: '修改了TTL时间为14天',
    updatedAt: '2025-10-28 15:30:00',
    editor: 'dev_user',
  },
  {
    id: 'DFT-002',
    type: 'POLICY',
    targetId: 'CB-2025-001',
    targetName: 'feature_cb_transaction_history',
    version: 'v2',
    relatedKeys: 'user_transaction_history',
    changeSummary: '放宽了熔断阈值，从40%调整为60%',
    updatedAt: '2025-10-28 16:00:00',
    editor: 'admin',
  },
]
