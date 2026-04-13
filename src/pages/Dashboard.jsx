// Dashboard 页面 - 还原自 app.js ez 组件（offset 565248，~5K）
import { ShieldAlert, Zap, Activity, CircleCheckBig } from 'lucide-react'
import StatCard from '../components/StatCard'
import {
  ResponsiveContainer, ComposedChart, CartesianGrid,
  XAxis, YAxis, Tooltip, Area, Line,
} from 'recharts'

const CHART_DATA = [
  { name: '10:00', qps: 4000, failure: 20, rejected: 150 },
  { name: '10:05', qps: 3000, failure: 18, rejected: 130 },
  { name: '10:10', qps: 2000, failure: 200, rejected: 180 },
  { name: '10:15', qps: 2780, failure: 40, rejected: 200 },
  { name: '10:20', qps: 1890, failure: 25, rejected: 170 },
  { name: '10:25', qps: 2390, failure: 20, rejected: 160 },
  { name: '10:30', qps: 3490, failure: 22, rejected: 155 },
]

const ALERTS = [
  { time: '10:12:05', msg: '服务熔断触发: win_txn_count (超时)', type: 'critical' },
  { time: '10:11:30', msg: '业务护栏预警: warmUpRule01 命中率激增', type: 'warning' },
  { time: '09:45:00', msg: '手动干预过期: activation_transaction_v1', type: 'info' },
  { time: '09:30:22', msg: '特征缺失率 > 5%: user_ip_entropy_ep02', type: 'warning' },
]

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="生效策略数" value="142" subtext="12 个策略待审批" icon={ShieldAlert} color="bg-blue-500" />
        <StatCard title="当前熔断数" value="3" subtext="2 自动触发, 1 手动干预" icon={Zap} color="bg-red-500" />
        <StatCard title="系统 QPS" value="45.2k" subtext="平均耗时 12ms" icon={Activity} color="bg-indigo-500" />
        <StatCard title="特征缺失率" value="0.04%" subtext="user_transaction_history 正常" icon={CircleCheckBig} color="bg-emerald-500" />
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 实时流量图表 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">实时流量与异常监控</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={CHART_DATA}>
                <defs>
                  <linearGradient id="colorQps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="qps" stroke="#6366f1" fillOpacity={1} fill="url(#colorQps)" strokeWidth={2} name="总QPS" />
                <Line type="monotone" dataKey="failure" stroke="#ef4444" strokeWidth={2} dot={false} name="异常数" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 最近告警 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">最近告警</h3>
          <div className="space-y-4">
            {ALERTS.map((alert, i) => (
              <div key={i} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-md">
                <div className={`mt-1 w-2 h-2 rounded-full ${alert.type === 'critical' ? 'bg-red-500' : alert.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                <div>
                  <p className="text-sm font-medium text-slate-800">{alert.msg}</p>
                  <p className="text-xs text-slate-500">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
