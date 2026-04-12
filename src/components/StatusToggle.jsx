// StatusToggle - 还原自 app.js PdStatusToggle 组件
export default function StatusToggle({ enabled, onChange }) {
  return (
    <button
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${enabled ? 'bg-[#1890ff]' : 'bg-[rgba(0,0,0,0.25)]'}`}
      onClick={() => onChange(!enabled)}
    >
      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
    </button>
  )
}
