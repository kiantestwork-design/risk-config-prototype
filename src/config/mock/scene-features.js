// 场景特征绑定 Mock 数据 - 每个接入点的三个场景(PRE/PROCESS/POST)绑定的特征
export const MOCK_SCENE_FEATURES = {
  'EP00000001': {
    PRE: [
      { id: 'sf-1', featureId: 1, featureName: 'user_transaction_history', featureDesc: '用户历史交易记录', action: 'READ', propertyMapping: 'user_id', conditionExpression: '' },
    ],
    PROCESS: [
      { id: 'sf-2', featureId: 101, featureName: 'user_recent_trade_time_7d_rt', featureDesc: '7日内最近交易时间', action: 'WRITE', propertyMapping: 'trade_amount', conditionExpression: 'fact.trade_amount > 0' },
      { id: 'sf-3', featureId: 102, featureName: 'user_login_count_1h', featureDesc: '1小时登录次数', action: 'READ', propertyMapping: 'user_id', conditionExpression: '' },
    ],
    POST: [],
  },
  'EP00000002': {
    PRE: [
      { id: 'sf-4', featureId: 102, featureName: 'user_login_count_1h', featureDesc: '1小时登录次数', action: 'WRITE', propertyMapping: 'user_id', conditionExpression: '' },
    ],
    PROCESS: [],
    POST: [],
  },
  'EP00000003': {
    PRE: [],
    PROCESS: [
      { id: 'sf-5', featureId: 1, featureName: 'user_transaction_history', featureDesc: '用户历史交易记录', action: 'READ', propertyMapping: 'user_id', conditionExpression: '' },
    ],
    POST: [],
  },
}
