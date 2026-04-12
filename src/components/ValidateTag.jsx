// ValidateTag - 还原自 app.js PdValidateTag 组件
export const PD_VALIDATE_TYPES = [
  { value: '', label: '不校验' },
  { value: 'STRING', label: '字符串' },
  { value: 'INTEGER', label: '整数' },
  { value: 'LONG', label: '长整数' },
  { value: 'DOUBLE', label: '数字' },
  { value: 'BOOLEAN', label: '布尔' },
  { value: 'LENGTH', label: '长度校验' },
  { value: 'MOBILE', label: '手机号' },
  { value: 'EMAIL', label: '邮箱' },
  { value: 'IP', label: 'IP 地址' },
  { value: 'REGEX', label: '正则表达式' },
]

export default function ValidateTag({ type, args }) {
  if (!type) return <span className="text-[rgba(0,0,0,0.25)]">-</span>
  const label = (PD_VALIDATE_TYPES.find(t => t.value === type) || {}).label || type
  return (
    <span className="inline-flex items-center gap-1 text-xs text-[rgba(0,0,0,0.65)]">
      <span className="px-1.5 py-0.5 rounded bg-[#f5f5f5]">{label}</span>
      {args && <code className="text-[#722ed1] bg-[#f9f0ff] px-1 py-0.5 rounded">{args}</code>}
    </span>
  )
}
