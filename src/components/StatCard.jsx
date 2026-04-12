// StatCard - 还原自 app.js kv 组件（Dashboard 统计卡片）
export default function StatCard({ title, value, subtext, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
          <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        <span className="text-2xl font-bold text-slate-800">{value}</span>
      </div>
      <h3 className="text-sm font-medium text-slate-500">{title}</h3>
      <p className="text-xs text-slate-400 mt-1">{subtext}</p>
    </div>
  )
}
