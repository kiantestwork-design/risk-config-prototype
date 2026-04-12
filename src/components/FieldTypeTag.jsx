// FieldTypeTag - 还原自 app.js PdFieldTypeTag 组件
const TYPE_STYLES = {
  STRING:  { color: '#1890ff', bg: '#e6f7ff' },
  INTEGER: { color: '#722ed1', bg: '#f9f0ff' },
  LONG:    { color: '#722ed1', bg: '#f9f0ff' },
  DOUBLE:  { color: '#fa8c16', bg: '#fff7e6' },
  BOOLEAN: { color: '#52c41a', bg: '#f6ffed' },
  LIST:    { color: '#13c2c2', bg: '#e6fffb' },
  JSON:    { color: '#eb2f96', bg: '#fff0f6' },
}

export default function FieldTypeTag({ type }) {
  const style = TYPE_STYLES[type] || TYPE_STYLES.STRING
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono whitespace-nowrap flex-shrink-0"
      style={{ color: style.color, background: style.bg, border: `1px solid ${style.color}25` }}
    >
      {type}
    </span>
  )
}
