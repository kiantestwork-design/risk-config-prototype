// 属性提取配置 Mock 数据 - 每个接入点的字段映射
export const MOCK_EXTRACTIONS = {
  'EP00000001': [
    { id: 'ext-1', propertyId: '1', propertyName: 'user_id', propertyDesc: '用户ID', fieldName: 'event.userId', status: 1 },
    { id: 'ext-2', propertyId: '2', propertyName: 'trade_amount', propertyDesc: '交易金额', fieldName: 'event.properties.amount', status: 1 },
    { id: 'ext-3', propertyId: '3', propertyName: 'target_address', propertyDesc: '提现目标地址', fieldName: 'event.properties.toAddress', status: 1 },
    { id: 'ext-4', propertyId: '4', propertyName: 'asset_type', propertyDesc: '币种', fieldName: 'event.properties.currency', status: 1 },
    { id: 'ext-5', propertyId: '5', propertyName: 'client_ip', propertyDesc: '客户端IP', fieldName: 'event.clientIp', status: 1 },
  ],
  'EP00000002': [
    { id: 'ext-6', propertyId: '1', propertyName: 'user_id', propertyDesc: '用户ID', fieldName: 'payload.uid', status: 1 },
    { id: 'ext-7', propertyId: '5', propertyName: 'client_ip', propertyDesc: '客户端IP', fieldName: 'payload.ip', status: 1 },
    { id: 'ext-8', propertyId: '6', propertyName: 'device_id', propertyDesc: '设备ID', fieldName: 'payload.deviceFingerprint', status: 1 },
    { id: 'ext-9', propertyId: '7', propertyName: 'platform', propertyDesc: '登录平台', fieldName: 'payload.platform', status: 1 },
  ],
  'EP00000003': [
    { id: 'ext-10', propertyId: '1', propertyName: 'user_id', propertyDesc: '用户ID', fieldName: 'data.userId', status: 1 },
    { id: 'ext-11', propertyId: '2', propertyName: 'trade_amount', propertyDesc: '交易金额', fieldName: 'data.amount', status: 1 },
    { id: 'ext-12', propertyId: '3', propertyName: 'target_address', propertyDesc: '提现目标地址', fieldName: 'data.withdrawAddress', status: 1 },
  ],
}
