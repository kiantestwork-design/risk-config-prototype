// 规则 Mock 数据 - 还原自 app.js Or 数组（offset 586849）
export const MOCK_RULES = [
  {
    id: 1,
    name: 'rule_high_amount',
    description: '大额交易检测',
    conditionExpression: { logic: 'AND', groups: [{ logic: 'AND', conditions: [
      { field: 'properties.amount', operator: 'GTE', value: '10000' },
      { field: 'properties.currency', operator: 'EQ', value: 'USDT' },
      { field: 'features.user_txn_count_24h', operator: 'GT', value: '5' },
    ]}]},
    initScore: 20, baseNum: 10, operator: 'ADD', valueField: 'amount', max: 50, rate: 1.5,
    status: 1, lifecycleState: 'PUBLISHED',
    actions: [
      { actionName: 'action_tag_risk', actionType: 'TAG', executionMode: 'sync', actionConfig: '{"tag":"high_amount","value":true}', priority: 1 },
      { actionName: 'action_http_callback', actionType: 'HTTP', executionMode: 'async', actionConfig: '{"url":"https://alert.example.com/hook","method":"POST","contentType":"application/json","timeout":"3000","retryCount":"1","paramMapping":"userId=event.userId,amount=event.properties.amount,riskScore=result.score","constants":"source=risk_engine,channel=app","fallback":"{\"code\":200,\"action\":\"skip\"}"}', priority: 2 },
    ],
    createAt: '2025-02-20 16:00:00', updateAt: '2025-03-28 14:30:00', editOperator: '张三',
  },
  {
    id: 2,
    name: 'rule_freq_check',
    description: '高频交易检测',
    conditionExpression: { logic: 'AND', groups: [{ logic: 'AND', conditions: [
      { field: 'features.user_txn_count_24h', operator: 'GTE', value: '20' },
    ]}]},
    initScore: 15, baseNum: 5, operator: 'MUL', valueField: 'features.user_txn_count_24h', max: 45, rate: 1,
    status: 1, lifecycleState: 'PUBLISHED',
    actions: [
      { actionName: 'action_tag_risk', actionType: 'TAG', executionMode: 'sync', actionConfig: '{"tag":"high_freq","value":true}', priority: 1 },
    ],
    createAt: '2025-02-22 10:00:00', updateAt: '2025-03-27 16:45:00', editOperator: '李四',
  },
  {
    id: 3,
    name: 'rule_model_evaluation',
    description: '模型评分规则',
    conditionExpression: { logic: 'AND', groups: [] },
    initScore: 0, baseNum: 0, operator: 'NONE', valueField: 'features.model_score', max: null, rate: 1,
    status: 1, lifecycleState: 'PUBLISHED',
    actions: [
      { actionName: 'action_dubbo_invoke', actionType: 'DUBBO', executionMode: 'async', actionConfig: '{"service":"com.example.risk.ModelAlertService","method":"sendAlert","group":"risk","version":"1.0.0","timeout":"5000","retryCount":"1","paramMapping":"userId=event.userId,modelScore=features.model_score,ruleName=rule.name","constants":"bizType=model_alert,channel=internal","fallback":"{\"score\":0,\"action\":\"skip\"}"}', priority: 1 },
    ],
    createAt: '2025-03-01 11:00:00', updateAt: '2025-03-25 09:00:00', editOperator: '张三',
  },
  {
    id: 4,
    name: 'rule_new_device_login',
    description: '新设备登录检测',
    conditionExpression: { logic: 'AND', groups: [{ logic: 'AND', conditions: [
      { field: 'properties.isNewDevice', operator: 'EQ', value: 'true' },
      { field: 'properties.loginType', operator: 'NEQ', value: 'BIOMETRIC' },
    ]}]},
    initScore: 30, baseNum: 0, operator: 'NONE', valueField: '', max: null, rate: 1,
    status: 2, lifecycleState: 'DRAFT',
    actions: [
      { actionName: 'action_dubbo_invoke', actionType: 'DUBBO', executionMode: 'async', actionConfig: '{"service":"com.example.risk.DeviceRiskService","method":"onNewDevice","group":"risk","version":"1.0.0","timeout":"3000","retryCount":"0","paramMapping":"userId=event.userId,deviceId=event.properties.deviceId,loginType=event.properties.loginType","constants":"bizType=new_device,notify=true","fallback":"{\"handled\":false,\"reason\":\"dubbo_timeout\"}"}', priority: 1 },
    ],
    createAt: '2025-03-15 14:00:00', updateAt: '2025-03-29 11:20:00', editOperator: '王五',
  },
  {
    id: 5,
    name: 'rule_amount_threshold',
    description: '交易金额阈值规则',
    conditionExpression: { logic: 'OR', groups: [
      { logic: 'AND', conditions: [{ field: 'properties.amount', operator: 'GTE', value: '50000' }] },
      { logic: 'AND', conditions: [
        { field: 'properties.amount', operator: 'GTE', value: '10000' },
        { field: 'properties.toAddress', operator: 'IN', value: 'blacklist_addresses' },
      ]},
    ]},
    initScore: 40, baseNum: 0, operator: 'ADD', valueField: '', max: 80, rate: 1,
    status: 1, lifecycleState: 'PUBLISHED',
    actions: [
      { actionName: 'action_tag_risk', actionType: 'TAG', executionMode: 'sync', actionConfig: '{"tag":"amount_threshold","value":true}', priority: 1 },
      { actionName: 'action_http_callback', actionType: 'HTTP', executionMode: 'async', actionConfig: '{"url":"https://alert.example.com/large-txn","method":"POST","contentType":"application/json","timeout":"5000","retryCount":"2","paramMapping":"userId=event.userId,txnId=event.properties.txnId,amount=event.properties.amount","constants":"source=risk_engine,alertLevel=high","fallback":"{\"code\":200,\"action\":\"pass\",\"reason\":\"http_fallback\"}"}', priority: 2 },
      { actionName: 'action_dubbo_invoke', actionType: 'DUBBO', executionMode: 'async', actionConfig: '{"service":"com.example.risk.TxnAlertService","method":"alertLargeTxn","group":"risk","version":"2.0.0","timeout":"5000","retryCount":"2","paramMapping":"userId=event.userId,amount=event.properties.amount,txnId=event.properties.txnId","constants":"bizType=large_txn,alertLevel=critical","fallback":"{\"alerted\":false,\"reason\":\"dubbo_error\"}"}', priority: 3 },
    ],
    createAt: '2025-02-25 10:00:00', updateAt: '2025-03-26 14:00:00', editOperator: '李四',
  },
]
